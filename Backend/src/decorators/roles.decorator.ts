import { SetMetadata } from '@nestjs/common';

type Role = 'guest' | 'user' | 'owner' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
