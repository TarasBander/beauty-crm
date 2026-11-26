import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DealStage } from '../../common/enums/deal-stage.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

/**
 * Adds `clientId` to the shared pagination/search params — used by the
 * deal combobox in TaskForm to search only among deals belonging to the
 * client already picked in that same form, instead of searching every
 * deal in the CRM and letting the user pick a mismatched one.
 */
export class ListDealsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  /** One pipeline stage — the kanban loads and paginates each column separately. */
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;
}
