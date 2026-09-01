import React from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrap any UI element to conditionally render based on permission.
 * <PermissionGate permission="bookings.delete">
 *   <button>Delete</button>
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { can } = usePermission();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};