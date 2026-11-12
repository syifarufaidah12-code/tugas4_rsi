import type { NextFunction, Request, Response } from 'express';

/**
 * CORS sederhana tanpa dependency tambahan.
 * Origin yang diizinkan dibaca dari env CORS_ORIGIN (dipisah koma),
 * default http://localhost:5173 (alamat dev server Vite).
 */
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Preflight request dari browser cukup dibalas 204.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
}
