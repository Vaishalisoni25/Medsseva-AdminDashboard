import React, { useState, useEffect } from 'react';
import { usePartnersQuery } from '@/hooks/useAdminQueries';
import { testService, commissionService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, CheckCircle2, XCircle, AlertCircle,
  Microscope, Phone, Mail, MapPin, Star, Clock,
  ShieldCheck, ShieldX, ShieldAlert, RefreshCw,
  DollarSign, Activity, TrendingUp, FileText, Building2, Loader2,
  Plus, Edit3, Trash2, Eye, EyeOff, Percent, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface Partner {
  id: string;
  labName: string;
  partnerCode?: string;
  role: string;
  address?: string;
  rating: number;
  totalCollections: number;
  commissionRate?: number;
  paymentCycle?: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  isAvailable: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    mobile: string;
    createdAt: string;
  };
}

const STATUS_CONFIG: Record<ApprovalStatus, { bg: string; text: string; border: string; icon: any; label: string }> = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: Clock,        label: 'Pending'   },
  APPROVED:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',icon: CheckCircle2, label: 'Approved'  },
  REJECTED:  { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   icon: XCircle,      label: 'Rejected'  },
  SUSPENDED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: ShieldAlert,  label: 'Suspended' },
};

const REJECTION_REASONS = [
  'Invalid Documents',
  'Incorrect Address',
  'Duplicate Registration',
  'License Verification Failed',
  'Incomplete Information',
  'Outside Service Area',
];

import { useAppSelector } from '@/redux/hooks';

export const PathologyPartnersPage: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'SUPER_ADMIN' || (currentUser as any)?.isSuperAdmin;
  const userBranchId = (currentUser as any)?.branchId;

  const [activeView, setActiveView] = useState<'DIRECTORY' | 'PORTAL'>('DIRECTORY');
  const [partners, setPartners] = useState<Partner[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [partnerRatings, setPartnerRatings] = useState<any>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // Partner Portal Specific State
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [portalPeriod, setPortalPeriod] = useState<'WEEKLY' | '15_DAYS' | '30_DAYS' | 'ALL'>('ALL');
  const [portalData, setPortalData] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Add / Edit Partner Modal State
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formLabName, setFormLabName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState('PARTNER_LAB');
  const [formPartnerCode, setFormPartnerCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState<number>(30);
  const [formPaymentCycle, setFormPaymentCycle] = useState('MONTHLY');
  const [formApprovalStatus, setFormApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [savingPartner, setSavingPartner] = useState(false);

  const { data: partnersData, isLoading: partnersQueryLoading } = usePartnersQuery();
  const isLoading = partnersQueryLoading && partners.length === 0;

  useEffect(() => {
    if (partnersData) {
      setPartners(partnersData);
      if (partnersData.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(partnersData[0].id);
      }
    }
  }, [partnersData]);

  const loadPartnerPortal = async (partId?: string, period = portalPeriod) => {
    const targetId = partId || selectedPartnerId || (partners.length > 0 ? partners[0].id : '');
    if (!targetId && partners.length === 0) return;
    setPortalLoading(true);
    try {
      const res = await commissionService.getPartnerPortalData(period, targetId);
      setPortalData(res);
      if (res?.partner?.id && res.partner.id !== selectedPartnerId) {
        setSelectedPartnerId(res.partner.id);
      }
    } catch (err) {
      console.error('Failed to load partner portal data:', err);
      toast.error('Failed to load partner commission data.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTogglePayout = async (bookingId: string, partnerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await commissionService.updatePayoutStatus({
        bookingId,
        partnerId,
        status: nextStatus,
      });
      toast.success(`Payout marked as ${nextStatus}`);
      loadPartnerPortal(selectedPartnerId, portalPeriod);
    } catch (err: any) {
      toast.error('Failed to update payout status');
    }
  };

  useEffect(() => {
    if (activeView === 'PORTAL') {
      loadPartnerPortal(selectedPartnerId, portalPeriod);
    }
  }, [activeView, selectedPartnerId, portalPeriod]);

  const openPortalForPartner = (partner: Partner) => {
    setSelectedPartnerId(partner.id);
    setActiveView('PORTAL');
    loadPartnerPortal(partner.id, portalPeriod);
  };

  const openCreatePartner = () => {
    setEditingPartner(null);
    setFormLabName('');
    setFormContactName('');
    setFormEmail('');
    setFormMobile('');
    setFormPassword('');
    setShowPassword(false);
    setFormRole('PARTNER_LAB');
    setFormPartnerCode(`PART-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormAddress('');
    setFormCommissionRate(30);
    setFormPaymentCycle('MONTHLY');
    setFormApprovalStatus('APPROVED');
    setPartnerModalOpen(true);
  };

  const openEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setFormLabName(p.labName || '');
    setFormContactName(p.user?.name || '');
    setFormEmail(p.user?.email || '');
    setFormMobile(p.user?.mobile || '');
    setFormPassword('');
    setShowPassword(false);
    setFormRole(p.role || 'PARTNER_LAB');
    setFormPartnerCode(p.partnerCode || `PART-${p.id.slice(0, 5).toUpperCase()}`);
    setFormAddress(p.address || '');
    setFormCommissionRate(p.commissionRate !== undefined && p.commissionRate !== null ? Number(p.commissionRate) : 30);
    setFormPaymentCycle(p.paymentCycle || 'MONTHLY');
    setFormApprovalStatus(p.approvalStatus || 'APPROVED');
    setPartnerModalOpen(true);
  };

  const handleSavePartner = async () => {
    if (!formLabName.trim()) {
      toast.error('Lab / Center Name is required');
      return;
    }
    if (!formContactName.trim()) {
      toast.error('Contact Person Name is required');
      return;
    }
    const cleanMobile = formMobile.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!editingPartner && !formPassword) {
      toast.error('Password is required for partner portal login');
      return;
    }

    setSavingPartner(true);
    try {
      const payload: any = {
        labName: formLabName.trim(),
        name: formContactName.trim(),
        mobile: cleanMobile,
        email: formEmail.trim() || undefined,
        role: formRole,
        partnerCode: formPartnerCode.trim() || undefined,
        address: formAddress.trim() || undefined,
        commissionRate: Number(formCommissionRate) || 30,
        paymentCycle: formPaymentCycle || 'MONTHLY',
        approvalStatus: formApprovalStatus,
      };
      if (formPassword) payload.password = formPassword;

      if (editingPartner) {
        const updated = await testService.updatePartner(editingPartner.id, payload);
        setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...updated } : p));
        if (selectedPartner?.id === editingPartner.id) {
          setSelectedPartner(prev => prev ? { ...prev, ...updated } : null);
        }
        toast.success('Partner updated successfully');
      } else {
        const created = await testService.createPartner(payload);
        setPartners(prev => [created, ...prev]);
        toast.success('Partner added successfully');
      }
      setPartnerModalOpen(false);
    } catch (err: any) {
      console.error('Save partner error:', err);
      toast.error(err?.response?.data?.error || 'Failed to save partner');
    } finally {
      setSavingPartner(false);
    }
  };

  const handleDeletePartner = async (partnerId: string, labName: string) => {
    if (!window.confirm(`Are you sure you want to delete partner "${labName}"?`)) return;
    try {
      await testService.deletePartner(partnerId);
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      if (selectedPartner?.id === partnerId) setSelectedPartner(null);
      toast.success('Partner deleted successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete partner');
    }
  };

  const handleApprove = async (partner: Partner) => {
    setIsUpdating(true);
    try {
      await testService.updatePartnerApproval(partner.id, 'APPROVED');
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, approvalStatus: 'APPROVED' } : p));
      if (selectedPartner?.id === partner.id) setSelectedPartner({ ...partner, approvalStatus: 'APPROVED' });
      toast.success(`${partner.user.name} approved successfully.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to approve partner.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPartner) return;
    const reason = rejectionReason === 'Other' ? customReason : rejectionReason;
    if (!reason) { toast.error('Please select or enter a rejection reason.'); return; }

    setIsUpdating(true);
    try {
      await testService.updatePartnerApproval(selectedPartner.id, 'REJECTED', reason);
      setPartners(prev => prev.map(p => p.id === selectedPartner.id
        ? { ...p, approvalStatus: 'REJECTED', rejectionReason: reason } : p));
      setSelectedPartner({ ...selectedPartner, approvalStatus: 'REJECTED', rejectionReason: reason });
      setIsRejecting(false);
      setRejectionReason('');
      setCustomReason('');
      toast.success('Partner rejected.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to reject partner.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspend = async (partner: Partner) => {
    setIsUpdating(true);
    try {
      await testService.updatePartnerApproval(partner.id, 'SUSPENDED');
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, approvalStatus: 'SUSPENDED' } : p));
      if (selectedPartner?.id === partner.id) setSelectedPartner({ ...partner, approvalStatus: 'SUSPENDED' });
      toast.success('Partner suspended.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to suspend partner.');
    } finally {
      setIsUpdating(false);
    }
  };

  const loadPartnerRatings = async (partnerId: string) => {
    setRatingsLoading(true);
    setPartnerRatings(null);
    try {
      const data = await testService.getPartnerRatings(partnerId);
      setPartnerRatings(data);
    } catch {
      setPartnerRatings(null);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleActivate = async (partner: Partner) => {
    setIsUpdating(true);
    try {
      await testService.updatePartnerApproval(partner.id, 'APPROVED');
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, approvalStatus: 'APPROVED' } : p));
      if (selectedPartner?.id === partner.id) setSelectedPartner({ ...partner, approvalStatus: 'APPROVED' });
      toast.success('Partner reactivated.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to activate partner.');
    } finally {
      setIsUpdating(false);
    }
  };

  const basePartners = React.useMemo(() => {
    if (!isSuperAdmin && userBranchId) {
      return partners.filter((p: any) => p.branchId === userBranchId);
    }
    return partners;
  }, [partners, isSuperAdmin, userBranchId]);

  const filtered = basePartners.filter(p => {
    const matchesSearch =
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.mobile.includes(search) ||
      p.labName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    ALL: basePartners.length,
    PENDING: basePartners.filter(p => p.approvalStatus === 'PENDING').length,
    APPROVED: basePartners.filter(p => p.approvalStatus === 'APPROVED').length,
    REJECTED: basePartners.filter(p => p.approvalStatus === 'REJECTED').length,
    SUSPENDED: basePartners.filter(p => p.approvalStatus === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Tie-up Pathology Partners & Portal
          </h1>
          <p className="text-xs text-muted-foreground">Manage tie-up diagnostic laboratories, sample collections & referral commissions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveView('DIRECTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'DIRECTORY' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Partner Directory & Approvals
            </button>
            <button
              onClick={() => {
                setActiveView('PORTAL');
                loadPartnerPortal(selectedPartnerId, portalPeriod);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'PORTAL' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Referral & Commission Portal
            </button>
          </div>

          <button
            onClick={openCreatePartner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Partner
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* VIEW 1: TIE-UP PARTNER REFERRAL & COMMISSION PORTAL */}
      {activeView === 'PORTAL' ? (
        <div className="space-y-6">
          {/* Partner Selector & Controls Bar */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Partner Lab:</div>
              <select
                value={selectedPartnerId}
                onChange={e => {
                  setSelectedPartnerId(e.target.value);
                  loadPartnerPortal(e.target.value, portalPeriod);
                }}
                className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-emerald-500"
              >
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.labName} ({p.partnerCode || 'PART'}) — {p.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                {[
                  { id: 'WEEKLY', label: 'Weekly (7D)' },
                  { id: '15_DAYS', label: '15 Days' },
                  { id: '30_DAYS', label: '30 Days' },
                  { id: 'ALL', label: 'All Time' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setPortalPeriod(tab.id as any);
                      loadPartnerPortal(selectedPartnerId, tab.id as any);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      portalPeriod === tab.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadPartnerPortal(selectedPartnerId, portalPeriod)}
                className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground transition-colors"
                title="Refresh Portal Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${portalLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Partner Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-900/10 via-card to-card border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Tie-up Laboratory Network</div>
              <h2 className="text-xl font-black text-foreground">
                {portalData?.partner?.labName || partners.find(p => p.id === selectedPartnerId)?.labName || 'Partner Lab'}
              </h2>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Code: <strong className="text-emerald-600 font-mono">{portalData?.partner?.partnerCode || 'PART-201'}</strong></span>
                <span>•</span>
                <span>{portalData?.partner?.address || 'Authorized Center'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 rounded-xl px-4 py-2 text-center">
                <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Commission Rate</div>
                <div className="text-lg font-black text-emerald-800 dark:text-emerald-200">{portalData?.summary?.commissionRate ?? 30}%</div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 rounded-xl px-4 py-2 text-center">
                <div className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">Payment Cycle</div>
                <div className="text-lg font-black text-teal-800 dark:text-teal-200">{portalData?.summary?.paymentCycle || 'MONTHLY'}</div>
              </div>
            </div>
          </div>

          {/* 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Processed Samples</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-foreground">{portalData?.summary?.totalReferredSamples ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{portalData?.summary?.totalTestsCount ?? 0} Tests Investigated</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Billed Turnover</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-foreground">₹{portalData?.summary?.totalBilledAmount?.toLocaleString('en-IN') ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Lab Collections</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Calculated Commission</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">₹{portalData?.summary?.totalCommissionEarned?.toLocaleString('en-IN') ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Calculated @ {portalData?.summary?.commissionRate ?? 30}%</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Payout Status</span>
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-emerald-600 font-bold">₹{portalData?.summary?.paidCommission?.toLocaleString('en-IN') ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Paid</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-600 font-bold">₹{portalData?.summary?.unpaidCommission?.toLocaleString('en-IN') ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Unpaid (Pending)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Samples Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Tie-up Partner Lab Collections & Reports
              </h3>
              <div className="text-xs text-muted-foreground font-mono">
                {portalData?.referrals?.length ?? 0} Samples
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Investigated Tests</th>
                    <th className="py-3 px-4 text-right">Billed Amount</th>
                    <th className="py-3 px-4 text-right">Commission ({portalData?.summary?.commissionRate ?? 30}%)</th>
                    <th className="py-3 px-4 text-center">Payout Status</th>
                    <th className="py-3 px-4 text-center">Lab Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portalLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-emerald-600" /> Loading partner records...
                      </td>
                    </tr>
                  ) : !portalData?.referrals || portalData.referrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No sample records found for this partner in this cycle period.
                      </td>
                    </tr>
                  ) : (
                    portalData.referrals.map((item: any) => (
                      <tr key={item.bookingId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {item.bookingCode}
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {new Date(item.scheduledDate || item.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {item.patientName}
                          <div className="text-[10px] text-muted-foreground font-normal">
                            {item.patientAge ? `${item.patientAge} Y` : ''} {item.patientGender ? `• ${item.patientGender}` : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.tests?.map((t: any, idx: number) => (
                              <span key={idx} className="bg-muted border border-border text-foreground px-2 py-0.5 rounded text-[10px]">
                                {t.name} (₹{t.price})
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">
                          ₹{item.totalPaid?.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                          +₹{item.commissionAmount?.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTogglePayout(item.bookingId, selectedPartnerId, item.payoutStatus)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all hover:opacity-80 active:scale-95 ${
                              item.payoutStatus === 'PAID'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            }`}
                            title="Click to toggle payout status (Paid / Unpaid)"
                          >
                            ● {item.payoutStatus}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.report ? (
                            <a
                              href={item.report.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Report
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Processing</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: PARTNER DIRECTORY & APPROVALS */
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as ApprovalStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <div key={s} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('h-4 w-4', cfg.text)} />
                    <span className="text-xs font-bold text-muted-foreground uppercase">{cfg.label}</span>
                  </div>
                  {isLoading ? (
                    <div className="h-7 bg-muted rounded w-10 animate-pulse mt-1" />
                  ) : (
                    <div className={cn('text-2xl font-bold', cfg.text)}>{counts[s]}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, mobile, or lab..."
                className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-input text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                    statusFilter === s
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary'
                  )}
                >
                  {s === 'ALL' ? `All (${counts.ALL})` : `${STATUS_CONFIG[s as ApprovalStatus].label} (${counts[s as ApprovalStatus]})`}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">Partner</th>
                    <th className="px-6 py-4 font-bold">Lab & Role</th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Rating</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-center">Referral Portal</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="animate-pulse border-b border-border">
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-32" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-24" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-28" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-16" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-20" /></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-20" /></td>
                          <td className="px-6 py-4 text-right"><div className="h-5 bg-muted rounded w-16 ml-auto" /></td>
                        </tr>
                      ))}
                    </>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No partners found.
                      </td>
                    </tr>
                  ) : filtered.map(partner => {
                    const cfg = STATUS_CONFIG[partner.approvalStatus];
                    const StatusIcon = cfg.icon;
                    return (
                      <tr
                        key={partner.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => { setSelectedPartner(partner); loadPartnerRatings(partner.id); }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                              {partner.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{partner.user.name}</div>
                              <div className="text-xs text-muted-foreground">{partner.user.mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{partner.labName}</div>
                          <div className="text-xs text-muted-foreground">{partner.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {partner.user.mobile}
                          </div>
                          {partner.user.email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {partner.user.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold">{partner.rating.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{partner.totalCollections} collections</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold border rounded-full',
                            cfg.bg, cfg.text, cfg.border
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openPortalForPartner(partner)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Portal ({partner.commissionRate ?? 30}%)
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditPartner(partner)}
                              className="h-7 w-7 bg-muted text-foreground hover:bg-primary/10 hover:text-primary rounded-full flex items-center justify-center border border-border transition-colors"
                              title="Edit Partner & Commission"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {partner.approvalStatus === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(partner)}
                                  disabled={isUpdating}
                                  className="h-7 w-7 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full flex items-center justify-center border border-emerald-200"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => { setSelectedPartner(partner); setIsRejecting(true); }}
                                  disabled={isUpdating}
                                  className="h-7 w-7 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-full flex items-center justify-center border border-rose-200"
                                  title="Reject"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {partner.approvalStatus === 'APPROVED' && (
                              <button
                                onClick={() => handleSuspend(partner)}
                                disabled={isUpdating}
                                className="h-7 w-7 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-full flex items-center justify-center border border-orange-200"
                                title="Suspend"
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {(partner.approvalStatus === 'SUSPENDED' || partner.approvalStatus === 'REJECTED') && (
                              <button
                                onClick={() => handleActivate(partner)}
                                disabled={isUpdating}
                                className="h-7 w-7 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full flex items-center justify-center border border-emerald-200"
                                title="Reactivate"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePartner(partner.id, partner.labName)}
                              className="h-7 w-7 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full flex items-center justify-center border border-rose-200 transition-colors"
                              title="Delete Partner"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedPartner && !isRejecting && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
              onClick={() => setSelectedPartner(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold border rounded-full mb-2',
                      STATUS_CONFIG[selectedPartner.approvalStatus].bg,
                      STATUS_CONFIG[selectedPartner.approvalStatus].text,
                      STATUS_CONFIG[selectedPartner.approvalStatus].border
                    )}>
                      {STATUS_CONFIG[selectedPartner.approvalStatus].label}
                    </span>
                    <h2 className="text-xl font-bold text-foreground">{selectedPartner.labName}</h2>
                    <p className="text-xs text-muted-foreground">{selectedPartner.role} · Code: {selectedPartner.partnerCode || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditPartner(selectedPartner)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-lg border border-border transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setSelectedPartner(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Referral Portal & Commission Shortcut */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Referral Commission Rate</div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{selectedPartner.commissionRate ?? 30}% <span className="text-xs font-normal text-muted-foreground">({selectedPartner.paymentCycle || 'MONTHLY'} cycle)</span></div>
                  </div>
                  <button
                    onClick={() => openPortalForPartner(selectedPartner)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <DollarSign className="w-4 h-4" /> Open Portal
                  </button>
                </div>

                {/* Contact Info */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact & Registration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{selectedPartner.user.mobile}</span>
                    </div>
                    {selectedPartner.user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span>{selectedPartner.user.email}</span>
                      </div>
                    )}
                    {selectedPartner.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{selectedPartner.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Registered on {new Date(selectedPartner.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Performance & Ratings */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Performance & Quality</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card p-3 rounded-lg border border-border text-center">
                      <div className="text-xl font-bold text-foreground">{selectedPartner.totalCollections}</div>
                      <div className="text-xs text-muted-foreground">Total Collections</div>
                    </div>
                    <div className="bg-card p-3 rounded-lg border border-border text-center">
                      <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {selectedPartner.rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Rating Score</div>
                    </div>
                  </div>

                  {ratingsLoading ? (
                    <div className="text-center py-3 text-xs text-muted-foreground">Loading reviews...</div>
                  ) : partnerRatings && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Rating Breakdown</span>
                        <span className="text-muted-foreground">{partnerRatings.stats.total} total reviews</span>
                      </div>
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const count = partnerRatings.stats.breakdown[stars] || 0;
                          const pct = partnerRatings.stats.total > 0 ? (count / partnerRatings.stats.total) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-muted-foreground font-mono">{stars}★</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-5 text-right text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      {partnerRatings.reviews.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Reviews</p>
                          {partnerRatings.reviews.slice(0, 5).map((r: any) => (
                            <div key={r.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">{r.userName}</span>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((i: number) => (
                                    <Star key={i} className={cn('h-3 w-3', i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">#{r.bookingCode} · {new Date(r.createdAt).toLocaleDateString()}</p>
                              {r.review && <p className="text-xs text-foreground">{r.review}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal for Creating / Editing Partner */}
      <AnimatePresence>
        {partnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0 bg-muted/20">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {editingPartner ? 'Edit Tie-up Partner' : 'Add New Tie-up Partner'}
                </h2>
                <button
                  onClick={() => setPartnerModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lab Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Diagnostic Lab / Center Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Pathology & Diagnostic Lab"
                      value={formLabName}
                      onChange={e => setFormLabName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Contact Person / Owner Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Verma"
                      value={formContactName}
                      onChange={e => setFormContactName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Partner Category / Role */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Partner Category / Type
                    </label>
                    <select
                      value={formRole}
                      onChange={e => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    >
                      <option value="PARTNER_LAB">Diagnostic Partner Lab</option>
                      <option value="COLLECTION_CENTER">Sample Collection Center</option>
                      <option value="HOSPITAL_TIEUP">Hospital Pathology Tie-up</option>
                      <option value="CLINIC">Clinic / Nursing Home</option>
                    </select>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Mobile Number <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={formMobile}
                        onChange={e => setFormMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="lab@example.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {editingPartner ? 'New Password (leave blank to keep current)' : 'Account Password'} {!editingPartner && <span className="text-destructive">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={editingPartner ? '••••••••' : 'Enter strong password'}
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Partner Code */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Partner Code / Reference ID
                    </label>
                    <input
                      type="text"
                      placeholder="PART-001"
                      value={formPartnerCode}
                      onChange={e => setFormPartnerCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    />
                  </div>

                  {/* Commission Rate (%) Section */}
                  <div className="md:col-span-2 p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Referral Commission Rate & Payout
                      </label>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        {formCommissionRate}% Payout Rate
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Commission Rate (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="30"
                            value={formCommissionRate}
                            onChange={e => setFormCommissionRate(Number(e.target.value))}
                            className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                        </div>
                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {[15, 20, 25, 30, 40, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setFormCommissionRate(pct)}
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                formCommissionRate === pct
                                  ? "bg-emerald-600 text-white"
                                  : "bg-background border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 dark:text-emerald-300"
                              )}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Payment & Payout Cycle
                        </label>
                        <select
                          value={formPaymentCycle}
                          onChange={e => setFormPaymentCycle(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        >
                          <option value="MONTHLY">Monthly (End of Month)</option>
                          <option value="15_DAYS">Bi-Weekly (15 Days)</option>
                          <option value="WEEKLY">Weekly (Every Monday)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Approval Status
                    </label>
                    <select
                      value={formApprovalStatus}
                      onChange={e => setFormApprovalStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    >
                      <option value="APPROVED">Approved & Active</option>
                      <option value="PENDING">Pending Verification</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>

                  {/* Complete Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Complete Address / Center Location
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Shop/Building No, Landmark, Area, City, Pincode"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-border flex-shrink-0 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePartner}
                  disabled={savingPartner}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingPartner ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Partner...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> {editingPartner ? 'Update Partner' : 'Create Partner'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {isRejecting && selectedPartner && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[60] cursor-pointer"
              onClick={() => setIsRejecting(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-foreground text-lg">Reject Partner</h3>
                  <button onClick={() => setIsRejecting(false)} className="p-1.5 hover:bg-muted rounded-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Select a reason for rejecting <span className="font-bold text-foreground">{selectedPartner.user.name}</span>.
                  This will be sent to the partner.
                </p>

                <div className="space-y-2 mb-4">
                  {REJECTION_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRejectionReason(r)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        rejectionReason === r
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                          : 'bg-card border-border hover:border-rose-200'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    onClick={() => setRejectionReason('Other')}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                      rejectionReason === 'Other'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-card border-border hover:border-rose-200'
                    )}
                  >
                    Other (custom reason)
                  </button>
                </div>

                {rejectionReason === 'Other' && (
                  <textarea
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 mb-4 resize-none"
                    rows={3}
                    placeholder="Enter custom rejection reason..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-bold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isUpdating || !rejectionReason}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};