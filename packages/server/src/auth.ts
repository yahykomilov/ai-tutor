import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Лениво — .env должен успеть загрузиться в index.ts до первого вызова.
let _oauthClient: OAuth2Client | null = null;
function oauthClient(): OAuth2Client {
  if (!_oauthClient) _oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return _oauthClient;
}

function jwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

/** Проверяет Google ID-токен (полученный на фронте через Google Identity Services). */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
  const ticket = await oauthClient().verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new Error("invalid google token payload");
  return { sub: payload.sub, email: payload.email, name: payload.name ?? payload.email, picture: payload.picture };
}

export function signAppToken(userId: string): string {
  return jwt.sign({ uid: userId }, jwtSecret(), { expiresIn: "30d" });
}

export function verifyAppToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, jwtSecret()) as { uid: string };
    return payload.uid;
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Middleware: если есть валидный Bearer-токен — кладёт userId в req, иначе 401. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const uid = token ? verifyAppToken(token) : null;
  if (!uid) return res.status(401).json({ error: "unauthorized" });
  req.userId = uid;
  next();
}
