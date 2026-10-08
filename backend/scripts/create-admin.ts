/**
 * TestGenAI - Script de Creación de Administrador Inicial (Bootstrap)
 * Uso interactivo o con variables:
 *   npx tsx scripts/create-admin.ts --email "admin.real@miempresa.com" --name "Admin Calidad" --password "ContraseñaSegura123*"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function main() {
  const email = getArg('--email') || process.env.ADMIN_INIT_EMAIL;
  const name = getArg('--name') || process.env.ADMIN_INIT_NAME || 'Administrador TestGenAI';
  const password = getArg('--password') || process.env.ADMIN_INIT_PASSWORD;

  if (!email || !password) {
    console.error('\n❌ Faltan argumentos requeridos para crear el administrador.');
    console.log('   Uso:');
    console.log('   npx tsx scripts/create-admin.ts --email "admin@dominio.com" --name "Nombre Real" --password "ClaveSegura123*"\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  El usuario con correo '${email}' ya existe. Promoviendo a ADMIN y activando...`);
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true, fullName: true, role: true },
    });
    console.log(`✅ Usuario promovido a administrador exitosamente:`, updated);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email,
      fullName: name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });

  console.log(`\n🎉 Administrador creado exitosamente:`);
  console.log(`   ID:     ${admin.id}`);
  console.log(`   Email:  ${admin.email}`);
  console.log(`   Nombre: ${admin.fullName}`);
  console.log(`   Rol:    ${admin.role}\n`);
}

main()
  .catch((err) => {
    console.error('Error al crear administrador:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
