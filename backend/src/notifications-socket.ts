import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import config from './config/env';
import { isSecureSignalingUpgrade } from './signaling';
import { authenticateSignalingToken } from './services/signaling.service';
import { DbUser } from './repositories/user.repository';
import { DbNotification } from './repositories/notification.repository';

type Client = WebSocket & {
  user?: DbUser;
  authToken?: string;
  sessionValidationTimer?: NodeJS.Timeout;
  validatingSession?: boolean;
};

export type NotificationSocketDependencies = {
  authenticateToken: (token: string) => Promise<DbUser>;
  sessionRevalidationIntervalMs?: number;
};

const defaultDependencies: NotificationSocketDependencies = {
  authenticateToken: authenticateSignalingToken,
};
const DEFAULT_SESSION_REVALIDATION_INTERVAL_MS = 60_000;

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

  // 2. Authorization header (available to native clients; browsers use subprotocols)
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
  const sessionRevalidationIntervalMs =
    dependencies.sessionRevalidationIntervalMs ?? DEFAULT_SESSION_REVALIDATION_INTERVAL_MS;

  function addClient(userId: string, client: Client) {
    let set = clients.get(userId);
    if (!set) {
      set = new Set();
      clients.set(userId, set);
    }
    set.add(client);
  }

  function removeClient(client: Client) {
    if (client.sessionValidationTimer) {
      clearInterval(client.sessionValidationTimer);
      delete client.sessionValidationTimer;
    }
    delete client.authToken;
    if (client.user?.id) {
      const set = clients.get(client.user.id);
      if (set) {
        set.delete(client);
        if (set.size === 0) {
          clients.delete(client.user.id);
        }
      }
    }
    delete client.user;
  }

  function startSessionValidation(client: Client) {
    client.sessionValidationTimer = setInterval(() => {
      if (client.validatingSession || !client.authToken || client.readyState !== WebSocket.OPEN) return;
      client.validatingSession = true;
      void dependencies.authenticateToken(client.authToken)
        .then((user) => {
          if (client.readyState !== WebSocket.OPEN) return;
          if (!client.user || user.id !== client.user.id || user.role !== client.user.role) {
            throw new Error('Authenticated identity changed.');
          }
          client.user = user;
        })
        .catch(() => {
          removeClient(client);
          client.close(4401, 'Authentication required');
        })
        .finally(() => {
          client.validatingSession = false;
        });
    }, sessionRevalidationIntervalMs);
    client.sessionValidationTimer.unref();
  }

  wss.on('connection', (client: Client, req: IncomingMessage) => {
    const token = extractToken(req);
    client.authToken = token ?? undefined;
    traceNotificationWs('Validating user session for notification stream connection.');

    void (async () => {
      try {
        if (!token) throw new Error('Missing authentication token.');
        const user = await dependencies.authenticateToken(token);
        client.user = user;
        addClient(user.id, client);
        startSessionValidation(client);
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

      if (!isSecureSignalingUpgrade(req)) {
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
      for (const client of wss.clients) {
        removeClient(client as Client);
        client.close(1001, 'Server shutting down');
      }
      wss.close();
      clients.clear();
    },
  };
}

export const notificationSocketServer = createNotificationSocketServer();
