import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { DealsService } from '../deals/deals.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
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

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException({ messageKey: 'tasks.notFound' });
    }
    return task;
  }
}
