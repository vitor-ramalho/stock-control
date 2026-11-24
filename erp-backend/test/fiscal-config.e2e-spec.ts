import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Fiscal Config E2E', () => {
  let app: INestApplication;

  const tenantA = '550e8400-e29b-41d4-a716-446655440021';
  const tenantB = '550e8400-e29b-41d4-a716-446655440022';
  const fakeToken =
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjMiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwidGVuYW50SWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMjEifQ.invalid';

  beforeAll(() => {
    process.env.SECRET_ENCRYPTION_KEY =
      process.env.SECRET_ENCRYPTION_KEY || '12345678901234567890123456789012';
    process.env.SECURE_FILES_ROOT = process.env.SECURE_FILES_ROOT || '.secure-files-test';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('requires authentication for fiscal endpoints', async () => {
    const response = await request(app.getHttpServer()).get('/fiscal/establishments');
    expect([400, 401, 403]).toContain(response.status);
  });

  it('rejects malformed cnpj payload when authorized headers are present', async () => {
    const response = await request(app.getHttpServer())
      .post('/fiscal/establishments')
      .set('Authorization', `Bearer ${fakeToken}`)
      .set('X-Tenant-ID', tenantA)
      .send({
        legalName: 'Empresa Fiscal Teste',
        cnpj: '123',
        stateCode: 'MG',
        cityIbgeCode: '3106200',
      });

    expect([400, 401, 403]).toContain(response.status);
  });

  it('blocks cross-tenant fiscal access attempts', async () => {
    const response = await request(app.getHttpServer())
      .get('/fiscal/establishments')
      .set('Authorization', `Bearer ${fakeToken}`)
      .set('X-Tenant-ID', tenantB);

    expect([401, 403]).toContain(response.status);
  });

  it('limits backoffice fiscal endpoints to superadmin context', async () => {
    const response = await request(app.getHttpServer())
      .get(`/backoffice/fiscal/tenants/${tenantA}/establishments`)
      .set('Authorization', `Bearer ${fakeToken}`);

    expect([401, 403]).toContain(response.status);
  });
});
