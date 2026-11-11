import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import config from './config/env';
import { authenticateSignalingToken, authorizeSignalingJoin } from './services/signaling.service';
import { DbUser } from './repositories/user.repository';

type Client = WebSocket & {
  user?: DbUser;
  authToken?: string;
  consultationId?: string;
  role?: 'patient' | 'doctor';
  sessionValidationTimer?: NodeJS.Timeout;
  validatingSession?: boolean;
};
type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'leave';
export type SignalingDependencies = {
  authenticateSignalingToken: typeof authenticateSignalingToken;
  authorizeSignalingJoin: typeof authorizeSignalingJoin;
  sessionRevalidationIntervalMs?: number;
};
const MAX_MESSAGE_BYTES = 64 * 1024;
const DEFAULT_SESSION_REVALIDATION_INTERVAL_MS = 60_000;
const rooms = new Map<string, Map<'patient' | 'doctor', Client>>();
const defaultDependencies: SignalingDependencies = { authenticateSignalingToken, authorizeSignalingJoin };

function traceSignaling(message: string) {
  if (config.nodeEnv !== 'production') console.info(`[Signaling] ${message}`);
}

function send(ws: WebSocket, message: object) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
function leave(client: Client, notify = true) {
  if (!client.consultationId || !client.role) return;
  const room = rooms.get(client.consultationId);
  if (room?.get(client.role) === client) {
    room.delete(client.role);
    if (notify) for (const peer of room.values()) send(peer, { type: 'participant-left', role: client.role });
    if (room.size === 0) rooms.delete(client.consultationId);
  }
  delete client.consultationId; delete client.role;
}
function protocolToken(req: IncomingMessage): string | null {
  // React Native sends these as WebSocket subprotocols; never accept a client-supplied user id.
  const values = String(req.headers['sec-websocket-protocol'] ?? '').split(',').map(v => v.trim());
  return values[0] === 'dd-auth' && values[1] ? values[1] : null;
}
export function isSecureSignalingUpgrade(
  req: IncomingMessage,
  nodeEnv = config.nodeEnv,
  trustProxy = config.trustProxy
): boolean {
  if (nodeEnv !== 'production' || (req.socket as any).encrypted) return true;
  const forwarded = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim();
  return trustProxy && forwarded === 'https';
}

function validDescription(value: unknown): value is { type: 'offer' | 'answer'; sdp: string } {
  return !!value && typeof value === 'object' && (value as any).type !== undefined && ['offer', 'answer'].includes((value as any).type) && typeof (value as any).sdp === 'string' && (value as any).sdp.length <= 60_000;
}
function validCandidate(value: unknown): boolean { return !!value && typeof value === 'object' && typeof (value as any).candidate === 'string' && (value as any).candidate.length <= 8_000; }

export function createSignalingServer(dependencies: SignalingDependencies = defaultDependencies) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  const sessionRevalidationIntervalMs =
    dependencies.sessionRevalidationIntervalMs ?? DEFAULT_SESSION_REVALIDATION_INTERVAL_MS;

  function clearSessionValidation(client: Client) {
    if (client.sessionValidationTimer) {
      clearInterval(client.sessionValidationTimer);
      delete client.sessionValidationTimer;
    }
    delete client.authToken;
  }

  function startSessionValidation(client: Client) {
    client.sessionValidationTimer = setInterval(() => {
      const token = client.authToken;
      if (client.validatingSession || !token || client.readyState !== WebSocket.OPEN) return;
      client.validatingSession = true;
      void (async () => {
        try {
          const user = await dependencies.authenticateSignalingToken(token);
          if (client.readyState !== WebSocket.OPEN) return;
          if (!client.user || user.id !== client.user.id || user.role !== client.user.role) {
            throw new Error('Authenticated identity changed.');
          }
          client.user = user;
          if (client.consultationId) {
            await dependencies.authorizeSignalingJoin(user, client.consultationId);
          }
        } catch {
          leave(client);
          client.close(4401, 'Authentication required');
        } finally {
          client.validatingSession = false;
        }
      })();
    }, sessionRevalidationIntervalMs);
    client.sessionValidationTimer.unref();
  }

  wss.on('connection', (client: Client, req) => {
    let authenticated = false;
    client.authToken = protocolToken(req) ?? undefined;
    traceSignaling('Verifying Supabase session for WebSocket connection.');
    void (async () => {
      try {
        client.user = await dependencies.authenticateSignalingToken(client.authToken ?? '');
        authenticated = true;
        startSessionValidation(client);
        traceSignaling('Supabase session authenticated; sending authenticated acknowledgement.');
        send(client, { type: 'authenticated' });
      } catch {
        traceSignaling('Supabase session rejected; closing unauthenticated WebSocket.');
        client.close(4401, 'Authentication required');
      }
    })();
    client.on('message', (raw) => {
      // No signaling message is accepted until Supabase verification has completed.
      // The client waits for the authenticated acknowledgement before it sends join.
      if (!authenticated) {
        client.close(4401, 'Authentication required');
        return;
      }
      void handleMessage(client, raw.toString(), dependencies.authorizeSignalingJoin);
    });
    client.on('close', () => {
      clearSessionValidation(client);
      leave(client);
    });
    client.on('error', () => {
      clearSessionValidation(client);
      leave(client);
    });
  });
  return {
    handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
      if (!req.url?.startsWith(config.signalingPath)) return false;
      if (!isSecureSignalingUpgrade(req)) { socket.destroy(); return true; }
      if (!protocolToken(req)) { socket.destroy(); return true; }
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
      return true;
    },
    close: () => {
      for (const client of wss.clients) {
        clearSessionValidation(client as Client);
        client.close(1001, 'Server shutting down');
      }
      wss.close();
    },
  };
}
async function handleMessage(
  client: Client,
  raw: string,
  authorizeJoin: typeof authorizeSignalingJoin
) {
  let message: any; try { message = JSON.parse(raw); } catch { return send(client, { type: 'error', error: 'Invalid signaling message.' }); }
  if (!client.user || !message || typeof message.type !== 'string') return send(client, { type: 'error', error: 'Authenticate before signaling.' });
  if (message.type === 'join') {
    if (typeof message.consultationId !== 'string') return send(client, { type: 'error', error: 'consultationId is required.' });
    try {
      const { role } = await authorizeJoin(client.user, message.consultationId);
      traceSignaling('Consultation participant authorized; sending joined acknowledgement.');
      if (client.consultationId === message.consultationId && client.role === role) return send(client, { type: 'joined', role, duplicate: true });
      leave(client);
      const room = rooms.get(message.consultationId) ?? new Map(); rooms.set(message.consultationId, room);
      const prior = room.get(role); if (prior && prior !== client) prior.close(4001, 'Joined from another device');
      room.set(role, client); client.consultationId = message.consultationId; client.role = role;
      send(client, { type: 'joined', role, peerPresent: room.size === 2 });
      for (const peer of room.values()) if (peer !== client) send(peer, { type: 'participant-joined', role });
    } catch (error) { send(client, { type: 'error', fatal: true, error: error instanceof Error ? error.message : 'Unable to join call.' }); }
    return;
  }
  if (!client.consultationId || !client.role) return send(client, { type: 'error', error: 'Join a consultation before signaling.' });
  if (message.type === 'leave') { leave(client); return send(client, { type: 'left' }); }
  // A consultation can be completed or cancelled after join; do not relay stale media setup.
  try { await authorizeJoin(client.user, client.consultationId); }
  catch (error) { leave(client); return send(client, { type: 'error', error: error instanceof Error ? error.message : 'Consultation is no longer available.' }); }
  const type: SignalType = message.type;
  if (!['offer', 'answer', 'ice-candidate'].includes(type) || (type !== 'ice-candidate' && !validDescription(message.payload)) || (type === 'ice-candidate' && !validCandidate(message.payload))) return send(client, { type: 'error', error: 'Invalid signaling payload.' });
  const room = rooms.get(client.consultationId)!;
  for (const peer of room.values()) if (peer !== client) send(peer, { type, payload: message.payload, from: client.role });
}
