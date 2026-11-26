import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsOrder } from 'typeorm';
import { ClientsService } from '../clients/clients.service.js';
import type { PaginatedResult } from '../common/dto/paginated-result.interface.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { paginate } from '../common/pagination.util.js';
import { DealsService } from '../deals/deals.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './entities/task.entity.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
  ) {}

  async create(dto: CreateTaskDto, createdById: string): Promise<Task> {
    // Both are optional on a task, but if given must reference something
    // that actually exists — throws the translated 404 otherwise.
    if (dto.clientId) await this.clientsService.findById(dto.clientId);
    if (dto.dealId) await this.dealsService.findById(dto.dealId);

    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ?? null,
      status: dto.status ?? TaskStatus.PENDING,
      clientId: dto.clientId ?? null,
      dealId: dto.dealId ?? null,
      assignedToId: dto.assignedToId ?? createdById,
      createdById,
    });

    const saved = await this.tasksRepository.save(task);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findById(id);

    if (dto.clientId) await this.clientsService.findById(dto.clientId);
    if (dto.dealId) await this.dealsService.findById(dto.dealId);

    const patch: Partial<Task> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description || null;
    if (dto.dueDate !== undefined) patch.dueDate = dto.dueDate || null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.clientId !== undefined) patch.clientId = dto.clientId || null;
    if (dto.dealId !== undefined) patch.dealId = dto.dealId || null;
    if (dto.assignedToId !== undefined) patch.assignedToId = dto.assignedToId || null;

    await this.tasksRepository.update(id, patch);
    return this.findById(id);
  }

  /**
   * Sorted in the database (not in the browser) so every page is in the
   * right place: active tasks by due date, undated ones last; done tasks
   * newest first. Without a status filter, active tasks come first (the
   * enum is declared pending → done, and Postgres sorts enums in that
   * order).
   */
  findAllPaginated(query: ListTasksQueryDto): Promise<PaginatedResult<Task>> {
    const byDueDate: FindOptionsOrder<Task> = {
      dueDate: { direction: 'ASC', nulls: 'LAST' },
      createdAt: 'DESC',
    };
    let order: FindOptionsOrder<Task>;
    if (query.status === TaskStatus.DONE) order = { updatedAt: 'DESC' };
    else if (query.status === TaskStatus.PENDING) order = byDueDate;
    else order = { status: 'ASC', ...byDueDate };

    return paginate(this.tasksRepository, query, {
      where: query.status ? { status: query.status } : undefined,
      order,
    });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException({ messageKey: 'tasks.notFound' });
    }
    return task;
  }
}
