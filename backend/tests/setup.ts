// Variables de entorno mínimas para que la validación de env.ts pase en los tests.
// Se ejecuta ANTES de importar cualquier módulo de la aplicación.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/calidad_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_para_pruebas_unitarias_1234';
process.env.AI_PROVIDER_DEFAULT = 'gemini';
process.env.LOG_LEVEL = 'silent';
