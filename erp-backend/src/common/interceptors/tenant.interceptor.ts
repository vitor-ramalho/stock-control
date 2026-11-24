import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const headerTenantId = request.tenantId;
    const userTenantId = request.user?.tenantId;

    if (headerTenantId && userTenantId && headerTenantId !== userTenantId) {
      throw new ForbiddenException(
        'Tenant mismatch between authenticated user and request header',
      );
    }

    const tenantId = headerTenantId || userTenantId;

    // Store tenantId in request for easy access
    if (tenantId) {
      request.tenantId = tenantId;
    }

    return next.handle();
  }
}
