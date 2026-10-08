import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { pinoHttp } from 'pino-http';

import { env, getCorsOrigins } from './config/env';
import { logger } from './common/utils/logger';
import { prisma, initDatabaseConnection, disconnectDatabase } from './config/prisma';
import { requestId } from './common/middleware/request-id';
import { apiLimiter, authLimiter, aiLimiter } from './common/middleware/rate-limit';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler';
import { CookieSessionManager } from './common/security/cookie-session';
import { mountSwagger } from './config/swagger';

import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { configRouter } from './modules/config/config.router';
import { projectsRouter } from './modules/projects/projects.router';
import { requirementsRouter } from './modules/requirements/requirements.router';
import { aiGenerationRouter } from './modules/ai-generation/ai-generation.router';
import { testCasesRouter } from './modules/test-cases/test-cases.router';
import { traceabilityRouter } from './modules/traceability/traceability.router';
import { metricsRouter } from './modules/metrics/metrics.router';
import { exportRouter } from './modules/export/export.router';
import { specRouter } from './modules/spec/spec.router';

const app = express();

app.set('trust proxy', 1);

// -------------------- Middlewares globales de seguridad --------------------
app.use(helmet());
app.use(compression());

const corsOrigins = getCorsOrigins();
app.use(
  cors({
    origin: corsOrigins,
    credentials: true, // Habilita transporte seguro de cookies HttpOnly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Protección de origen contra CSRF para peticiones mutativas basadas en cookie
app.use(CookieSessionManager.verifyMutationOrigin);

// Trazabilidad: Request ID + Logging estructurado
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request & { id?: string }).id,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// -------------------- Documentación OpenAPI / Swagger --------------------
mountSwagger(app);

// -------------------- Healthchecks --------------------
const handleHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'TestGenAI Backend Core (PostgreSQL + Real AI)',
    version: '1.0.0',
    environment: env.NODE_ENV,
    aiDefaultProvider: env.AI_PROVIDER_DEFAULT,
  });
};

const handleDbHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'connected',
      engine: 'PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

const handleAiHealth = (_req: Request, res: Response) => {
  const provider = env.AI_PROVIDER_DEFAULT;
  const keyPresent =
    provider === 'gemini'
      ? Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0)
      : provider === 'openai'
        ? Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0)
        : false;

  res.status(keyPresent ? 200 : 503).json({
    provider,
    configured: keyPresent,
    message: keyPresent
      ? `Proveedor '${provider}' configurado con credenciales activas.`
      : `Proveedor '${provider}' no cuenta con API Key configurada en backend/.env.`,
  });
};

// Mejora 70: Monitoreo de Salud Profunda del Sistema (/api/health/deep)
const handleDeepHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mem = process.memoryUsage();
    const startDb = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startDb;

    res.status(200).json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: parseFloat((mem.rss / (1024 * 1024)).toFixed(2)),
        heapTotalMb: parseFloat((mem.heapTotal / (1024 * 1024)).toFixed(2)),
        heapUsedMb: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        externalMb: parseFloat((mem.external / (1024 * 1024)).toFixed(2)),
      },
      database: {
        engine: 'PostgreSQL',
        connected: true,
        latencyMs: dbLatencyMs,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  } catch (err) {
    next(err);
  }
};

app.get('/api/health', handleHealth);
app.get('/api/health/db', handleDbHealth);
app.get('/api/health/ai', handleAiHealth);
app.get('/api/health/deep', handleDeepHealth);
app.get('/api/v1/health', handleHealth);
app.get('/api/v1/health/db', handleDbHealth);
app.get('/api/v1/health/ai', handleAiHealth);
app.get('/api/v1/health/deep', handleDeepHealth);

// -------------------- API REST versionada (/api/v1) --------------------
import { testRunsRouter } from './modules/test-runs/test-runs.router';

const api = express.Router();
api.use('/auth', authLimiter, authRouter);
api.use('/users', apiLimiter, usersRouter);
api.use('/config', apiLimiter, configRouter);
api.use('/projects', apiLimiter, projectsRouter);
api.use('/requirements', apiLimiter, requirementsRouter);
api.use('/ai', aiLimiter, aiGenerationRouter);
api.use('/test-cases', apiLimiter, testCasesRouter);
api.use('/test-runs', apiLimiter, testRunsRouter);
api.use('/traceability', apiLimiter, traceabilityRouter);
api.use('/metrics', apiLimiter, metricsRouter);
api.use('/export', apiLimiter, exportRouter);
api.use('/spec', apiLimiter, specRouter);

app.use('/api/v1', api);
app.use('/api', api); // Alias retrocompatible

// -------------------- Frontend estático SPA --------------------
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.get('*', (req: Request, res: Response, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// -------------------- Manejo de errores centralizado --------------------
app.use('/api', notFoundHandler);
app.use(errorHandler);

// -------------------- Arranque y cierre ordenado --------------------
if (require.main === module) {
  initDatabaseConnection().then(() => {
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          url: `http://localhost:${env.PORT}`,
          health: `http://localhost:${env.PORT}/api/health`,
          docs: `http://localhost:${env.PORT}/api/docs`,
          aiProvider: env.AI_PROVIDER_DEFAULT,
          env: env.NODE_ENV,
        },
        '🚀 TestGenAI Backend iniciado exitosamente'
      );
    });

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Cerrando servidor de forma ordenada...');
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Conexión con PostgreSQL cerrada. Servidor detenido.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Promesa rechazada no controlada');
    });
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Excepción no capturada en el servidor');
      process.exit(1);
    });
  });
}

export default app;
