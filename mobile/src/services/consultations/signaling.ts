export interface SignalingMessage {
  type: string;
  error?: string;
  peerPresent?: boolean;
  role?: 'patient' | 'doctor';
  payload?: unknown;
}

export interface JoinedSignalingSocket {
  socket: WebSocket;
  peerPresent: boolean;
}

export class SignalingAuthenticationError extends Error {
  constructor() {
    super('The signaling server rejected your session. Refreshing your session is required.');
    this.name = 'SignalingAuthenticationError';
  }
}

export function connectAuthenticatedSignaling(
  url: string,
  token: string,
  consultationId: string,
  onMessage: (message: SignalingMessage) => void,
  onClose: (event: CloseEvent) => void,
  onError: () => void
): Promise<JoinedSignalingSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, ['dd-auth', token]);
    let authenticated = false;
    let joined = false;
    let settled = false;
    let transportErrored = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(handshakeTimeout);
      socket.close();
      reject(error);
    };

    const handshakeTimeout = setTimeout(
      () => fail(new Error('Timed out waiting for signaling authentication.')),
      15_000
    );

    socket.onopen = () => {
      if (__DEV__) console.info('[Signaling] WebSocket open; awaiting server authentication.');
    };

    socket.onmessage = ({ data }) => {
      let message: SignalingMessage;
      try {
        message = JSON.parse(String(data)) as SignalingMessage;
      } catch {
        fail(new Error('The signaling server sent an invalid response.'));
        return;
      }

      if (message.type === 'authenticated') {
        if (authenticated) return;
        authenticated = true;
        if (__DEV__) console.info('[Signaling] Server authenticated the session.');
        socket.send(JSON.stringify({ type: 'join', consultationId }));
        return;
      }

      if (message.type === 'joined') {
        if (!authenticated) {
          fail(new Error('The signaling server authorized the consultation before authenticating the session.'));
          return;
        }
        if (joined) return;
        joined = true;
        settled = true;
        clearTimeout(handshakeTimeout);
        if (__DEV__) console.info('[Signaling] Consultation participant authorization confirmed.');
        resolve({ socket, peerPresent: message.peerPresent === true });
        return;
      }

      if (message.type === 'error' && !joined) {
        fail(new Error(message.error || 'Signaling authentication or consultation authorization failed.'));
        return;
      }

      if (joined) onMessage(message);
    };

    socket.onerror = () => {
      if (!joined) transportErrored = true;
      else onError();
    };

    socket.onclose = (event) => {
      if (!joined) {
        fail(event.code === 4401
          ? new SignalingAuthenticationError()
          : new Error(transportErrored
            ? 'Unable to connect to secure signaling.'
            : 'Signaling closed before consultation authorization completed.'));
        return;
      }
      onClose(event);
    };
  });
}
