import { useAppSelector } from '@/redux/hooks';
import { useCallback } from 'react';
export const usePermission = () => {
  const user = useAppSelector((state) => state.auth.user);
  const previewRoleSlug = useAppSelector((state) => (state.auth as any).previewRoleSlug);

  const effectiveUser = (() => {
    if (!previewRoleSlug) return user;
    return user;
  })();

  const realIsSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.adminRoleSlug === 'super_admin' || (Array.isArray(user?.permissions) && user?.permissions.includes('*'));

  const can = useCallback(
    (permission: string): boolean => {
      if (!effectiveUser) return false;
      if (!previewRoleSlug && realIsSuperAdmin) return true;
      if (previewRoleSlug && realIsSuperAdmin) {
        return Array.isArray(effectiveUser.permissions) && effectiveUser.permissions.includes(permission);
      }
      if (effectiveUser.role === 'SUPER_ADMIN' || effectiveUser.adminRoleSlug === 'super_admin') return true;
      return Array.isArray(effectiveUser.permissions) && effectiveUser.permissions.includes(permission);
    },
    [effectiveUser, previewRoleSlug, realIsSuperAdmin]
  );

  const canViewModule = useCallback(
    (module: string): boolean => can(`${module}.view`),
    [can]
  );

  const canAny = useCallback(
    (...permissions: string[]): boolean => permissions.some((p) => can(p)),
    [can]
  );

  const isSuperAdmin = realIsSuperAdmin && !previewRoleSlug;

  return { can, canViewModule, canAny, isSuperAdmin, isPreviewMode: !!previewRoleSlug };
};