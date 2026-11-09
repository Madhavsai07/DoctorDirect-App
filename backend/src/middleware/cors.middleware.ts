import cors, { CorsOptions } from 'cors';
import { RequestHandler } from 'express';

const corsOptions = (allowedOrigins: readonly string[]): CorsOptions => ({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, false);
      return;
    }
    callback(null, allowedOrigins.includes(origin) ? origin : false);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: false,
  maxAge: 600,
});

export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const handleCors = cors(corsOptions(allowedOrigins));

  return (req, res, next) => {
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: 'Origin not allowed.' });
      return;
    }
    handleCors(req, res, next);
  };
}
