import {
  IsDateString,
  IsEmail,
  Matches,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateEstablishmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  legalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(18)
  cnpj: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  legalNature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cnaeMain?: string;

  @IsOptional()
  @IsString()
  cnaeSecondary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cityName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'stateCode must be the UF acronym (e.g., MG)',
  })
  stateCode?: string;

  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, {
    message: 'cityIbgeCode must be the 7-digit municipality IBGE code',
  })
  cityIbgeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  countryCode?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationStatus?: string;

  @IsOptional()
  @IsDateString()
  registrationStatusUpdatedAt?: string;
}
