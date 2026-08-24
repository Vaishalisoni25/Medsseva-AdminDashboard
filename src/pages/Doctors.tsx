import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { doctorService } from '@/services/api';
import { branchService, Branch } from '@/services/branch.service';
import {
  Stethoscope, Plus, Pencil, Trash2, Search, X, Loader2,
  Building2, CheckCircle2, ShieldCheck, Image as ImageIcon,
  FileSignature, Eye, UserCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export interface DoctorRecord {
  id: string;
  name: string;
  qualification: string;
  registrationNo: string;
  specialization?: string;
  designation?: string;
  photoUrl?: string;
  signatureUrl?: string;
  branchId?: string;
  partnerId?: string;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    city: string;
    code?: string;
  };
  createdAt?: string;
}

const COMMON_SPECIALIZATIONS = [
  'Pathology',
  'Gynecology & Obstetrics',
  'Radiology',
  'Cardiology',
  'General Physician / Internal Medicine',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Microbiology & Biochemistry',
];

export const DoctorsPage: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'SUPER_ADMIN' || (currentUser as any)?.isSuperAdmin;
  const userBranchId = (currentUser as any)?.branchId;

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewSignature, setPreviewSignature] = useState<DoctorRecord | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('Pathology');
  const [customSpec, setCustomSpec] = useState('');
  const [formRegNo, setFormRegNo] = useState('');
  const [formQualification, setFormQualification] = useState('');
  const [formDesignation, setFormDesignation] = useState('Consultant Pathologist');
  const [formBranchId, setFormBranchId] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formSignatureUrl, setFormSignatureUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, branchRes] = await Promise.allSettled([
        doctorService.getDoctors(),
        branchService.getAll(),
      ]);

      if (docRes.status === 'fulfilled' && Array.isArray(docRes.value)) {
        setDoctors(docRes.value);
      }
      if (branchRes.status === 'fulfilled' && branchRes.value?.data) {
        setBranches(branchRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load doctors data:', err);
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
    setFormSpecialization('Pathology');
    setCustomSpec('');
    setFormRegNo('');
    setFormQualification('MBBS, MD (Pathology)');
    setFormDesignation('Senior Consultant Pathologist');
    setFormBranchId('');
    setFormPhotoUrl('');
    setFormSignatureUrl('');
    setModalOpen(true);
  };

  const openEdit = (d: DoctorRecord) => {
    setEditing(d);
    setFormName(d.name);
    if (COMMON_SPECIALIZATIONS.includes(d.specialization || '')) {
      setFormSpecialization(d.specialization || 'Pathology');
      setCustomSpec('');
    } else {
      setFormSpecialization('CUSTOM');
      setCustomSpec(d.specialization || '');
    }
    setFormRegNo(d.registrationNo);
    setFormQualification(d.qualification);
    setFormDesignation(d.designation || '');
    setFormBranchId(d.branchId || '');
    setFormPhotoUrl(d.photoUrl || '');
    setFormSignatureUrl(d.signatureUrl || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formRegNo.trim() || !formQualification.trim()) {
      toast.error('Doctor Name, Registration No., and Qualification are required');
      return;
    }

    const specialization = formSpecialization === 'CUSTOM' ? customSpec.trim() : formSpecialization;

    const payload = {
      name: formName.trim(),
      registrationNo: formRegNo.trim(),
      qualification: formQualification.trim(),
      specialization: specialization || 'General Medicine',
      designation: formDesignation.trim() || 'Consultant',
      branchId: formBranchId || null,
      photoUrl: formPhotoUrl.trim() || null,
      signatureUrl: formSignatureUrl.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await doctorService.updateDoctor(editing.id, payload);
        toast.success('Doctor updated successfully');
      } else {
        await doctorService.createDoctor(payload);
        toast.success('Doctor added successfully');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (d: DoctorRecord) => {
    try {
      await doctorService.updateDoctor(d.id, { isActive: !d.isActive });
      toast.success(d.isActive ? 'Doctor marked inactive' : 'Doctor activated');
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (d: DoctorRecord) => {
    if (!confirm(`Are you sure you want to deactivate Dr. ${d.name}?`)) return;
    try {
      await doctorService.deleteDoctor(d.id);
      toast.success('Doctor removed');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to delete doctor');
    }
  };

  const baseDoctors = useMemo(() => {
    if (!isSuperAdmin && userBranchId) {
      return doctors.filter(d => d.branchId === userBranchId || d.branch?.id === userBranchId);
    }
    return doctors;
  }, [doctors, isSuperAdmin, userBranchId]);

  const filteredDoctors = useMemo(() => {
    return baseDoctors.filter(d => {
      if (specFilter !== 'ALL' && d.specialization !== specFilter) return false;
      if (branchFilter !== 'ALL' && d.branchId !== branchFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.registrationNo.toLowerCase().includes(q) ||
          d.qualification?.toLowerCase().includes(q) ||
          d.specialization?.toLowerCase().includes(q) ||
          d.branch?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [baseDoctors, search, specFilter, branchFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Doctors Directory</h1>
            <p className="text-xs text-muted-foreground">Manage registered Pathologists, Gynecologists, Radiologists & Medical Verifiers</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-md shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Registered Doctors</div>
            <div className="text-lg font-black text-foreground">{doctors.length}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Active Clinical Verifiers</div>
            <div className="text-lg font-black text-foreground">{doctors.filter(d => d.isActive).length}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Branches Covered</div>
            <div className="text-lg font-black text-foreground">{branches.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Specialization Filter */}
          <select
            value={specFilter}
            onChange={e => setSpecFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-foreground"
          >
            <option value="ALL">All Specializations</option>
            {COMMON_SPECIALIZATIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none font-medium text-foreground"
          >
            <option value="ALL">All Branches / Partners</option>
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
            placeholder="Search by Name, Reg No, Specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Doctors Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> Loading Doctors Directory...
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3.5 text-left">Doctor & Specialization</th>
                <th className="px-5 py-3.5 text-left">Registration No.</th>
                <th className="px-5 py-3.5 text-left">Qualification & Role</th>
                <th className="px-5 py-3.5 text-left">Assigned Branch</th>
                <th className="px-5 py-3.5 text-left">Signature</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredDoctors.map(d => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  {/* Doctor Profile */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {d.photoUrl ? (
                        <img
                          src={d.photoUrl}
                          alt={d.name}
                          className="w-10 h-10 rounded-full object-cover border border-teal-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-200">
                          {d.name.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{d.name}</div>
                        <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
                          {d.specialization || 'Clinical Doctor'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Reg No */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300 bg-muted px-2 py-1 rounded">
                      {d.registrationNo}
                    </span>
                  </td>

                  {/* Qualification & Designation */}
                  <td className="px-5 py-3.5 text-xs text-foreground">
                    <div className="font-medium">{d.qualification}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{d.designation || 'Consultant'}</div>
                  </td>

                  {/* Branch */}
                  <td className="px-5 py-3.5 text-xs">
                    {d.branch?.name ? (
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{d.branch.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">All Branches / Central</span>
                    )}
                  </td>

                  {/* Signature Preview */}
                  <td className="px-5 py-3.5">
                    {d.signatureUrl ? (
                      <button
                        onClick={() => setPreviewSignature(d)}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded border border-teal-200/60"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Photo Sign
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                        <FileSignature className="w-3 h-3" /> Digital Stamp
                      </div>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleActive(d)}
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      {d.isActive
                        ? <><ToggleRight className="w-4 h-4 text-emerald-500" /><span className="text-emerald-600 font-semibold">Active</span></>
                        : <><ToggleLeft className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                      }
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Doctor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No doctors found. Click &quot;Add Doctor&quot; to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                {editing ? 'Edit Doctor Profile' : 'Add New Doctor'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Doctor Name */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Doctor Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Dr. Anjali Mehta"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Specialization / Department *</label>
                  <select
                    value={formSpecialization}
                    onChange={e => setFormSpecialization(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30 font-medium"
                  >
                    {COMMON_SPECIALIZATIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="CUSTOM">+ Other Specialization</option>
                  </select>
                </div>

                {/* Custom Specialization Input if selected */}
                {formSpecialization === 'CUSTOM' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Enter Specialization *</label>
                    <input
                      type="text"
                      value={customSpec}
                      onChange={e => setCustomSpec(e.target.value)}
                      placeholder="e.g. Oncologist, ENT Specialist"
                      className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                )}

                {/* Registration Number */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Medical Registration No. *</label>
                  <input
                    type="text"
                    value={formRegNo}
                    onChange={e => setFormRegNo(e.target.value)}
                    placeholder="e.g. MCI-44922 / MMC-12345"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30 font-mono"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Qualification & Degrees *</label>
                  <input
                    type="text"
                    value={formQualification}
                    onChange={e => setFormQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD (Pathology), DNB"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Designation / Role Title</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Pathologist / Chief Verifier"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                {/* Assign Branch */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Assign to Branch / Partner Lab</label>
                  <select
                    value={formBranchId}
                    onChange={e => setFormBranchId(e.target.value)}
                    disabled={!isSuperAdmin && !!userBranchId}
                    className={`w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30 ${!isSuperAdmin && !!userBranchId ? 'opacity-80 cursor-not-allowed bg-muted' : ''}`}
                  >
                    {isSuperAdmin && <option value="">All Branches / Central Lab</option>}
                    {branches
                      .filter(b => isSuperAdmin || !userBranchId || b.id === userBranchId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                      ))}
                  </select>
                </div>

                {/* Doctor Photo URL */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Doctor Photo / Avatar URL (Optional)</label>
                  <input
                    type="text"
                    value={formPhotoUrl}
                    onChange={e => setFormPhotoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../doctor-photo.jpg"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>

                {/* Signature Photo / URL */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Doctor Signature Image URL (For Report PDF Signing)
                  </label>
                  <input
                    type="text"
                    value={formSignatureUrl}
                    onChange={e => setFormSignatureUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../signature.png"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload transparent PNG or JPG signature image. If left blank, a secure digital signature stamp will be applied.
                  </p>
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-md shadow-teal-600/20"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Save Changes' : 'Save Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Preview Modal */}
      {previewSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <h3 className="font-bold text-foreground">Signature Preview</h3>
            <p className="text-xs text-muted-foreground">{previewSignature.name} ({previewSignature.qualification})</p>
            <div className="bg-white p-4 rounded-xl border border-border flex items-center justify-center min-h-32">
              <img
                src={previewSignature.signatureUrl}
                alt="Doctor Signature"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <button
              onClick={() => setPreviewSignature(null)}
              className="w-full py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-semibold transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorsPage;
