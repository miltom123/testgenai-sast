import crypto from 'crypto';
import { prisma } from '../../config/prisma';

export class SessionService {
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static async createSession(params: {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<string> {
    const tokenHash = this.hashToken(params.refreshToken);
    const expiresInDays = params.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const session = await prisma.authSession.create({
      data: {
        userId: params.userId,
        tokenHash,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        expiresAt,
        isRevoked: false,
      },
    });

    return session.id;
  }

  public static async rotateSession(params: {
    oldRefreshToken: string;
    newRefreshToken: string;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<boolean> {
    const oldHash = this.hashToken(params.oldRefreshToken);

    const session = await prisma.authSession.findUnique({
      where: { tokenHash: oldHash },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return false;
    }

    // Revocar sesión anterior e insertar nueva de forma atómica
    await prisma.$transaction([
      prisma.authSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      }),
      prisma.authSession.create({
        data: {
          userId: params.userId,
          tokenHash: this.hashToken(params.newRefreshToken),
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
          expiresAt: new Date(Date.now() + (params.expiresInDays ?? 7) * 24 * 60 * 60 * 1000),
          isRevoked: false,
        },
      }),
    ]);

    return true;
  }

  public static async revokeSession(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await prisma.authSession.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }
}
