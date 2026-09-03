/**
 * Creates the first admin account. There is no open self-registration in
 * this CRM — accounts are created by an admin/sales manager through
 * POST /users — so this script exists purely to bootstrap that very first
 * account.
 *
 * Usage: npm run seed:admin --workspace=backend
 * Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_FIRST_NAME /
 * SEED_ADMIN_LAST_NAME from backend/.env (see .env.example for defaults).
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usersService = app.get(UsersService);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@beautycrm.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'User';

  const existing = await usersService.findByEmail(email);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Адмін з email "${email}" вже існує — нічого не роблю.`);
    await app.close();
    return;
  }

  await usersService.create({
    email,
    password,
    firstName,
    lastName,
    role: Role.ADMIN,
  });

  // eslint-disable-next-line no-console
  console.log(`Створено адміна: ${email} / ${password}`);
  // eslint-disable-next-line no-console
  console.log('Обов’язково зміни пароль після першого входу.');

  await app.close();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Не вдалося створити адміна:', error);
  process.exit(1);
});
