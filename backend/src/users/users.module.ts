import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  // PassportModule is imported here (not just in AuthModule) because
  // UsersController's JwtAuthGuard/RolesGuard are resolved in this
  // module's own injector context and need AuthGuard('jwt')'s
  // dependencies available locally. `.register(...)` (not the bare
  // module) so the AuthModuleOptions provider actually exists in this
  // module's scope.
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
