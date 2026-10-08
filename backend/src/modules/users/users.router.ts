import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT, requireRoles } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { audit } from '../../common/utils/audit';

export const usersRouter = Router();

// Todas las rutas de administración de usuarios requieren autenticación y rol ADMIN
usersRouter.use(authenticateJWT);
usersRouter.use(requireRoles(['ADMIN']));

const updateUserSchema = z.object({
  role: z.enum(['QA_TESTER', 'QA_LEAD', 'DEVELOPER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/users - Listado de usuarios del sistema
usersRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, skip, take } = getPagination(req);

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { projects: true } },
        },
      }),
    ]);

    return sendPaginated(res, users, buildPaginationMeta(page, pageSize, total));
  })
);

// PATCH /api/v1/users/:id - Modificación de rol y estado activo (con guardrails de seguridad)
usersRouter.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, isActive } = updateUserSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw ApiError.notFound('Usuario no encontrado');
    }

    // Regla de seguridad: Impedir desactivar o degradar la última cuenta ADMIN activa
    if (targetUser.role === 'ADMIN' && (isActive === false || (role && role !== 'ADMIN'))) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw ApiError.forbidden(
          'Operación rechazada: No se puede desactivar o quitar permisos de administrador al último ADMIN activo del sistema.'
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    audit(req, 'USER_ADMIN_UPDATED', { targetUserId: id, role, isActive });

    return sendSuccess(res, updated, 'Usuario actualizado exitosamente');
  })
);
