import type { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';
import { DEFAULT_PAGE_SIZE, type PaginationQueryDto } from './dto/pagination-query.dto.js';
import type { PaginatedResult } from './dto/paginated-result.interface.js';

/**
 * One shared `findAndCount` + skip/take wrapper so every list endpoint
 * paginates the same way instead of each service reinventing offset math.
 */
export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  query: PaginationQueryDto,
  options: FindManyOptions<T> = {},
): Promise<PaginatedResult<T>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;

  const [data, total] = await repository.findAndCount({
    ...options,
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
