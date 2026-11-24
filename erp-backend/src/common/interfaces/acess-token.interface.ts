import { UserRole } from '../../modules/users/entities/user.entity';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
}
