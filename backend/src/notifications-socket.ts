import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import config from './config/env';
import { authenticateSignalingToken } from './services/signaling.service';
import { DbUser } from './repositories/user.repository';
import { DbNotification } from './repositories/notification.repository';

type Client = WebSocket & { user?: DbUser };

export type NotificationSocketDependencies = {
  authenticateToken: (token: string) => Promise<DbUser>;
};

const defaultDependencies: NotificationSocketDependencies = {
  authenticateToken: authenticateSignalingToken,
};

function traceNotificationWs(message: string) {
  if (config.nodeEnv !== 'production') {
    console.info(`[NotificationWS] ${message}`);
  }
}

function send(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function extractToken(req: IncomingMessage): string | null {
  // 1. Sec-WebSocket-Protocol subprotocol (e.g. ['dd-auth', token])
  const subprotocols = String(req.headers['sec-websocket-protocol'] ?? '')
    .split(',')
    .map((v) => v.trim());
  if (subprotocols[0] === 'dd-auth' && subprotocols[1]) {
    return subprotocols[1];
  }

  // 2. URL search parameters (e.g. ?token=...)
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) return token;
    } catch {
      // Ignore parse failure
    }
  }

  // 3. Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function createNotificationSocketServer(
  dependencies: NotificationSocketDependencies = defaultDependencies
) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 32 * 1024 });
  const clients = new Map<string, Set<Client>>();

  function addClient(userId: string, client: Client) {
    let set = clients.get(userId);
    if (!set) {
      set = new Set();
      clients.set(userId, set);
    }
    set.add(client);
  }

  function removeClient(client: Client) {
    if (!client.user?.id) return;
    const set = clients.get(client.user.id);
    if (set) {
      set.delete(client);
      if (set.size === 0) {
        clients.delete(client.user.id);
      }
    }
  }

  wss.on('connection', (client: Client, req: IncomingMessage) => {
    const token = extractToken(req);
    traceNotificationWs('Validating user session for notification stream connection.');

    void (async () => {
      try {
        if (!token) throw new Error('Missing authentication token.');
        const user = await dependencies.authenticateToken(token);
        client.user = user;
        addClient(user.id, client);
        traceNotificationWs(`Notification stream authenticated for user ${user.id} (${user.role}).`);
        send(client, { type: 'authenticated', userId: user.id });
      } catch (err: any) {
        traceNotificationWs(`Authentication failed for notification stream: ${err?.message}`);
        client.close(4401, 'Authentication required');
      }
    })();

    client.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          send(client, { type: 'pong', timestamp: Date.now() });
        }
      } catch {
        // Ignore unparseable client messages
      }
    });

    client.on('close', () => removeClient(client));
    client.on('error', () => removeClient(client));
  });

  return {
    handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
      const urlPath = req.url?.split('?')[0] ?? '';
      const isPathMatch =
        urlPath.startsWith(config.notificationWsPath) ||
        urlPath === '/api/v1/notifications/ws' ||
        urlPath === '/api/v1/notifications/stream';

      if (!isPathMatch) return false;

      const forwarded = String(req.headers['x-forwarded-proto'] ?? '')
        .split(',')[0]
        .trim();
      if (config.nodeEnv === 'production' && !(req.socket as any).encrypted && forwarded !== 'https') {
        socket.destroy();
        return true;
      }

      const token = extractToken(req);
      if (!token) {
        socket.destroy();
        return true;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return true;
    },

    broadcastNotification(notification: DbNotification) {
      const userSockets = clients.get(notification.recipient_user_id);
      if (!userSockets || userSockets.size === 0) return;
      const message = {
        type: 'notification',
        notification,
      };
      traceNotificationWs(
        `Pushing notification ${notification.id} (${notification.type}) to ${userSockets.size} active connection(s) for user ${notification.recipient_user_id}.`
      );
      for (const ws of userSockets) {
        send(ws, message);
      }
    },

    broadcastRead(userId: string, notificationId: string) {
      const userSockets = clients.get(userId);
      if (!userSockets || userSockets.size === 0) return;
      const message = { type: 'notification_read', id: notificationId };
      for (const ws of userSockets) {
        send(ws, message);
      }
    },

    broadcastReadAll(userId: string) {
      const userSockets = clients.get(userId);
      if (!userSockets || userSockets.size === 0) return;
      const message = { type: 'notifications_read_all' };
      for (const ws of userSockets) {
        send(ws, message);
      }
    },

    getConnectedCount(userId?: string): number {
      if (userId) return clients.get(userId)?.size ?? 0;
      let total = 0;
      for (const set of clients.values()) total += set.size;
      return total;
    },

    close() {
      wss.close();
      clients.clear();
    },
  };
}

export const notificationSocketServer = createNotificationSocketServer();
