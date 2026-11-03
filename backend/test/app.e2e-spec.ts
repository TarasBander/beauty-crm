import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { Role } from './../src/common/enums/role.enum.js';
import { I18nExceptionFilter } from './../src/common/filters/i18n-exception.filter.js';
import { validationExceptionFactory } from './../src/common/validation-exception.factory.js';
import { User } from './../src/users/entities/user.entity.js';
import { UsersService } from './../src/users/users.service.js';

// Needs the dev Postgres from docker-compose (`npm run db:up`). Each run
// creates its own throwaway users and deletes them afterwards.
describe('App (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;

  const runId = randomUUID().slice(0, 8);
  const password = 'E2eTest-Password1';
  const managerEmail = `e2e-manager-${runId}@test.local`;
  const createdEmails = [managerEmail, `e2e-escalate-${runId}@test.local`];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Same global setup as main.ts, so responses match production.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    app.useGlobalFilters(new I18nExceptionFilter());
    await app.init();

    usersRepository = app.get(getRepositoryToken(User));
    await app.get(UsersService).create({
      email: managerEmail,
      password,
      firstName: 'E2E',
      lastName: 'Manager',
      role: Role.SALES_MANAGER,
    });
  });

  afterAll(async () => {
    if (usersRepository) {
      await usersRepository.delete(createdEmails.map((email) => ({ email })));
    }
    await app?.close();
  });

  it('GET / returns service info', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ name: 'CRM backend', status: 'running' });
  });

  it('rejects protected routes without a token', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects a wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: 'wrong-password' })
      .expect(401);
  });

  describe('as a sales manager', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: managerEmail, password })
        .expect(200);
      token = res.body.accessToken;
    });

    it('can log in and read own profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe(managerEmail);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('cannot create an admin', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: createdEmails[1],
          password,
          firstName: 'Should',
          lastName: 'Fail',
          role: Role.ADMIN,
        })
        .expect(403);

      expect(await usersRepository.findOneBy({ email: createdEmails[1] })).toBeNull();
    });

    it('cannot manage API keys', () => {
      return request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('gets dashboard aggregates computed in SQL', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.deals.byStage).toHaveLength(6);
      expect(res.body.revenueByMonth).toHaveLength(6);
      expect(typeof res.body.clients.total).toBe('number');
      expect(typeof res.body.payments.totalPaid).toBe('number');
    });

    it('loses access as soon as the account is deactivated', async () => {
      await usersRepository.update({ email: managerEmail }, { isActive: false });
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
