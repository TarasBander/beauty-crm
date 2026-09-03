import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DealStage } from '../../common/enums/deal-stage.enum.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Covers both a full edit and a plain stage move (the Kanban board's
// drag/select action just sends `{ stage }`) — everything optional.
export class UpdateDealDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  clientId?: string;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
