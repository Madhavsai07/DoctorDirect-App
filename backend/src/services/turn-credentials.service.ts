import { createHmac } from 'crypto';

export interface TurnCredentials {
  username: string;
  credential: string;
}

export function createTurnCredentials(
  userId: string,
  sharedSecret: string,
  ttlSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000)
): TurnCredentials {
  const username = `${nowSeconds + ttlSeconds}:${userId}`;
  const credential = createHmac('sha1', sharedSecret).update(username).digest('base64');
  return { username, credential };
}
