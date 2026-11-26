import type { Request } from 'express';

export interface ClientInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Mengambil ip_address dan user_agent dari HTTP request.
 * Hanya dua data ini yang boleh masuk ke audit (tidak ada token / cookie / password).
 */
export function getClientInfo(req: Request): ClientInfo {
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const userAgent = req.get('user-agent') ?? null;
  return {
    ipAddress: ip ? ip.slice(0, 45) : null,
    userAgent: userAgent ? userAgent.slice(0, 255) : null,
  };
}
