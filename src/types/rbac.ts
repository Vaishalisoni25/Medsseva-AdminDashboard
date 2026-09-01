export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  permissions: { permission: Permission }[];
  _count?: { adminUsers: number };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: { name: string; email: string };
}

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'patients', label: 'Patients' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'home_collection', label: 'Home Collection' },
  { key: 'lab_tests', label: 'Lab Tests' },
  { key: 'reports', label: 'Reports' },
  { key: 'payments', label: 'Payments' },
  { key: 'orders', label: 'Orders' },
  { key: 'franchise', label: 'Franchise' },
  { key: 'lab_department', label: 'Lab Department' },
  { key: 'staff', label: 'Staff' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'packages', label: 'Packages' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'pathologies', label: 'Pathologies' },
  { key: 'support', label: 'Customer Support' },
  { key: 'settings', label: 'Settings' },
  { key: 'roles_permissions', label: 'Roles & Permissions' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'audit_logs', label: 'Audit Logs' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'cms', label: 'CMS' },
] as const;

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign'] as const;
export type ModuleKey = typeof MODULES[number]['key'];
export type ActionKey = typeof ACTIONS[number];