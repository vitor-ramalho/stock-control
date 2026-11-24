import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TenantService } from '../tenant/tenant.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tenantService: jest.Mocked<TenantService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findByEmail: jest.fn(),
            findByEmailOnly: jest.fn(),
            findManyByEmail: jest.fn(),
          },
        },
        {
          provide: TenantService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findBySlug: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token-value'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tenantService = module.get(TenantService);
    jwtService = module.get(JwtService);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects login without tenantSlug when email exists in multiple tenants', async () => {
    usersService.findManyByEmail.mockResolvedValue([
      {
        id: 'user-1',
        tenantId: 'tenant-1',
      },
      {
        id: 'user-2',
        tenantId: 'tenant-2',
      },
    ] as User[]);

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('authenticates with tenantSlug and valid credentials', async () => {
    const signSpy = jest.spyOn(jwtService, 'sign');
    tenantService.findBySlug.mockResolvedValue({
      id: 'tenant-1',
      slug: 'loja-a',
      isActive: true,
    } as Tenant);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      password: 'hashed-password',
      role: UserRole.ADMIN,
      tenantId: 'tenant-1',
      isActive: true,
    } as User);

    tenantService.findOne.mockResolvedValue({
      id: 'tenant-1',
      slug: 'loja-a',
      isActive: true,
    } as Tenant);

    const result = await service.login({
      email: 'admin@example.com',
      password: 'secret123',
      tenantSlug: 'loja-a',
    });

    expect(result.user.tenantId).toBe('tenant-1');
    expect(signSpy).toHaveBeenCalled();
  });
});
