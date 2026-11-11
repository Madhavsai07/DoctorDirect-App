import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { Request, Response } from 'express';
import type { DbConsultationDetail } from './src/repositories/consultation.repository';
import type { DbUser } from './src/repositories/user.repository';
import { createIceServerHandler } from './src/routes/consultation.route';
import { ConsultationService } from './src/services/consultation.service';
import type { IceServerConfiguration } from './src/services/ice-servers.service';
import { createTurnCredentials } from './src/services/turn-credentials.service';
import { doctorService } from './src/services/doctor.service';

const consultationId = '11111111-1111-1111-1111-111111111111';
const patientUserId = '22222222-2222-2222-2222-222222222222';
const doctorUserId = '33333333-3333-3333-3333-333333333333';
const otherDoctorUserId = '44444444-4444-4444-4444-444444444444';
const providerPassword = 'test-static-provider-password';
const restSecret = 'test-only-server-shared-secret-long-enough';
const consultation = {
  id: consultationId,
  status: 'in_progress',
  appointment_status: 'in_progress',
  doctor_id: 'doctor-profile-1',
  patient_user_id: patientUserId,
} as DbConsultationDetail;

function makeUser(id: string, role: DbUser['role']): DbUser {
  return {
    id,
    email: `${role}@example.test`,
    phone: null,
    role,
    first_name: role,
    last_name: 'Test',
    avatar_url: null,
    is_active: true,
    created_at: new Date(0),
    updated_at: new Date(0),
  };
}

function makeService(record = consultation): ConsultationService {
  return new ConsultationService(
    { findConsultationById: async () => record },
    {
      getDoctorProfileByUserId: async (id) => ({
        doctor_id: id === doctorUserId ? 'doctor-profile-1' : 'doctor-profile-other',
      } as Awaited<ReturnType<typeof doctorService.getDoctorProfileByUserId>>),
    },
  );
}

async function invokeIceHandler(
  handler: ReturnType<typeof createIceServerHandler>,
  user?: DbUser,
  id = consultationId,
): Promise<{ status: number; body?: unknown; error?: unknown; headers: Record<string, string> }> {
  const result: { status: number; body?: unknown; error?: unknown; headers: Record<string, string> } = {
    status: 200,
    headers: {},
  };
  const request = { params: { consultationId: id }, user } as unknown as Request;
  const response = {
    set(name: string, value: string) {
      result.headers[name] = value;
      return this;
    },
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  } as unknown as Response;
  await handler(request, response, (error?: unknown) => {
    result.error = error;
  });
  return result;
}

const staticConfiguration: IceServerConfiguration = {
  webrtcStunUrls: ['stun:stun.l.google.com:19302'],
  webrtcTurnUrls: ['turn:free.expressturn.com:3478?transport=udp'],
  webrtcTurnAuthMode: 'static',
  webrtcTurnUsername: 'test-provider-user',
  webrtcTurnPassword: providerPassword,
  webrtcTurnSharedSecret: undefined,
  webrtcTurnCredentialTtlSeconds: 3600,
};

async function run(): Promise<void> {
  const patient = makeUser(patientUserId, 'patient');
  const doctor = makeUser(doctorUserId, 'doctor');
  const patientService = makeService();
  const staticHandler = createIceServerHandler(
    staticConfiguration,
    patientService.getConsultationById.bind(patientService),
  );

  const staticResult = await invokeIceHandler(staticHandler, patient);
  assert.equal(staticResult.status, 200);
  assert.equal(staticResult.error, undefined);
  assert.equal(staticResult.headers['Cache-Control'], 'no-store');
  const staticServers = (staticResult.body as { iceServers: Array<Record<string, unknown>> }).iceServers;
  assert.deepEqual(staticServers[0], { urls: ['stun:stun.l.google.com:19302'] });
  assert.deepEqual(staticServers[1], {
    urls: ['turn:free.expressturn.com:3478?transport=udp'],
    username: 'test-provider-user',
    credential: providerPassword,
  });

  const doctorService = makeService();
  const doctorResult = await invokeIceHandler(
    createIceServerHandler(staticConfiguration, doctorService.getConsultationById.bind(doctorService)),
    doctor,
  );
  assert.equal(doctorResult.status, 200, 'the assigned doctor may retrieve ICE credentials');

  const unauthorizedService = makeService();
  const unauthorizedHandler = createIceServerHandler(
    staticConfiguration,
    unauthorizedService.getConsultationById.bind(unauthorizedService),
  );
  const unauthorizedResult = await invokeIceHandler(
    unauthorizedHandler,
    makeUser(otherDoctorUserId, 'doctor'),
  );
  assert.equal(unauthorizedResult.status, 200);
  assert.equal((unauthorizedResult.error as { status?: number }).status, 403);
  assert.equal(unauthorizedResult.body, undefined, 'unauthorized users receive no ICE credentials');

  const adminService = makeService();
  const adminResult = await invokeIceHandler(
    createIceServerHandler(staticConfiguration, adminService.getConsultationById.bind(adminService)),
    makeUser('55555555-5555-5555-5555-555555555555', 'admin'),
  );
  assert.equal((adminResult.error as { status?: number }).status, 403, 'admins are not consultation participants');
  assert.equal(adminResult.body, undefined);

  const inactiveRecord = { ...consultation, status: 'completed' } as DbConsultationDetail;
  const inactiveService = makeService(inactiveRecord);
  const inactiveResult = await invokeIceHandler(
    createIceServerHandler(staticConfiguration, inactiveService.getConsultationById.bind(inactiveService)),
    patient,
  );
  assert.equal(inactiveResult.status, 409);
  assert.equal(
    'iceServers' in (inactiveResult.body as Record<string, unknown>),
    false,
    'inactive consultations receive no ICE credentials',
  );

  const unauthenticatedResult = await invokeIceHandler(
    createIceServerHandler(staticConfiguration),
  );
  assert.equal(unauthenticatedResult.status, 401);
  assert.equal(
    'iceServers' in (unauthenticatedResult.body as Record<string, unknown>),
    false,
    'unauthenticated users receive no ICE credentials',
  );

  const restConfiguration: IceServerConfiguration = {
    ...staticConfiguration,
    webrtcTurnAuthMode: 'rest',
    webrtcTurnUsername: undefined,
    webrtcTurnPassword: undefined,
    webrtcTurnSharedSecret: restSecret,
  };
  const restService = makeService();
  const restResult = await invokeIceHandler(
    createIceServerHandler(restConfiguration, restService.getConsultationById.bind(restService)),
    patient,
  );
  assert.equal(restResult.status, 200);
  const restServers = (restResult.body as { iceServers: Array<Record<string, unknown>> }).iceServers;
  assert.deepEqual(restServers[0], { urls: ['stun:stun.l.google.com:19302'] });
  assert.equal(restServers[1].urls instanceof Array, true);
  assert.match(String(restServers[1].username), /^\d+:22222222-2222-2222-2222-222222222222$/);
  const generatedCredential = createTurnCredentials(
    patientUserId,
    restSecret,
    3600,
    Number(String(restServers[1].username).split(':')[0]) - 3600,
  );
  assert.equal(restServers[1].credential, generatedCredential.credential);
  assert.equal(JSON.stringify(restResult.body).includes(restSecret), false);
  assert.equal(JSON.stringify(restResult.body).includes(providerPassword), false);

  const originalConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  const capturedLogs: string[] = [];
  try {
    console.log = console.info = console.warn = console.error = (...values: unknown[]) => {
      capturedLogs.push(values.map(String).join(' '));
    };
    const logCheckService = makeService();
    await invokeIceHandler(
      createIceServerHandler(staticConfiguration, logCheckService.getConsultationById.bind(logCheckService)),
      patient,
    );
  } finally {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
  assert.equal(capturedLogs.some((line) => line.includes(providerPassword)), false);
  assert.equal(capturedLogs.some((line) => line.includes(restSecret)), false);

  const restExpected = createTurnCredentials(patientUserId, restSecret, 3600);
  assert.match(restExpected.credential, /^[A-Za-z0-9+/]+=*$/);
  assert.equal(createHmac('sha1', restSecret).update(restExpected.username).digest('base64'), restExpected.credential);

  console.log('Static and REST ICE response/authorization checks passed.');
}

void run().catch((error: unknown) => {
  console.error('ICE server tests failed:', error);
  process.exitCode = 1;
});
