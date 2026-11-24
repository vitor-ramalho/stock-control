import { Request } from 'express';
import { UserRole } from '../../modules/users/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
