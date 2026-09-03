import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Every field is optional (PATCH = partial update), but a field that IS
// sent still goes through the same validation as on create — so an empty
// string for firstName/lastName/phone is still rejected, not silently
// accepted as "no change".
export class UpdateClientDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  phone?: string;

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
