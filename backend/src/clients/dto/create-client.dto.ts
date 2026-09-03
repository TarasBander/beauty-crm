import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateClientDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  salonName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  position?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}
