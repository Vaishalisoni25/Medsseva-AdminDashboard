import React, { useState, useEffect, useMemo } from 'react';
import { adminUserService, rbacService } from '@/services/api';
import { branchService, Branch } from '@/services/branch.service';
import { useAppSelector } from '@/redux/hooks';
import { AdminRole } from '@/types/rbac';
import {
  Briefcase, Plus, Pencil, Trash2, Search, X, Loader2,
  Building2, CheckCircle2, ShieldCheck, Mail, Phone,
  Users, UserCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export interface StaffRecord {
  id: string;
  isActive: boolean;
  department?: string;
  designation?: string;
  franchiseId?: string;
  branchId?: string;
  userType?: string;
  branch?: {
    id: string;
    name: string;
    city: string;
    code?: string;
  };
  role: AdminRole;
  user: {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    role: string;
    createdAt?: string;
  };
}

const COMMON_DEPARTMENTS = [
  'Pathology Lab',
  'Biochemistry & Hematology',
  'Sample Collection (Phlebotomy)',
  'Microbiology & Serology',
  'Reception & Operations',
  'Quality Control & Assurance',
  'Logistics & Courier',
  'Administration & Support',
  'Others',
];

const COMMON_DESIGNATIONS = [
  'Lab Technician',
  'Senior Lab Technician',
  'Phlebotomist / Sample Collector',
  'Lab Assistant',
  'Receptionist',
  'Operations Executive',
  'Branch Coordinator',
  'Quality Analyst',
  'Others',
];

export const StaffPage: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('Pathology Lab');
  const [customDepartment, setCustomDepartment] = useState('');
  const [formDesignation, setFormDesignation] = useState('Lab Technician');
  const [customDesignation, setCustomDesignation] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formFranchiseId, setFormFranchiseId] = useState('');
  const [formRoleId, setFormRoleId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchRes, rolesRes] = await Promise.allSettled([
        adminUserService.getAdminUsers(),
        branchService.getAll(),
        rbacService.getRoles(),
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        // Filter out doctors to keep pure staff and employees
        const employees = usersRes.value.filter((u: any) => {
          const isDoc = u.userType === 'DOCTOR' || (!!u.registrationNo && !u.department);
          return !isDoc;
        });
        setStaffList(employees);
      }
      if (branchRes.status === 'fulfilled' && branchRes.value?.data) {
        setBranches(branchRes.value.data);
      }
      if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value)) {
        setRoles(rolesRes.value.filter((r: AdminRole) => (r.slug || '') !== 'super_admin' && (r.slug || '') !== 'super-admin'));
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormEmail('');
    setFormMobile('');
    setFormPassword('');
    setFormDepartment('Pathology Lab');
    setCustomDepartment('');
    setFormDesignation('Lab Technician');
    setCustomDesignation('');
    const userBranch = (currentUser as any)?.branchId || '';
    setFormBranchId(userBranch || '');
    setFormFranchiseId('');
    const defaultRole = (roles || []).find(r => {
      const s = (r?.slug || '').toLowerCase();
      const n = (r?.name || '').toLowerCase();
      return s.includes('staff') || s.includes('employee') || s.includes('lab') || s.includes('executive') || n.includes('staff') || n.includes('employee') || n.includes('lab') || n.includes('executive');
    }) || roles[0];
    setFormRoleId(defaultRole?.id || '');
    setModalOpen(true);
  };

  const openEdit = (s: StaffRecord) => {
    setEditing(s);
    setFormName(s.user.name);
    setFormEmail(s.user.email);
    setFormMobile(s.user.mobile || '');
    setFormPassword('');

    const isCustomDept = s.department && !COMMON_DEPARTMENTS.filter(d => d !== 'Others').includes(s.department);
    if (isCustomDept) {
      setFormDepartment('Others');
      setCustomDepartment(s.department || '');
    } else {
      setFormDepartment(s.department || 'Pathology Lab');
      setCustomDepartment('');
    }

    const isCustomDesig = s.designation && !COMMON_DESIGNATIONS.filter(d => d !== 'Others').includes(s.designation);
    if (isCustomDesig) {
      setFormDesignation('Others');
      setCustomDesignation(s.designation || '');
    } else {
      setFormDesignation(s.designation || 'Lab Technician');
      setCustomDesignation('');
    }

    setFormBranchId(s.branchId || (s as any).branch?.id || '');
    setFormFranchiseId(s.franchiseId || '');
    setFormRoleId(s.role?.id || roles[0]?.id || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and Email are required');
      return;
    }
    if (formMobile && !/^[6-9]\d{9}$/.test(formMobile.trim())) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    const finalDepartment = formDepartment === 'Others' ? customDepartment.trim() : formDepartment;
    const finalDesignation = formDesignation === 'Others' ? customDesignation.trim() : formDesignation;

    if (!finalDepartment) {
      toast.error('Please enter department name');
      return;
    }
    if (!finalDesignation) {
      toast.error('Please enter staff role / designation');
      return;
    }

    const activeRoleId = formRoleId || (roles || []).find(r => {
      const s = (r?.slug || '').toLowerCase();
      const n = (r?.name || '').toLowerCase();
      return s.includes('staff') || s.includes('employee') || s.includes('lab') || s.includes('executive') || n.includes('staff') || n.includes('employee') || n.includes('lab') || n.includes('executive');
    })?.id || roles[0]?.id;

    const payload = {
      name: formName.trim(),
      email: formEmail.trim(),
      mobile: formMobile.trim() || undefined,
      roleId: activeRoleId,
      userType: 'EMPLOYEE',
      department: finalDepartment || undefined,
      designation: finalDesignation || undefined,
      branchId: formBranchId || undefined,
      franchiseId: formFranchiseId || undefined,
      password: formPassword || 'MedsSeva@123',
    };

    console.log('[STAFF CREATE] Submitting payload to API:', payload);
    setSaving(true);
    try {
      if (editing) {
        const res = await adminUserService.updateAdminUser(editing.id, payload);
        console.log('[STAFF UPDATE] Success:', res);
        toast.success('Staff details updated');
      } else {
        const res = await adminUserService.createAdminUser(payload);
        console.log('[STAFF CREATE] Success:', res);
        toast.success('Staff member registered');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      console.error('[STAFF SAVE ERROR] Response data:', e.response?.data);
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: StaffRecord) => {
    try {
      await adminUserService.updateAdminUser(s.id, { isActive: !s.isActive });
      toast.success(s.isActive ? 'Staff deactivated' : 'Staff activated');
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (s: StaffRecord) => {
    if (!confirm(`Are you sure you want to delete ${s.user.name}?`)) return;
    try {
      await adminUserService.deleteAdminUser(s.id);
      toast.success('Staff member deleted');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to delete staff');
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (deptFilter !== 'ALL' && s.department !== deptFilter) return false;
      if (branchFilter !== 'ALL' && s.branchId !== branchFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.user.name.toLowerCase().includes(q) ||
          s.user.email.toLowerCase().includes(q) ||
          s.user.mobile?.toLowerCase().includes(q) ||
          s.designation?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.branch?.name.toLowerCase().includes(q) ||
          s.role.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffList, search, deptFilter, branchFilter]);

  const countTechnicians = staffList.filter(s => s.designation?.toLowerCase().includes('technician') || s.department?.toLowerCase().includes('lab')).length;
  const countPhlebotomists = staffList.filter(s => s.designation?.toLowerCase().includes('phlebotomist') || s.designation?.toLowerCase().includes('collector')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Staff & Employee Management</h1>
            <p className="text-xs text-muted-foreground">Manage Lab Technicians, Phlebotomists, Operations Staff & Assistants</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Staff / Employees</div>
            <div className="text-lg font-black text-foreground">{staffList.length}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lab Technicians</div>
            <div className="text-lg font-black text-foreground">{countTechnicians}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Phlebotomists / Collectors</div>
            <div className="text-lg font-black text-foreground">{countPhlebotomists}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-foreground"
          >
            <option value="ALL">All Departments</option>
            {COMMON_DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-foreground"
          >
            <option value="ALL">All Branches / Locations</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, role, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Loading staff directory...
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3.5 text-left">Employee Name & Role</th>
                <th className="px-5 py-3.5 text-left">Contact Info</th>
                <th className="px-5 py-3.5 text-left">Department</th>
                <th className="px-5 py-3.5 text-left">Assigned Branch</th>
                <th className="px-5 py-3.5 text-left">Access Role</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  {/* Staff Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200">
                        {s.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{s.user.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {s.designation || 'Lab Staff'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-3.5 text-xs">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.user.email}
                    </div>
                    {s.user.mobile && (
                      <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {s.user.mobile}
                      </div>
                    )}
                  </td>

                  {/* Department */}
                  <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                    <span className="bg-muted px-2.5 py-1 rounded-md text-[11px] font-semibold text-muted-foreground">
                      {s.department || 'Operations'}
                    </span>
                  </td>

                  {/* Branch */}
                  <td className="px-5 py-3.5 text-xs">
                    {s.branch?.name ? (
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{s.branch.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">All Branches / Central</span>
                    )}
                  </td>

                  {/* Access Role */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                      {s.role.name}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      {s.isActive
                        ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600 font-semibold">Active</span></>
                        : <><ToggleLeft className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                      }
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Employee"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No employees found. Click &quot;Add Employee&quot; to register new staff.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                {editing ? 'Edit Employee Profile' : 'Add New Staff / Employee'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Employee Name */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. ramesh@medsseva.com"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Mobile Number</label>
                  <input
                    type="tel"
                    value={formMobile}
                    onChange={e => setFormMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Designation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">Staff Role / Designation *</label>
                    {formDesignation === 'Others' && (
                      <button 
                        type="button" 
                        onClick={() => { setFormDesignation('Lab Technician'); setCustomDesignation(''); }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        ← Select Preset
                      </button>
                    )}
                  </div>

                  {formDesignation === 'Others' ? (
                    <input
                      type="text"
                      value={customDesignation}
                      onChange={e => setCustomDesignation(e.target.value)}
                      placeholder="Type custom role (e.g. Office Staff)"
                      className="w-full h-10 px-3 bg-background border border-indigo-500 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={formDesignation}
                      onChange={e => {
                        setFormDesignation(e.target.value);
                        if (e.target.value === 'Others') {
                          setCustomDesignation('');
                        }
                      }}
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                    >
                      {COMMON_DESIGNATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Department */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">Department *</label>
                    {formDepartment === 'Others' && (
                      <button 
                        type="button" 
                        onClick={() => { setFormDepartment('Pathology Lab'); setCustomDepartment(''); }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        ← Select Preset
                      </button>
                    )}
                  </div>

                  {formDepartment === 'Others' ? (
                    <input
                      type="text"
                      value={customDepartment}
                      onChange={e => setCustomDepartment(e.target.value)}
                      placeholder="Type custom department (e.g. Accounts, HR)"
                      className="w-full h-10 px-3 bg-background border border-indigo-500 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={formDepartment}
                      onChange={e => {
                        setFormDepartment(e.target.value);
                        if (e.target.value === 'Others') {
                          setCustomDepartment('');
                        }
                      }}
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                    >
                      {COMMON_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Assign Branch */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Assign Branch</label>
                  <select
                    value={formBranchId}
                    onChange={e => setFormBranchId(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="">All Branches / Central</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-md shadow-indigo-600/20"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Save Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffPage;
