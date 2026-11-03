import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { toPublicUser } from './user.mapper.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
// Admin-only, matching the UI (Layout nav + AdminRoute). Hiding the page
// is a courtesy; this is the check that actually stops a manager.
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.usersService.findAllPaginated(query);
    return { data: data.map(toPublicUser), meta };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return toPublicUser(user);
  }
}
