# TestGenAI Análisis estático y pruebas

Autores: Milton H. Flores Chino y Manuel Andree Dongo.

Aplicación Express/TypeScript y PostgreSQL/Prisma con frontend HTML/CSS/JavaScript. Esta copia pública autorizada excluye historia Git privada, informes académicos con identificadores, respaldos de base de datos, archivos de entorno privados y herramientas de mantenimiento de datos internos.

## Verificación

Usar Node.js >=22.22.1 (24 en CI). Desde backend: npm ci, npm run prisma:generate, npm test, npm run security:scan. Configurar DATABASE_URL y DIRECT_URL para PostgreSQL, JWT_SECRET de al menos 32 caracteres en producción y CORS_ORIGINS explícito. Nunca publicar secretos en Git.

## Evidencias

La revisión institucional del 7 de octubre pasó 59 pruebas, conserva 49 alertas ESLint Security para revisión y reporta cero hallazgos Semgrep con las reglas seleccionadas. Esta copia conserva el código analizado y ejecuta sus propios workflows públicos.

La infraestructura Terraform verifica la aplicación en un runner efímero. No equivale a una URL pública persistente.

Documentación generada: docs/generated/index.html.

Sitio del equipo: https://testgenai-calidad.vercel.app/ (pantalla de inicio verificada; la revisión desplegada y el backend no fueron comprobados).

## Publicaciones del autor

Artículo individual: https://dev.to/milton_h_107ce42c1ba76290/analisis-de-seguridad-de-testgenai-con-eslint-security-y-github-actions-50p7

Video público: https://youtu.be/uVTdcjrnKI0

Documentación automática: https://miltom123.github.io/testgenai-sast/
