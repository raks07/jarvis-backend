import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    
    // For ADMIN role, allow all actions
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // For EDITOR role, allow if action requires VIEWER or EDITOR
    if (user.role === UserRole.EDITOR) {
      return requiredRoles.some(role => role === UserRole.VIEWER || role === UserRole.EDITOR);
    }
    
    // For VIEWER role, allow only if action requires VIEWER
    return requiredRoles.some(role => role === UserRole.VIEWER);
  }
}
