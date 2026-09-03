import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  // MaxLength(72) matches bcrypt's effective input limit — anything
  // beyond that is silently ignored by bcrypt anyway, so reject it
  // explicitly instead of letting it through unnoticed.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
