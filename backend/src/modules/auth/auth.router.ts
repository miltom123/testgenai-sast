import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import {
  authenticateJWT,
  issueTokenPair,
  verifyRefreshToken,
} from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { audit } from '../../common/utils/audit';
import { env } from '../../config/env';
import { CookieSessionManager } from '../../common/security/cookie-session';
import { SessionService } from '../../common/security/session.service';

export const authRouter = Router();

const strongPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un dígito');

// El rol NUNCA es seleccionable por el usuario en el registro público. Siempre es QA_TESTER.
const registerSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').trim().toLowerCase(),
  password: strongPassword,
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
});

const loginSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const preferencesSchema = z.object({
  theme: z.enum(['dark', 'light']).optional(),
  defaultProvider: z.enum(['gemini', 'openai']).optional(),
  defaultModel: z.string().optional(),
});

// POST /api/v1/auth/register
authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw ApiError.conflict('El correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Registro seguro: Rol forzado en el servidor
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: 'QA_TESTER',
        isActive: true,
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true, preferences: true },
    });

    const tokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });
    await SessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    CookieSessionManager.setAuthCookie(res, tokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, tokens.refreshToken);

    audit(req, 'AUTH_REGISTER', { userId: user.id, email: user.email });

    return sendSuccess(
      res,
      { user, token: tokens.accessToken },
      'Cuenta creada exitosamente. Bienvenido a TestGenAI.',
      201
    );
  })
);

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.unauthorized('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Esta cuenta se encuentra inactiva. Contacte a un administrador.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Credenciales inválidas');
    }

    const tokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });
    await SessionService.createSession({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    CookieSessionManager.setAuthCookie(res, tokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, tokens.refreshToken);

    audit(req, 'AUTH_LOGIN', { userId: user.id, email: user.email });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          preferences: user.preferences,
        },
        token: tokens.accessToken,
      },
      'Inicio de sesión exitoso'
    );
  })
);

// POST /api/v1/auth/refresh - Rotación de tokens con validación en persistencia
authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = CookieSessionManager.extractRefreshToken(req) || req.body?.refreshToken;

    if (!refreshToken) {
      throw ApiError.unauthorized('No se proporcionó token de renovación (refresh token)');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Token de renovación inválido o expirado');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Usuario no válido o inactivo');
    }

    // Rotar par de tokens emitiendo uno nuevo
    const newTokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });

    const rotated = await SessionService.rotateSession({
      oldRefreshToken: refreshToken,
      newRefreshToken: newTokens.refreshToken,
      userId: user.id,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    if (!rotated) {
      CookieSessionManager.clearAuthCookies(res);
      throw ApiError.unauthorized('La sesión ha sido revocada o expirada. Inicie sesión nuevamente.');
    }

    CookieSessionManager.setAuthCookie(res, newTokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, newTokens.refreshToken);

    return sendSuccess(res, { token: newTokens.accessToken }, 'Sesión renovada con éxito');
  })
);

// POST /api/v1/auth/logout - Revocación de sesión persistida y limpieza de cookies
authRouter.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = CookieSessionManager.extractRefreshToken(req) || req.body?.refreshToken;
    if (refreshToken) {
      await SessionService.revokeSession(refreshToken);
    }

    CookieSessionManager.clearAuthCookies(res);
    return sendSuccess(res, { loggedOut: true }, 'Sesión cerrada exitosamente');
  })
);

// GET /api/v1/auth/me - Perfil del usuario autenticado
authRouter.get(
  '/me',
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, preferences: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    return sendSuccess(res, user);
  })
);

// PATCH /api/v1/auth/preferences - Actualizar preferencias personales (no sensibles)
authRouter.patch(
  '/preferences',
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response) => {
    const newPrefs = preferencesSchema.parse(req.body);
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { preferences: true },
    });

    const current = (currentUser?.preferences as Record<string, unknown>) || {};
    const merged = { ...current, ...newPrefs };

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { preferences: merged },
      select: { id: true, email: true, preferences: true },
    });

    return sendSuccess(res, updated.preferences, 'Preferencias guardadas exitosamente');
  })
);
