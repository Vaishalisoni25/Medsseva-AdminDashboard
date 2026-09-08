import React, { useState, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { usePatientsQuery, useBranchesQuery } from '@/hooks/useAdminQueries';
import { patientService } from '@/services/api';
import {
  UserRound,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  Building2,
  MapPin,
  HeartPulse,
  Users,
  CheckCircle2,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export interface PatientRecord {
  id: string;
  name: string;
  uhid?: string | null;
  mobile: string;
  email?: string | null;
  gender?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  altMobile?: string | null;
  avatarUrl?: string | null;
  healthScore?: number;
  isActive?: boolean;
  createdAt: string;
  familyMembers?: {
    id: string;
    name: string;
    relation: string;
    age: number;
    gender: string;
  }[];
  addresses?: {
    id: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    type: string;
    isDefault: boolean;
  }[];
  bookings?: {
    id: string;
    bookingCode: string;
    branchId?: string | null;
    branch?: {
      id: string;
      name: string;
      city?: string;
      code?: string;
    } | null;
    status: string;
    createdAt: string;
    scheduledDate?: string;
    totalPaid: number;
  }[];
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export const PatientsPage: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  const isSuperAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    (currentUser as any)?.isSuperAdmin;
  const userBranchId = (currentUser as any)?.branchId || (currentUser as any)?.adminUser?.branchId;

  // RBAC Permission checks
  const permissions: string[] = currentUser?.permissions || [];
  const canCreate = isSuperAdmin || permissions.includes('users.create') || permissions.includes('users.edit');
  const canEdit = isSuperAdmin || permissions.includes('users.edit');
  const canDelete = isSuperAdmin || permissions.includes('users.delete');

  // Query Data
  const { data: branchesData = [] } = useBranchesQuery();
  const branches = useMemo(() => (Array.isArray(branchesData) ? branchesData : []), [branchesData]);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
    !isSuperAdmin && userBranchId ? userBranchId : 'ALL'
  );
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queryParams = useMemo(() => {
    const p: { branchId?: string; search?: string } = {};
    if (!isSuperAdmin && userBranchId) {
      p.branchId = userBranchId;
    } else if (selectedBranchFilter !== 'ALL') {
      p.branchId = selectedBranchFilter;
    }
    if (searchQuery.trim()) {
      p.search = searchQuery.trim();
    }
    return p;
  }, [isSuperAdmin, userBranchId, selectedBranchFilter, searchQuery]);

  const {
    data: rawPatients = [],
    isLoading,
    isRefetching,
    refetch,
  } = usePatientsQuery(queryParams);

  // Filter patients on client for quick snappy filtering
  const patients: PatientRecord[] = useMemo(() => {
    if (!Array.isArray(rawPatients)) return [];
    return rawPatients.filter((p: PatientRecord) => {
      // Branch filter on client (matches booking branches)
      if (!isSuperAdmin && userBranchId) {
        const hasBookingInBranch = p.bookings?.some(b => b.branchId === userBranchId);
        if (p.bookings && p.bookings.length > 0 && !hasBookingInBranch) return false;
      } else if (selectedBranchFilter !== 'ALL') {
        const hasBookingInBranch = p.bookings?.some(b => b.branchId === selectedBranchFilter);
        if (p.bookings && p.bookings.length > 0 && !hasBookingInBranch) return false;
      }

      // Gender filter
      if (selectedGenderFilter !== 'ALL') {
        if (!p.gender || p.gender.toLowerCase() !== selectedGenderFilter.toLowerCase()) {
          return false;
        }
      }

      // Blood Group filter
      if (selectedBloodGroupFilter !== 'ALL') {
        if (!p.bloodGroup || p.bloodGroup.toUpperCase() !== selectedBloodGroupFilter.toUpperCase()) {
          return false;
        }
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesMobile = p.mobile?.includes(q);
        const matchesEmail = p.email?.toLowerCase().includes(q);
        const matchesUhid = p.uhid?.toLowerCase().includes(q);
        const matchesAddress = p.addresses?.some(a => a.line1.toLowerCase().includes(q) || a.city.toLowerCase().includes(q));
        if (!matchesName && !matchesMobile && !matchesEmail && !matchesUhid && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [rawPatients, isSuperAdmin, userBranchId, selectedBranchFilter, selectedGenderFilter, selectedBloodGroupFilter, searchQuery]);

  // Metric summaries
  const stats = useMemo(() => {
    const total = patients.length;
    let male = 0;
    let female = 0;
    let totalBookings = 0;

    patients.forEach(p => {
      if (p.gender?.toLowerCase() === 'male') male++;
      else if (p.gender?.toLowerCase() === 'female') female++;
      totalBookings += p.bookings?.length || 0;
    });

    const activeCount = patients.filter(p => (p.bookings?.length || 0) > 0).length;

    return { total, male, female, totalBookings, activeCount };
  }, [patients]);

  // Drawer state
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formDob, setFormDob] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('');
  const [formAltMobile, setFormAltMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBranchId, setFormBranchId] = useState('');

  // Delete modal state
  const [patientToDelete, setPatientToDelete] = useState<PatientRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormGender('Male');
    setFormDob('');
    setFormBloodGroup('');
    setFormAltMobile('');
    setFormAddress('');
    setFormBranchId(!isSuperAdmin && userBranchId ? userBranchId : branches[0]?.id || '');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: PatientRecord) => {
    setEditingPatient(p);
    setFormName(p.name || '');
    setFormMobile(p.mobile || '');
    setFormEmail(p.email || '');
    setFormGender(p.gender || 'Male');
    setFormDob(p.dob || '');
    setFormBloodGroup(p.bloodGroup || '');
    setFormAltMobile(p.altMobile || '');
    setFormAddress(p.addresses?.[0]?.line1 || '');
    setFormBranchId(p.bookings?.[0]?.branchId || userBranchId || branches[0]?.id || '');
    setIsModalOpen(true);
  };

  // Open Details Drawer
  const handleOpenDetails = (p: PatientRecord) => {
    setSelectedPatient(p);
    setIsDrawerOpen(true);
  };

  // Suspend / Reactivate Patient
  const handleToggleSuspend = async (patient: PatientRecord) => {
    const isCurrentlySuspended = patient.isActive === false;
    const actionText = isCurrentlySuspended ? 'reactivate' : 'suspend';
    if (!confirm(`Are you sure you want to ${actionText} patient ${patient.name}?`)) return;

    try {
      await patientService.updatePatient(patient.id, { isActive: isCurrentlySuspended });
      toast.success(
        isCurrentlySuspended
          ? `Patient ${patient.name} reactivated successfully`
          : `Patient ${patient.name} suspended successfully`
      );
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || `Failed to ${actionText} patient`);
    }
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Patient Name is required');
      return;
    }
    const cleanMobile = formMobile.replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        mobile: cleanMobile,
        email: formEmail.trim() || undefined,
        gender: formGender,
        dob: formDob.trim() || undefined,
        bloodGroup: formBloodGroup || undefined,
        altMobile: formAltMobile.trim() || undefined,
        address: formAddress.trim() || undefined,
        branchId: formBranchId || undefined,
      };

      if (editingPatient) {
        await patientService.updatePatient(editingPatient.id, payload);
        toast.success('Patient details updated successfully');
      } else {
        await patientService.createPatient(payload);
        toast.success('Patient registered successfully');
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save patient');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Patient
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await patientService.deletePatient(patientToDelete.id);
      toast.success('Patient deleted successfully');
      setPatientToDelete(null);
      if (selectedPatient?.id === patientToDelete.id) {
        setIsDrawerOpen(false);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to delete patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const assignedBranchName = useMemo(() => {
    if (isSuperAdmin) return null;
    const b = branches.find(item => item.id === userBranchId);
    return b?.name || 'Assigned Branch';
  }, [isSuperAdmin, branches, userBranchId]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-6 rounded-2xl border border-border/70 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a7c7c]/10 flex items-center justify-center text-[#0a7c7c]">
              <UserRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Patient Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Centralized patient directory, diagnostic booking history & clinical records
                {assignedBranchName && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0a7c7c]/10 text-[#0a7c7c] border border-[#0a7c7c]/20">
                    <Building2 className="w-3 h-3 mr-1" />
                    {assignedBranchName}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh patient records"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', (isLoading || isRefetching) && 'animate-spin text-[#0a7c7c]')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canCreate && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0a7c7c] to-emerald-600 hover:from-[#096b6b] hover:to-emerald-700 text-white font-medium text-sm flex items-center gap-2 shadow-md shadow-[#0a7c7c]/20 hover:shadow-[#0a7c7c]/30 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-card p-5 rounded-2xl border border-border/70 shadow-xs relative overflow-hidden group hover:border-[#0a7c7c]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#0a7c7c]/10 text-[#0a7c7c] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : stats.total}
            </span>
            <span className="text-xs text-muted-foreground">registered users</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#0a7c7c] rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Patients with Bookings */}
        <div className="bg-card p-5 rounded-2xl border border-border/70 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Test Patients
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : stats.activeCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">with lab visits</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.activeCount / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="bg-card p-5 rounded-2xl border border-border/70 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gender Distribution
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-sm font-semibold text-foreground">
              M: <span className="text-indigo-600 font-bold">{stats.male}</span>
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm font-semibold text-foreground">
              F: <span className="text-pink-600 font-bold">{stats.female}</span>
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden flex">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${stats.total > 0 ? (stats.male / stats.total) * 100 : 50}%` }}
            />
            <div
              className="h-full bg-pink-500"
              style={{ width: `${stats.total > 0 ? (stats.female / stats.total) * 100 : 50}%` }}
            />
          </div>
        </div>

        {/* Total Lab Bookings */}
        <div className="bg-card p-5 rounded-2xl border border-border/70 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Tests / Bookings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : stats.totalBookings}
            </span>
            <span className="text-xs text-muted-foreground">lifetime bookings</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Name, UHID, Mobile, Email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Branch Filter (Only Super Admin can change branches) */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <select
                value={selectedBranchFilter}
                onChange={e => setSelectedBranchFilter(e.target.value)}
                className="bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0a7c7c]"
              >
                <option value="ALL">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-3 py-2 bg-muted/60 text-foreground rounded-xl text-xs font-medium border border-border">
              <Building2 className="w-3.5 h-3.5 text-[#0a7c7c]" />
              <span>{assignedBranchName}</span>
            </div>
          )}

          {/* Gender Filter */}
          <select
            value={selectedGenderFilter}
            onChange={e => setSelectedGenderFilter(e.target.value)}
            className="bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0a7c7c]"
          >
            <option value="ALL">All Genders</option>
            {GENDERS.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Blood Group Filter */}
          <select
            value={selectedBloodGroupFilter}
            onChange={e => setSelectedBloodGroupFilter(e.target.value)}
            className="bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0a7c7c]"
          >
            <option value="ALL">All Blood Groups</option>
            {BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>

          {(searchQuery || selectedGenderFilter !== 'ALL' || selectedBloodGroupFilter !== 'ALL' || (isSuperAdmin && selectedBranchFilter !== 'ALL')) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenderFilter('ALL');
                setSelectedBloodGroupFilter('ALL');
                if (isSuperAdmin) setSelectedBranchFilter('ALL');
              }}
              className="text-xs text-[#0a7c7c] hover:underline font-medium px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. Patients Table */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/70">
              <tr>
                <th className="py-3.5 px-5">Patient</th>
                <th className="py-3.5 px-5">Contact</th>
                <th className="py-3.5 px-5">Demographics</th>
                <th className="py-3.5 px-5">UHID / ID</th>
                <th className="py-3.5 px-5">Registered Branch / Location</th>
                <th className="py-3.5 px-5">Diagnostic Bookings</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0a7c7c] mx-auto mb-2" />
                    <p className="text-sm">Loading patient directory...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-3">
                      <UserRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No patients found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {searchQuery || selectedBranchFilter !== 'ALL' || selectedGenderFilter !== 'ALL'
                        ? 'Try changing search terms or filters to find patients.'
                        : 'No patients registered in the system yet. Click "Add New Patient" to register one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map(patient => {
                  const recentBooking = patient.bookings?.[0];
                  const patientBranch = recentBooking?.branch || branches.find(b => b.id === recentBooking?.branchId);
                  const address = patient.addresses?.[0];

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetails(patient)}
                    >
                      {/* Name & Initials */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a7c7c]/20 to-emerald-500/20 text-[#0a7c7c] font-bold text-xs flex items-center justify-center border border-[#0a7c7c]/20 flex-shrink-0">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-[#0a7c7c] transition-colors flex items-center gap-1.5">
                              <span>{patient.name}</span>
                              {patient.isActive === false && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Reg: {new Date(patient.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Phone className="w-3 h-3 text-[#0a7c7c]" />
                            <span>{patient.mobile}</span>
                          </div>
                          {patient.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[160px]">{patient.email}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">No email</span>
                          )}
                        </div>
                      </td>

                      {/* Demographics */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {patient.gender && (
                            <span
                              className={cn(
                                'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                                patient.gender.toLowerCase() === 'male'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : patient.gender.toLowerCase() === 'female'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              )}
                            >
                              {patient.gender}
                            </span>
                          )}
                          {patient.dob && (
                            <span className="text-xs text-muted-foreground">
                              {patient.dob}
                            </span>
                          )}
                          {patient.bloodGroup && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                              {patient.bloodGroup}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* UHID */}
                      <td className="py-4 px-5">
                        {patient.uhid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-muted text-foreground border border-border">
                            {patient.uhid}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">Auto on Visit</span>
                        )}
                      </td>

                      {/* Branch / Location */}
                      <td className="py-4 px-5">
                        {patientBranch ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Building2 className="w-3.5 h-3.5 text-[#0a7c7c]" />
                            <span>{patientBranch.name}</span>
                            {patientBranch.city && (
                              <span className="text-muted-foreground text-[11px]">({patientBranch.city})</span>
                            )}
                          </div>
                        ) : address ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[180px]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{address.line1}, {address.city}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Walk-in / App</span>
                        )}
                      </td>

                      {/* Diagnostic Bookings Count */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {patient.bookings?.length || 0} Tests
                          </span>
                          {recentBooking && (
                            <span className="text-[11px] text-muted-foreground">
                              Latest: {recentBooking.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(patient)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0a7c7c] hover:bg-[#0a7c7c]/10 transition-colors cursor-pointer"
                            title="View Patient Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Suspend / Reactivate Action */}
                          <button
                            onClick={() => handleToggleSuspend(patient)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              patient.isActive === false
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                : "text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                            )}
                            title={patient.isActive === false ? "Reactivate Patient" : "Suspend Patient"}
                          >
                            {patient.isActive === false ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ShieldAlert className="w-4 h-4" />
                            )}
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(patient)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Edit Patient"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setPatientToDelete(patient)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Patient Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Patient Details Slide-Over Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-border bg-muted/20 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a7c7c]/20 to-emerald-500/20 text-[#0a7c7c] font-bold text-sm flex items-center justify-center border border-[#0a7c7c]/30">
                      {getInitials(selectedPatient.name)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {selectedPatient.name}
                        {selectedPatient.uhid && (
                          <span className="text-xs font-mono px-2 py-0.5 bg-background border border-border rounded text-muted-foreground">
                            {selectedPatient.uhid}
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{selectedPatient.gender || 'Patient'}</span>
                        {selectedPatient.dob && <span>• {selectedPatient.dob}</span>}
                        {selectedPatient.bloodGroup && (
                          <span className="font-bold text-red-600 bg-red-50 px-1 rounded">
                            {selectedPatient.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Contact Information Card */}
                  <div className="bg-background rounded-xl p-4 border border-border space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Contact Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Phone className="w-3.5 h-3.5 text-[#0a7c7c]" /> Mobile
                        </span>
                        <span className="font-medium text-foreground">{selectedPatient.mobile}</span>
                      </div>
                      {selectedPatient.altMobile && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-2 text-xs">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Alt Mobile
                          </span>
                          <span className="font-medium text-foreground">{selectedPatient.altMobile}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Mail className="w-3.5 h-3.5 text-[#0a7c7c]" /> Email
                        </span>
                        <span className="font-medium text-foreground">{selectedPatient.email || 'Not Provided'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-[#0a7c7c]" /> Registered On
                        </span>
                        <span className="text-xs text-foreground font-medium">
                          {new Date(selectedPatient.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="bg-background rounded-xl p-4 border border-border space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Addresses</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {selectedPatient.addresses?.length || 0} saved
                      </span>
                    </h3>
                    {selectedPatient.addresses && selectedPatient.addresses.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatient.addresses.map(a => (
                          <div key={a.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-[#0a7c7c]" /> {a.type || 'HOME'}
                              </span>
                              {a.isDefault && (
                                <span className="text-[10px] bg-[#0a7c7c]/10 text-[#0a7c7c] px-1.5 py-0.5 rounded font-semibold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1">{a.line1}</p>
                            <p className="text-muted-foreground">
                              {a.city}, {a.state} {a.pincode && `- ${a.pincode}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No address on record</p>
                    )}
                  </div>

                  {/* Family Members */}
                  <div className="bg-background rounded-xl p-4 border border-border space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Family Members</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {selectedPatient.familyMembers?.length || 0} members
                      </span>
                    </h3>
                    {selectedPatient.familyMembers && selectedPatient.familyMembers.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatient.familyMembers.map(fm => (
                          <div key={fm.id} className="p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{fm.name}</p>
                              <p className="text-muted-foreground text-[11px]">
                                {fm.relation} • {fm.gender} • {fm.age} yrs
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-background border border-border text-[11px] text-muted-foreground">
                              {fm.relation}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No family members added</p>
                    )}
                  </div>

                  {/* Booking & Diagnostic History */}
                  <div className="bg-background rounded-xl p-4 border border-border space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Diagnostic Test History</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {selectedPatient.bookings?.length || 0} visits
                      </span>
                    </h3>
                    {selectedPatient.bookings && selectedPatient.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPatient.bookings.map(b => (
                          <div key={b.id} className="p-3 rounded-lg bg-muted/40 border border-border/70 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-foreground">{b.bookingCode}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {b.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                              <span>
                                {new Date(b.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="font-bold text-foreground">₹{b.totalPaid}</span>
                            </div>
                            {b.branch && (
                              <div className="text-[11px] text-[#0a7c7c] font-medium flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {b.branch.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No previous bookings found</p>
                    )}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleOpenEdit(selectedPatient);
                      }}
                      className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      Edit Details
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => {
                        setPatientToDelete(selectedPatient);
                      }}
                      className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Add / Edit Patient Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden z-10"
            >
              <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-[#0a7c7c]" />
                  {editingPatient ? 'Edit Patient Details' : 'Register New Patient'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                  />
                </div>

                {/* Mobile & Alt Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formMobile}
                      onChange={e => setFormMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Alt Mobile (Optional)
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formAltMobile}
                      onChange={e => setFormAltMobile(e.target.value)}
                      placeholder="Alternate phone"
                      className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                  />
                </div>

                {/* Gender, DOB, Blood Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Gender</label>
                    <select
                      value={formGender}
                      onChange={e => setFormGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    >
                      {GENDERS.map(g => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      DOB / Age
                    </label>
                    <input
                      type="text"
                      value={formDob}
                      onChange={e => setFormDob(e.target.value)}
                      placeholder="e.g. 28 yrs or YYYY-MM-DD"
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Blood Group
                    </label>
                    <select
                      value={formBloodGroup}
                      onChange={e => setFormBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    >
                      <option value="">Unknown</option>
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branch Selection (Only if Super Admin) */}
                {isSuperAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Associated Branch
                    </label>
                    <select
                      value={formBranchId}
                      onChange={e => setFormBranchId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Residential Address */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    placeholder="House / Flat No, Street, Landmark, Area"
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#0a7c7c]/20 focus:border-[#0a7c7c] outline-none resize-none"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0a7c7c] to-emerald-600 hover:from-[#096b6b] hover:to-emerald-700 rounded-xl transition-all shadow-md shadow-[#0a7c7c]/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPatient ? 'Save Changes' : 'Register Patient'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Delete Confirmation Modal */}
      <AnimatePresence>
        {patientToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPatientToDelete(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl p-6 z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">Delete Patient Record?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to delete <strong>{patientToDelete.name}</strong> ({patientToDelete.mobile})?
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPatientToDelete(null)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete Patient</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
