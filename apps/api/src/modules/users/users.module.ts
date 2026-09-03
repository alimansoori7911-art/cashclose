import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UserPasswordService } from './user-password.service';
import { UsersController } from './users.controller';
import { UsersQuery } from './users.query';
import { UsersService } from './users.service';

@Module({
  // برای هش‌کردن رمز کاربران جدید به `PasswordService` نیاز است.
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersQuery, UserPasswordService],
  exports: [UsersService, UsersQuery],
})
export class UsersModule {}
