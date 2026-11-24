import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'tenantSlug must contain only lowercase letters, numbers, and hyphens',
  })
  tenantSlug?: string;
}
