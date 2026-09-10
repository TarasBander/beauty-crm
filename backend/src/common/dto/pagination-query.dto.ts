import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Keep list responses bounded no matter how large a table grows. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Shared `?page=&limit=` query params for every paginated list endpoint.
 * `@Type(() => Number)` matters here — query params arrive as strings,
 * and the global ValidationPipe has `transform: true`, so this actually
 * coerces `"2"` -> `2` before the `@IsInt()`/`@Min()` checks run.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = DEFAULT_PAGE_SIZE;
}
