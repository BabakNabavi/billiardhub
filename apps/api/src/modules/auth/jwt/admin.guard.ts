// apps/api/src/modules/auth/jwt/admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

const ADMIN_UUID = 'eba4e069-81c5-42ac-90c0-dbe188d56b98';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new ForbiddenException('احراز هویت نشده');

    // ادمین با UUID مشخص یا role=admin
    if (user.id === ADMIN_UUID || user.primaryRole === 'admin') {
      return true;
    }

    throw new ForbiddenException('دسترسی فقط برای ادمین');
  }
}
