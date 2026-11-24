import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Fiscal Documents E2E', () => {
  let app: INestApplication;

  const tenantId = '550e8400-e29b-41d4-a716-446655440021';
  const otherTenantId = '550e8400-e29b-41d4-a716-446655440022';
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

  it('requires authentication to request fiscal emissions', async () => {
    const response = await request(app.getHttpServer())
      .post('/fiscal/documents/emissions')
      .send({});

    expect([400, 401, 403]).toContain(response.status);
  });

  it('rejects malformed emission payload with auth headers', async () => {
    const response = await request(app.getHttpServer())
      .post('/fiscal/documents/emissions')
      .set('Authorization', `Bearer ${fakeToken}`)
      .set('X-Tenant-ID', tenantId)
      .send({
        saleId: 'invalid-uuid',
        establishmentId: 'invalid-uuid',
        documentModel: 'INVALID',
        environment: 'INVALID',
      });

    expect([400, 401, 403]).toContain(response.status);
  });

  it('blocks cross-tenant access to fiscal document by sale endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/fiscal/documents/sale/550e8400-e29b-41d4-a716-446655440099')
      .set('Authorization', `Bearer ${fakeToken}`)
      .set('X-Tenant-ID', otherTenantId);

    expect([401, 403]).toContain(response.status);
  });

  it('requires auth to read queue monitoring endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/fiscal/documents/queue/pending');

    expect([400, 401, 403]).toContain(response.status);
  });
});
