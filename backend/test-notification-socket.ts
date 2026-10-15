import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createNotificationSocketServer, NotificationSocketDependencies } from './src/notifications-socket';
import { DbUser } from './src/repositories/user.repository';
import { DbNotification } from './src/repositories/notification.repository';

const doctorUser: DbUser = {
  id: '22222222-2222-2222-2222-222222222222',
  auth_user_id: 'auth-doctor',
  email: 'doctor@example.test',
  phone: null,
  role: 'doctor',
  first_name: 'Doc',
  last_name: 'Tor',
  avatar_url: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const patientUser: DbUser = {
  id: '11111111-1111-1111-1111-111111111111',
  auth_user_id: 'auth-patient',
  email: 'patient@example.test',
  phone: null,
  role: 'patient',
  first_name: 'Pat',
  last_name: 'Ient',
  avatar_url: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

function testDependencies(): NotificationSocketDependencies {
  return {
    authenticateToken: async (token: string) => {
      if (token === 'doctor-token') return doctorUser;
      if (token === 'patient-token') return patientUser;
      throw new Error('Invalid token');
    },
  };
}

async function run() {
  const server = http.createServer();
  const notificationWs = createNotificationSocketServer(testDependencies());

  server.on('upgrade', (req, socket, head) => {
    if (!notificationWs.handleUpgrade(req, socket, head)) {
      socket.destroy();
    }
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const wsUrl = `ws://127.0.0.1:${address.port}/api/v1/notifications/stream`;

  try {
    // 1. Connection without token must be closed/rejected
    {
      const ws = new WebSocket(wsUrl);
      const code = await new Promise<number>((resolve) => {
        ws.once('close', (c) => resolve(c));
        ws.once('error', () => resolve(1006));
      });
      assert.equal(code, 1006);
      console.log('PASS: Rejects connection without token');
    }

    // 2. Connection with invalid token must be closed with 4401
    {
      const ws = new WebSocket(wsUrl, ['dd-auth', 'invalid-token']);
      const [code] = await once(ws, 'close');
      assert.equal(code, 4401);
      console.log('PASS: Rejects connection with invalid token');
    }

    // 3. Connection with valid token via subprotocol
    const doctorWs = new WebSocket(wsUrl, ['dd-auth', 'doctor-token']);
    const [docAuthMsgRaw] = await once(doctorWs, 'message');
    const docAuthMsg = JSON.parse(docAuthMsgRaw.toString());
    assert.equal(docAuthMsg.type, 'authenticated');
    assert.equal(docAuthMsg.userId, doctorUser.id);
    console.log('PASS: Authenticates doctor via subprotocol');

    // 4. Connection with valid token via query param
    const patientWs = new WebSocket(`${wsUrl}?token=patient-token`);
    const [patAuthMsgRaw] = await once(patientWs, 'message');
    const patAuthMsg = JSON.parse(patAuthMsgRaw.toString());
    assert.equal(patAuthMsg.type, 'authenticated');
    assert.equal(patAuthMsg.userId, patientUser.id);
    console.log('PASS: Authenticates patient via query parameter');

    // 5. Ping / Pong
    doctorWs.send(JSON.stringify({ type: 'ping' }));
    const [pongMsgRaw] = await once(doctorWs, 'message');
    const pongMsg = JSON.parse(pongMsgRaw.toString());
    assert.equal(pongMsg.type, 'pong');
    console.log('PASS: Responds to ping with pong');

    // 6. Broadcast notification targeted only to doctor
    const doctorNotif: DbNotification = {
      id: 'notif-1',
      recipient_user_id: doctorUser.id,
      type: 'new_appointment_booked',
      title: 'New appointment booked',
      message: 'A patient has booked one of your available appointment slots.',
      appointment_id: 'appt-123',
      consultation_id: null,
      prescription_id: null,
      doctor_id: 'doc-1',
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    let patientReceived = false;
    patientWs.on('message', () => {
      patientReceived = true;
    });

    notificationWs.broadcastNotification(doctorNotif);

    const [receivedMsgRaw] = await once(doctorWs, 'message');
    const receivedMsg = JSON.parse(receivedMsgRaw.toString());
    assert.equal(receivedMsg.type, 'notification');
    assert.equal(receivedMsg.notification.id, 'notif-1');
    assert.equal(receivedMsg.notification.title, 'New appointment booked');
    assert.equal(patientReceived, false, 'Patient must NOT receive doctor notifications');
    console.log('PASS: Real-time notification routed accurately to recipient');

    // 7. Broadcast read
    notificationWs.broadcastRead(doctorUser.id, 'notif-1');
    const [readMsgRaw] = await once(doctorWs, 'message');
    const readMsg = JSON.parse(readMsgRaw.toString());
    assert.equal(readMsg.type, 'notification_read');
    assert.equal(readMsg.id, 'notif-1');
    console.log('PASS: Real-time notification_read broadcast received');

    doctorWs.close();
    patientWs.close();
  } finally {
    notificationWs.close();
    server.close();
    await once(server, 'close');
  }

  console.log('All notification WebSocket tests passed successfully!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
