import { CallHandler, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import { TenantInterceptor } from './tenant.interceptor';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;

  beforeEach(() => {
    interceptor = new TenantInterceptor();
  });

  function createContext(request: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('keeps tenantId from request header when present', (done) => {
    const request = { tenantId: 'tenant-1' };
    const context = createContext(request);
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(request.tenantId).toBe('tenant-1');
        done();
      },
      error: done,
    });
  });

  it('uses authenticated user tenantId when header is missing', (done) => {
    const request: { user: { tenantId: string }; tenantId?: string } = {
      user: { tenantId: 'tenant-2' },
    };
    const context = createContext(request);
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(request.tenantId).toBe('tenant-2');
        done();
      },
      error: done,
    });
  });

  it('throws when header tenantId differs from authenticated user tenantId', () => {
    const request = {
      tenantId: 'tenant-from-header',
      user: { tenantId: 'tenant-from-token' },
    };
    const context = createContext(request);
    const next: CallHandler = { handle: () => of('ok') };

    expect(() => interceptor.intercept(context, next)).toThrow(ForbiddenException);
  });
});
