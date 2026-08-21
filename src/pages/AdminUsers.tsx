import React, { useState, useEffect } from 'react';
import { useAdminUsersQuery, useRolesQuery, useAllPermissionsQuery } from '@/hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import { adminUserService, rbacService } from '@/services/api';
import { AdminRole, Permission } from '@/types/rbac';
import {
  Plus, Pencil, Trash2, Loader2, X, UserCircle2,
  Mail, ShieldCheck, ToggleLeft, ToggleRight,
  CheckSquare, Square
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface AdminUserRecord {
  id: string;
  isActive: boolean;
  franchiseId?: string;
  department?: string;
  role: AdminRole;
  user: { id: string; name: string; email: string; mobile?: string; role: string };
}

const MODULE_PERMISSIONS: { module: string; label: string; actions: string[] }[] = [
  { module: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { module: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'lab_tests', label: 'Test Catalog', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'packages', label: 'Packages', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'bookings', label: 'Bookings', actions: ['view', 'create', 'edit', 'delete', 'assign'] },
  { module: 'samples', label: 'Sample Queue', actions: ['view', 'edit', 'assign'] },
  { module: 'reports', label: 'Report Approval', actions: ['view', 'approve', 'edit', 'delete'] },
  { module: 'payments', label: 'Payments', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'coupons', label: 'Coupons & Offers', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'franchise', label: 'Franchise Tracking', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'inventory', label: 'LIMS Inventory', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'notifications', label: 'Notifications & SMS', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'cms', label: 'CMS Management', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'support', label: 'CRM Support', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { module: 'roles_permissions', label: 'Roles & Permissions', actions: ['view', 'create', 'edit', 'delete'] },
  { module: 'analytics', label: 'Analytics', actions: ['view', 'export'] },
  { module: 'audit_logs', label: 'API Monitor Logs', actions: ['view'] },
];
export const AdminUsersPage: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
 
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRecord | null>(null);
  const [saving, setSaving] = useState(false);

const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formFranchiseId, setFormFranchiseId] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');

const queryClient = useQueryClient();
  const { data: adminUsersData, isLoading: adminUsersLoading } = useAdminUsersQuery();
  const { data: rolesData, isLoading: rolesLoading } = useRolesQuery();
  const { data: permsData, isLoading: permsLoading } = useAllPermissionsQuery();
  const loading = (adminUsersLoading && !adminUsers.length) || (rolesLoading && !roles.length);

  useEffect(() => {
    if (adminUsersData) setAdminUsers(adminUsersData);
    if (rolesData) setRoles(rolesData.filter((r: AdminRole) => r.slug !== 'super_admin'));
    if (permsData) setAllPermissions(permsData);
  }, [adminUsersData, rolesData, permsData]);
const openCreate = () => {
    setEditing(null);
    setFormName(''); setFormEmail(''); setFormMobile(''); setFormPassword('');
    setFormRoleId(roles[0]?.id || '');
    setFormFranchiseId(''); setFormDepartment('');
    setSelectedPerms(new Set());
    setIsCustomRole(false);
    setCustomRoleName('');
    setModalOpen(true);
  };

const openEdit = (u: AdminUserRecord) => {
    setEditing(u);
    setFormName(u.user.name);
    setFormEmail(u.user.email);
    setFormMobile(u.user.mobile || '');
    setFormPassword('');
    setFormRoleId(u.role.id);
    setFormFranchiseId(u.franchiseId || '');
    setFormDepartment(u.department || '');
    const rolePerms = new Set(
      (u.role.permissions || []).map((rp: any) => rp.permission?.id || rp.permissionId)
    );
    setSelectedPerms(rolePerms);
    setIsCustomRole(false);
    setCustomRoleName('');
    setModalOpen(true);
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  };

  const toggleModuleAll = (moduleKey: string) => {
    const modulePerms = allPermissions.filter(p => p.module === moduleKey);
    const allSelected = modulePerms.every(p => selectedPerms.has(p.id));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      modulePerms.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  };

  const handleRoleChange = (roleId: string) => {
    if (roleId === 'custom') {
      setIsCustomRole(true);
      setFormRoleId('');
      setSelectedPerms(new Set());
      return;
    }
    setIsCustomRole(false);
    setFormRoleId(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role) {
      const perms = new Set(
        (role.permissions || []).map((rp: any) => rp.permission?.id || rp.permissionId)
      );
      setSelectedPerms(perms);
    }
  };
  const handleSave = async () => {
if (!formName || !formEmail || (!editing && !formPassword)) {
      toast.error('Fill all required fields');
      return;
    }
    if (formMobile && !/^[6-9]\d{9}$/.test(formMobile.trim())) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    if (isCustomRole && !customRoleName.trim()) {
      toast.error('Enter a name for the custom role');
      return;
    }
    if (!isCustomRole && !formRoleId) {
      toast.error('Select a role');
      return;
    }
    setSaving(true);
    try {
      let roleId = formRoleId;

      if (isCustomRole) {
        const newRole = await rbacService.createRole({
          name: customRoleName.trim(),
          description: `Custom role for ${formName}`,
          permissionIds: Array.from(selectedPerms),
        });
        roleId = newRole.id;
      } else if (selectedPerms.size > 0) {
        await rbacService.updateRole(formRoleId, {
          name: roles.find(r => r.id === formRoleId)?.name,
          permissionIds: Array.from(selectedPerms),
        });
      }

    const payload: any = {
        name: formName,
        email: formEmail,
        mobile: formMobile.trim() || undefined,
        roleId,
        franchiseId: formFranchiseId || undefined,
        department: formDepartment || undefined,
      };
      if (formPassword) payload.password = formPassword;

      if (editing) {
        await adminUserService.updateAdminUser(editing.id, payload);
        toast.success('User updated');
      } else {
        await adminUserService.createAdminUser(payload);
        toast.success('User created');
      }
  setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };
  const handleToggleActive = async (u: AdminUserRecord) => {
    try {
      await adminUserService.updateAdminUser(u.id, { isActive: !u.isActive });
     toast.success(u.isActive ? 'User deactivated' : 'User activated');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (u: AdminUserRecord) => {
    if (!confirm(`Delete user ${u.user.name}? This cannot be undone.`)) return;
    try {
      await adminUserService.deleteAdminUser(u.id);
     toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-xs text-muted-foreground">Create and manage admin panel users</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

    {loading ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3.5 text-left">User</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Role</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="h-3.5 w-28 bg-muted rounded-md" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 w-40 bg-muted rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-5 w-20 bg-muted rounded-full" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-4 w-14 bg-muted rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-6 h-6 bg-muted rounded-lg" />
                      <div className="w-6 h-6 bg-muted rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3.5 text-left">User</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Role</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {adminUsers.map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{u.user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {u.user.email}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                      {u.role.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggleActive(u)} className="flex items-center gap-1.5 text-xs font-medium">
                      {u.isActive
                        ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                        : <><ToggleLeft className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {adminUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    No admin users yet. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {[
                { label: 'Full Name *', value: formName, set: setFormName, type: 'text', placeholder: 'e.g. Rahul Sharma' },
                { label: 'Email *', value: formEmail, set: setFormEmail, type: 'email', placeholder: 'e.g. rahul@medsseva.com' },
               { label: 'Mobile Number', value: formMobile, set: setFormMobile, type: 'tel', placeholder: 'e.g. 9876543210', maxLength: 10 },
                { label: editing ? 'New Password (leave blank to keep)' : 'Password *', value: formPassword, set: setFormPassword, type: 'password', placeholder: 'Min 8 characters' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">{f.label}</label>
                 <input
                      type={f.type}
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      maxLength={(f as any).maxLength}
                      className={cn(
                        "w-full h-10 px-3 bg-background border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60",
                        f.type === 'tel' && formMobile && !/^[6-9]\d{9}$/.test(formMobile.trim())
                          ? "border-destructive focus:ring-destructive/20"
                          : "border-border"
                      )}
                    />
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Role *</label>
                <select
                  value={isCustomRole ? 'custom' : formRoleId}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                  <option value="custom">+ Create Custom Role</option>
                </select>
              </div>

              {isCustomRole && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Custom Role Name *</label>
                  <input
                    type="text"
                    value={customRoleName}
                    onChange={e => setCustomRoleName(e.target.value)}
                    placeholder="e.g. Booking Manager"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Franchise ID (optional)</label>
                <input
                  type="text"
                  value={formFranchiseId}
                  onChange={e => setFormFranchiseId(e.target.value)}
                  placeholder="e.g. MUM-CENT-01"
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Department (optional)</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={e => setFormDepartment(e.target.value)}
                  placeholder="e.g. Biochemistry"
                  className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-foreground">Permissions</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPerms(new Set(allPermissions.map(p => p.id)))}
                      className="text-xs text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPerms(new Set())}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 border border-border rounded-xl overflow-hidden">
                  {MODULE_PERMISSIONS.map(mod => {
                    const modulePerms = allPermissions.filter(
                      p => p.module === mod.module && mod.actions.includes(p.action)
                    );
                    const allSelected = modulePerms.length > 0 && modulePerms.every(p => selectedPerms.has(p.id));
                    return (
                      <div key={mod.module} className="border-b border-border/50 last:border-0">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                          <span className="text-xs font-semibold text-foreground">{mod.label}</span>
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(mod.module)}
                            className="text-[10px] text-primary hover:underline"
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="px-4 py-2 flex flex-wrap gap-3">
                          {mod.actions.map(action => {
                            const perm = allPermissions.find(p => p.module === mod.module && p.action === action);
                            if (!perm) return null;
                            const checked = selectedPerms.has(perm.id);
                            return (
                              <label
                                key={action}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 py-1 rounded-lg transition-colors",
                                  checked ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerm(perm.id)}
                                  className="hidden"
                                />
                                {checked
                                  ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                  : <Square className="w-3.5 h-3.5 flex-shrink-0" />
                                }
                                {action}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{selectedPerms.size} permissions selected</p>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};