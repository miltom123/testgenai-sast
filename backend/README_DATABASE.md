# 🐘 Guía de Conexión a Base de Datos Real (PostgreSQL)

TestGenAI admite bases de datos relacionales en producción mediante **Prisma ORM** y scripts SQL nativos.

---

## 🚀 Opción A: PostgreSQL con Docker (Recomendado en 1 Paso)

Si tienes Docker instalado en tu máquina:

1. Abre una terminal en la carpeta `backend/` y levanta el contenedor:
   ```bash
   docker compose up -d
   ```
2. Cambia el motor en Prisma ejecutando:
   ```bash
   node scripts/switch-db.js postgres
   ```
3. Aplica las tablas en PostgreSQL:
   ```bash
   npx prisma db push
   ```
4. *(Opcional)* Abre el panel web **pgAdmin** en:
   - URL: `http://localhost:5050`
   - Usuario: `admin@testgenai.com`
   - Clave: `pgadmin_pass`

---

## ☁️ Opción B: PostgreSQL en la Nube (Supabase, Neon, Railway)

1. Crea tu proyecto en [Supabase](https://supabase.com) o [Neon](https://neon.tech).
2. Copia tu cadena de conexión `DATABASE_URL` y pégala en `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[tu-ref]:[tu-clave]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
3. Ejecuta:
   ```bash
   node scripts/switch-db.js postgres
   npx prisma db push
   ```

---

## 🗄️ Opción C: Importar Directamente el Archivo SQL

Si ya tienes un servidor PostgreSQL existente (o DBeaver / pgAdmin):
- Ejecuta el archivo: [`backend/prisma/database.sql`](file:///c:/Users/LENOVO/Desktop/CALIDAD/backend/prisma/database.sql)
- Crea automáticamente todas las tablas: `users`, `projects`, `requirements`, `test_cases`, `ai_generations`, `test_case_reviews`, índices y cuentas demo de prueba.

---

## 🔄 Volver a SQLite Local

Para volver al archivo local SQLite en cualquier momento:
```bash
node scripts/switch-db.js sqlite
```
