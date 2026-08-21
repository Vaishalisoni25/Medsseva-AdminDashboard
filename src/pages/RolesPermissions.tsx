import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRolesQuery, useAllPermissionsQuery } from '@/hooks/useAdminQueries';
import { rbacService } from '@/services/api';
import { AdminRole, Permission, MODULES, ACTIONS } from '@/types/rbac';
import { PermissionGate } from '@/components/PermissionGate';
import {
  Shield, Plus, Pencil, Trash2, Copy, Users,
  Search, CheckSquare, Square, ChevronDown, ChevronUp, Loader2, X
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { cn } from '@/utils/cn';

export const RolesPermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
 const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(MODULES.map(m => m.key)));
  const queryClient = useQueryClient();
  const { error } = useToast();

const { data: rolesData, isLoading: rolesLoading } = useRolesQuery();
  const { data: permsData, isLoading: permsLoading } = useAllPermissionsQuery();
  const loading = (rolesLoading && !roles.length) || (permsLoading && !permissions.length);

  useEffect(() => {
    if (rolesData) setRoles(rolesData);
    if (permsData) setPermissions(permsData);
  }, [rolesData, permsData]);

  const openCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormDesc('');
    setSelectedPerms(new Set());
    setModalOpen(true);
  };

  const openEdit = (role: AdminRole) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDesc(role.description || '');
    setSelectedPerms(new Set(role.permissions.map(rp => rp.permission.id)));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload = { name: formName, description: formDesc, permissionIds: Array.from(selectedPerms) };
      if (editingRole) {
        await rbacService.updateRole(editingRole.id, payload);
      } else {
        await rbacService.createRole(payload);
      }
      setModalOpen(false);
     queryClient.invalidateQueries({ queryKey: ['roles'] });
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
     await rbacService.deleteRole(id);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (e: any) {
      error(e.response?.data?.error || 'Cannot delete role');
    }
  };
  const handleClone = async (id: string) => {
    try {
     await rbacService.cloneRole(id);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    } catch (e) {
      console.error(e);
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  };

  const toggleModule = (moduleKey: string, allModulePerms: Permission[]) => {
    const allSelected = allModulePerms.every(p => selectedPerms.has(p.id));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      allModulePerms.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  };

  const toggleModuleExpand = (key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-xs text-muted-foreground">Manage access control across all modules</p>
          </div>
        </div>
        <PermissionGate permission="roles_permissions.create">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="w-full h-9 pl-9 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
        />
      </div>

      {/* Roles Grid */}
    {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-3 w-48 bg-muted rounded-md" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-24 bg-muted rounded-md" />
                <div className="h-3 w-16 bg-muted rounded-md" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-5 w-20 bg-muted rounded-full" />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <div className="h-7 w-14 bg-muted rounded-lg" />
                <div className="h-7 w-16 bg-muted rounded-lg" />
                <div className="h-7 w-16 bg-muted rounded-lg ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRoles.map(role => {
            const permCount = role.permissions.length;
            const userCount = role._count?.adminUsers || 0;
            return (
              <div key={role.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                      {role.isSystem && (
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold uppercase tracking-wide">System</span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    {permCount} permissions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {userCount} users
                  </span>
                </div>

                {/* Permission chips (top 6) */}
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 6).map(rp => (
                    <span key={rp.permission.id} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                      {rp.permission.module}.{rp.permission.action}
                    </span>
                  ))}
                  {permCount > 6 && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                      +{permCount - 6} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <PermissionGate permission="roles_permissions.edit">
                    <button
                      onClick={() => openEdit(role)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="roles_permissions.create">
                    <button
                      onClick={() => handleClone(role.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Clone
                    </button>
                  </PermissionGate>
                  {!role.isSystem && (
                    <PermissionGate permission="roles_permissions.delete">
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Role Name *</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Pathologist, Branch Manager"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Description</label>
                  <input
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Brief description of this role"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPerms(new Set(permissions.map(p => p.id)))}
                      className="text-xs text-primary hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <button
                      onClick={() => setSelectedPerms(new Set())}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {MODULES.map(mod => {
                    const modulePerms = permissions.filter(p => p.module === mod.key);
                    if (modulePerms.length === 0) return null;
                    const allSelected = modulePerms.every(p => selectedPerms.has(p.id));
                    const someSelected = modulePerms.some(p => selectedPerms.has(p.id));
                    const isExpanded = expandedModules.has(mod.key);

                    return (
                      <div key={mod.key} className="border border-border rounded-xl overflow-hidden">
                        {/* Module Header */}
                        <div
                          className="flex items-center justify-between px-4 py-2.5 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                          onClick={() => toggleModuleExpand(mod.key)}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); toggleModule(mod.key, modulePerms); }}
                              className="flex-shrink-0"
                            >
                              {allSelected ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : someSelected ? (
                                <CheckSquare className="w-4 h-4 text-primary/50" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <span className="text-sm font-medium text-foreground">{mod.label}</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>

                        {/* Action Checkboxes */}
                        {isExpanded && (
                          <div className="px-4 py-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {ACTIONS.map(action => {
                              const perm = modulePerms.find(p => p.action === action);
                              if (!perm) return null;
                              const checked = selectedPerms.has(perm.id);
                              return (
                                <label
                                  key={action}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors select-none",
                                    checked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePerm(perm.id)}
                                    className="hidden"
                                  />
                                  {checked ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 flex-shrink-0" />}
                                  {action}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{selectedPerms.size} permissions selected</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};