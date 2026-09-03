import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Digits with optional leading +, spaces, dashes and parentheses — loose on
// purpose since salon clients give phone numbers in many local formats.
const PHONE_PATTERN = /^[+]?[0-9\s\-()]{7,20}$/;

export class CreateClientDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN)
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  salonName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
