# ============================================================================
#  Dockerfile del backend TestGenAI (multi-stage).
#  IMPORTANTE: construir desde la RAÍZ del repositorio para incluir el frontend:
#     docker build -f backend/Dockerfile -t testgenai .
# ============================================================================

# ---------- Etapa 1: build ----------
FROM node:24-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app/backend

# Instala dependencias (incluye dev para compilar y generar Prisma)
COPY backend/package*.json ./
RUN npm ci

# Copia el código y genera el cliente Prisma + compila TypeScript
COPY backend/ ./
RUN npx prisma generate && npm run build

# ---------- Etapa 2: runtime ----------
FROM node:24-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app/backend

# Solo dependencias de producción
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Artefactos compilados y cliente Prisma generado
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY backend/prisma ./prisma

# El frontend estático se sirve desde ../../frontend (relativo a dist)
COPY frontend /app/frontend

# Usuario no-root por seguridad
USER node

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
