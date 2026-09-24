import { Body, Controller, ForbiddenException, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { toPublicUser } from './user.mapper.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SALES_MANAGER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const { data, meta } = await this.usersService.findAllPaginated(query);
    return { data: data.map(toPublicUser), meta };
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    // @Roles above lets both admin and sales_manager reach this endpoint
    // (a manager can still add a colleague as another sales_manager), but
    // only an admin may hand out the admin role itself. The frontend
    // hides this entirely from non-admins (see UsersPage.tsx, AdminRoute),
    // but the UI is just a courtesy — this is the check that actually
    // stops it, no matter what called the API.
    if (dto.role === Role.ADMIN && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException({ messageKey: 'users.forbiddenRoleAssign' });
    }

    const user = await this.usersService.create(dto);
    return toPublicUser(user);
  }
}
