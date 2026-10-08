import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { sendError } from '../utils/api-response';
import { env, JWT_REFRESH_SECRET } from '../../config/env';
import { CookieSessionManager } from '../security/cookie-session';

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

// El secreto proviene de la configuración validada en arranque (env.ts).
// Ya no existe un valor por defecto embebido: si falta, el servidor no inicia.
export const JWT_SECRET = env.JWT_SECRET;

/** Firma un access token JWT (vida corta). */
export function signAccessToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN } as SignOptions);
}

/** Firma un refresh token JWT (vida larga, secreto independiente). */
export function signRefreshToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

/** Verifica un refresh token y devuelve su payload. Lanza si es inválido/expirado. */
export function verifyRefreshToken(token: string): UserTokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserTokenPayload;
}

/** Genera el par de tokens (access + refresh) para un usuario. */
export function issueTokenPair(payload: UserTokenPayload) {
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

/**
 * Alias retrocompatible: firma un token de acceso.
 * @deprecated Use issueTokenPair / signAccessToken.
 */
export function signToken(payload: UserTokenPayload): string {
  return signAccessToken(payload);
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const token = CookieSessionManager.extractToken(req);


  if (!token) {
    return sendError(res, 'No se proporcionó token de autenticación (Bearer Token o Cookie de Sesión)', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    req.user = decoded;
    return next();
  } catch {
    return sendError(res, 'Token inválido o expirado', 401);
  }
}


export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Usuario no autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Acceso denegado: se requiere uno de los roles [${allowedRoles.join(', ')}]`,
        403
      );
    }

    return next();
  };
}
