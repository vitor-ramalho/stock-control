import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ValidateNested()
  @Type(() => CompanyDto)
  @IsNotEmpty()
  company: CompanyDto;

  @ValidateNested()
  @Type(() => UserDto)
  @IsNotEmpty()
  user: UserDto;
}
