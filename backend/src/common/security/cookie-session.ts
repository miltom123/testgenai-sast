import { Response, Request, NextFunction } from 'express';
import { isProduction, getCorsOrigins } from '../../config/env';
import { ApiError } from '../errors/api-error';

export const AUTH_COOKIE_NAME = 'testgenai_session';
export const REFRESH_COOKIE_NAME = 'testgenai_refresh';

export class CookieSessionManager {
  static setAuthCookie(res: Response, token: string): void {
    const maxAge = 60 * 60 * 1000; // 1 hora alineado con ACCESS_TOKEN_EXPIRES_IN

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
  }

  static setRefreshCookie(res: Response, refreshToken: string): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días alineado con REFRESH_TOKEN_EXPIRES_IN

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge,
      path: '/api/v1/auth',
    });
  }

  static clearAuthCookies(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  static extractToken(req: Request): string | null {
    // 1. Extraer desde cookies HttpOnly
    const reqWithCookies = req as Request & { cookies?: Record<string, string> };
    if (reqWithCookies.cookies && reqWithCookies.cookies[AUTH_COOKIE_NAME]) {
      return reqWithCookies.cookies[AUTH_COOKIE_NAME];
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // 2. Extraer desde cabecera Authorization: Bearer
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    return null;
  }

  static extractRefreshToken(req: Request): string | null {
    const reqWithCookies = req as Request & { cookies?: Record<string, string> };
    if (reqWithCookies.cookies && reqWithCookies.cookies[REFRESH_COOKIE_NAME]) {
      return reqWithCookies.cookies[REFRESH_COOKIE_NAME];
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${REFRESH_COOKIE_NAME}=([^;]+)`));
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    return null;
  }

  /**
   * Middleware de verificación de origen seguro para peticiones mutativas basadas en cookie.
   */
  static verifyMutationOrigin(req: Request, _res: Response, next: NextFunction): void {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      return next();
    }

    const allowed = getCorsOrigins();
    if (allowed === '*') {
      return next();
    }

    const matches = allowed.some((allowedOrigin) => origin.startsWith(allowedOrigin));
    if (!matches && isProduction) {
      throw ApiError.forbidden('Petición bloqueada por verificación de seguridad de origen (CSRF)');
    }

    return next();
  }
}
