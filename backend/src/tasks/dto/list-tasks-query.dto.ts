import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { TaskStatus } from '../../common/enums/task-status.enum.js';

/** Adds `?status=pending|done` to the shared pagination params (tabs on TasksPage). */
export class ListTasksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
