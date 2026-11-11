import { createTurnCredentials } from './turn-credentials.service';

export type TurnAuthMode = 'static' | 'rest';

export interface IceServerConfiguration {
  webrtcStunUrls: readonly string[];
  webrtcTurnUrls: readonly string[];
  webrtcTurnAuthMode: TurnAuthMode | undefined;
  webrtcTurnUsername: string | undefined;
  webrtcTurnPassword: string | undefined;
  webrtcTurnSharedSecret: string | undefined;
  webrtcTurnCredentialTtlSeconds: number;
}

export interface IceServerEntry {
  urls: string[];
  username?: string;
  credential?: string;
}

export function buildIceServers(configuration: IceServerConfiguration, userId: string): IceServerEntry[] {
  const iceServers: IceServerEntry[] = [];

  if (configuration.webrtcStunUrls.length) {
    iceServers.push({ urls: [...configuration.webrtcStunUrls] });
  }

  if (!configuration.webrtcTurnUrls.length) return iceServers;

  if (configuration.webrtcTurnAuthMode === 'static') {
    if (!configuration.webrtcTurnUsername || !configuration.webrtcTurnPassword) {
      throw new Error('Static TURN authentication is not fully configured.');
    }
    iceServers.push({
      urls: [...configuration.webrtcTurnUrls],
      username: configuration.webrtcTurnUsername,
      credential: configuration.webrtcTurnPassword,
    });
  } else if (configuration.webrtcTurnAuthMode === 'rest') {
    if (!configuration.webrtcTurnSharedSecret) {
      throw new Error('REST TURN authentication is not fully configured.');
    }
    const { username, credential } = createTurnCredentials(
      userId,
      configuration.webrtcTurnSharedSecret,
      configuration.webrtcTurnCredentialTtlSeconds,
    );
    iceServers.push({ urls: [...configuration.webrtcTurnUrls], username, credential });
  } else {
    throw new Error('TURN authentication mode is not configured.');
  }

  return iceServers;
}
