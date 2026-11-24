import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AccessTokenPayload } from '../../common/interfaces/acess-token.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async publicRegister(registerDto: RegisterDto) {
    // Create tenant first (inactive by default)
    const slug = registerDto.company.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const tenant = await this.tenantService.create({
      name: registerDto.company.name,
      slug: slug,
      isActive: false, // Tenant starts inactive, must be activated by superadmin
    });

    const createUserDto: CreateUserDto = {
      email: registerDto.user.email,
      password: registerDto.user.password,
      name: registerDto.user.fullName,
      role: UserRole.ADMIN,
    };

    // Create admin user for the tenant
    const user = await this.usersService.create(createUserDto, tenant.id);

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    let user: User | null = null;

    const tenantSlug = loginDto.tenantSlug?.trim().toLowerCase();
    if (tenantSlug) {
      try {
        const tenant = await this.tenantService.findBySlug(tenantSlug);
        user = await this.usersService.findByEmail(loginDto.email, tenant.id);
      } catch {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      const users = await this.usersService.findManyByEmail(loginDto.email);

      // Without tenant context, login is allowed only when the email maps to a single account.
      if (users.length === 1) {
        user = users[0];
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Check if tenant is active (skip for superadmin)
    if (user.role !== UserRole.SUPERADMIN) {
      const tenant = await this.tenantService.findOne(user.tenantId);
      if (!tenant.isActive) {
        throw new UnauthorizedException(
          'Company account is inactive. Please contact support.',
        );
      }
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(
        refreshTokenDto.refresh_token,
        {
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      const user = await this.usersService.findOne(
        payload.sub,
        payload.tenantId,
      );

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string, tenantId: string): Promise<User | null> {
    try {
      return await this.usersService.findOne(userId, tenantId);
    } catch {
      return null;
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload);
  }

  private generateTokens(user: User): {
    access_token: string;
    refresh_token: string;
  } {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return {
      access_token,
      refresh_token,
    };
  }
}
