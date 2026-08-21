import { store } from '@/redux/store';

/**
 * Check if current user has a permission.
 * Usage: can('bookings.view'), can('reports.approve')
 */
export const can = (permission: string): boolean => {
  const state = store.getState();
  const user = (state as any).auth?.user;
  if (!user) return false;
  // Super Admin always has access
  if (user.role === 'SUPER_ADMIN' || user.adminRoleSlug === 'super_admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

/**
 * Check if current user can view a module (used for sidebar).
 */
export const canViewModule = (module: string): boolean => {
  return can(`${module}.view`);
};

/**
 * Check multiple permissions (AND logic - all must pass).
 */
export const canAll = (...permissions: string[]): boolean => {
  return permissions.every((p) => can(p));
};

/**
 * Check multiple permissions (OR logic - at least one must pass).
 */
export const canAny = (...permissions: string[]): boolean => {
  return permissions.some((p) => can(p));
};