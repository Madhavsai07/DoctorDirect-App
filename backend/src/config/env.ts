import dotenv from 'dotenv';
import { isIP } from 'node:net';
import type { TurnAuthMode } from '../services/ice-servers.service';

// Load .env before any other module reads process.env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const databaseSslSetting = process.env.DATABASE_SSL;
const webrtcStunUrls = (process.env.WEBRTC_STUN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
const webrtcTurnUrls = (process.env.WEBRTC_TURN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
const configuredTurnAuthMode = process.env.WEBRTC_TURN_AUTH_MODE?.trim().toLowerCase();
const webrtcTurnUsername = process.env.WEBRTC_TURN_USERNAME?.trim();
const webrtcTurnPassword = process.env.WEBRTC_TURN_PASSWORD;
const webrtcTurnSharedSecret = process.env.WEBRTC_TURN_SHARED_SECRET;
const webrtcTurnCredentialTtlSeconds = Number(process.env.WEBRTC_TURN_CREDENTIAL_TTL_SECONDS ?? '3600');
const configuredCorsOrigins = (
  process.env.CORS_ORIGINS ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = Array.from(new Set([
  ...configuredCorsOrigins,
  'https://doctor-direct-app-ten.vercel.app',
]));

if (databaseSslSetting && !['true', 'false'].includes(databaseSslSetting)) {
  throw new Error('DATABASE_SSL must be set to "true" or "false".');
}

if (process.env.NODE_ENV === 'production' && !databaseUrl) {
  throw new Error('DATABASE_URL is required in production.');
}

const containsInlineCredentials = (url: string) => /(?:^|[?&])(?:username|credential|password)=/i.test(url);

if (webrtcStunUrls.some(url => !/^(stun|stuns):[^,\s@]+$/i.test(url) || containsInlineCredentials(url))) {
  throw new Error('WEBRTC_STUN_URLS must contain only STUN or STUNS URLs without embedded credentials.');
}

function isValidTurnUrl(url: string): boolean {
  const match = url.match(/^(turn|turns):([^,?\s@]+)(?:\?transport=(udp|tcp))?$/i);
  if (!match || containsInlineCredentials(url)) return false;
  const [, scheme, authority, transport] = match;
  if (scheme.toLowerCase() === 'turns' && transport?.toLowerCase() === 'udp') return false;

  const authorityMatch = authority.match(/^(?:\[([0-9a-f:.]+)\]|([a-z0-9.-]+)):(\d{1,5})$/i);
  if (!authorityMatch) return false;
  const [, ipv6Host, hostname, portText] = authorityMatch;
  if (ipv6Host ? isIP(ipv6Host) !== 6 : !hostname?.split('.').every(
    label => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label) && label.length <= 63
  )) return false;

  const port = Number(portText);
  return port >= 1 && port <= 65535;
}

if (webrtcTurnUrls.some(url => !isValidTurnUrl(url))) {
  throw new Error('WEBRTC_TURN_URLS must contain valid TURN or TURNS URLs with optional UDP/TCP transport and no embedded credentials.');
}

if (configuredTurnAuthMode && configuredTurnAuthMode !== 'static' && configuredTurnAuthMode !== 'rest') {
  throw new Error('WEBRTC_TURN_AUTH_MODE must be either "static" or "rest".');
}

const webrtcTurnAuthMode: TurnAuthMode | undefined =
  configuredTurnAuthMode === 'static' || configuredTurnAuthMode === 'rest'
    ? configuredTurnAuthMode
    : process.env.NODE_ENV === 'production' ? undefined : 'rest';

if (process.env.NODE_ENV === 'production' && !configuredTurnAuthMode) {
  throw new Error('WEBRTC_TURN_AUTH_MODE must be explicitly set to "static" or "rest" in production.');
}

if (webrtcTurnAuthMode === 'static') {
  if (!webrtcTurnUrls.length) {
    throw new Error('WEBRTC_TURN_URLS is required when WEBRTC_TURN_AUTH_MODE is "static".');
  }
  if (!webrtcTurnUsername) {
    throw new Error('WEBRTC_TURN_USERNAME is required when WEBRTC_TURN_AUTH_MODE is "static".');
  }
  if (!webrtcTurnPassword?.trim()) {
    throw new Error('WEBRTC_TURN_PASSWORD is required when WEBRTC_TURN_AUTH_MODE is "static".');
  }
} else if (webrtcTurnAuthMode === 'rest') {
  if (webrtcTurnUsername || webrtcTurnPassword) {
    throw new Error('Remove static TURN credentials when WEBRTC_TURN_AUTH_MODE is "rest".');
  }
  const implicitDevelopmentRestMode = !configuredTurnAuthMode && process.env.NODE_ENV !== 'production';
  if (!webrtcTurnUrls.length && !implicitDevelopmentRestMode) {
    throw new Error('WEBRTC_TURN_URLS is required when WEBRTC_TURN_AUTH_MODE is "rest".');
  }
  if (webrtcTurnUrls.length && (!webrtcTurnSharedSecret || webrtcTurnSharedSecret.length < 32)) {
    throw new Error('WEBRTC_TURN_SHARED_SECRET must be at least 32 characters when REST TURN URLs are configured.');
  }
}

if (!Number.isInteger(webrtcTurnCredentialTtlSeconds) || webrtcTurnCredentialTtlSeconds < 60 || webrtcTurnCredentialTtlSeconds > 86400) {
  throw new Error('WEBRTC_TURN_CREDENTIAL_TTL_SECONDS must be an integer between 60 and 86400.');
}

if (process.env.NODE_ENV === 'production' && !webrtcStunUrls.length) {
  throw new Error('Configure WEBRTC_STUN_URLS in production.');
}

/**
 * Centralized environment configuration.
 *
 * All environment variables are read here so that the rest of the
 * application never accesses process.env directly. This makes it easy
 * to add validation, defaults, or type coercion in one place.
 *
 */
const config = {
  port: parseInt(process.env.PORT ?? '8000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins,

  // ── Added in the Database milestone ──────────────────────────────────────
  databaseUrl,
  databaseSslEnabled: databaseSslSetting === 'true',
  databaseSslCa: process.env.DATABASE_SSL_CA,
  // For hosts such as Render, where a local CA file cannot be mounted.
  databaseSslCaBase64: process.env.DATABASE_SSL_CA_BASE64,

  // ── Added in the Authentication milestone ────────────────────────────────
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // WebRTC media is peer-to-peer; this server only relays ephemeral signaling.
  // Production deployments must terminate TLS before accepting WebSocket upgrades.
  signalingPath: process.env.SIGNALING_PATH ?? '/api/v1/signaling',
  notificationWsPath: process.env.NOTIFICATION_WS_PATH ?? '/api/v1/notifications/stream',
  trustProxy: process.env.TRUST_PROXY === 'true',
  webrtcStunUrls,
  webrtcTurnUrls,
  webrtcTurnAuthMode,
  webrtcTurnUsername,
  webrtcTurnPassword,
  webrtcTurnSharedSecret,
  webrtcTurnCredentialTtlSeconds,

} as const;

export default config;
