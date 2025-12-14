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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Legacy method - not used. Use publicRegister instead
  // async register(registerDto: RegisterDto, tenantId: string) {
  //   // This method is not compatible with the new RegisterDto structure
  //   // Use publicRegister for company + user registration
  // }

  async publicRegister(registerDto: RegisterDto) {
    // Create tenant first (inactive by default)
    const slug = registerDto.company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const tenant = await this.tenantService.create({
      name: registerDto.company.name,
      slug: slug,
      isActive: false, // Tenant starts inactive, must be activated by superadmin
    });

    // Create admin user for the tenant
    const user = await this.usersService.create(
      {
        email: registerDto.user.email,
        password: registerDto.user.password,
        name: registerDto.user.fullName,
        role: 'admin', // First user is always admin
      } as any,
      tenant.id,
    );

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
    // Find user by email only (tenantId not required for login)
    const user = await this.usersService.findByEmailOnly(loginDto.email);

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
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(
        payload.sub,
        payload.tenantId,
      );

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
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
