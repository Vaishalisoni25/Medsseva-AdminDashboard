import React, { useState, useEffect } from 'react';
import { usePartnersQuery } from '@/hooks/useAdminQueries';
import { testService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, CheckCircle2, XCircle, AlertCircle,
  Microscope, Phone, Mail, MapPin, Star, Clock,
  ShieldCheck, ShieldX, ShieldAlert, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface Partner {
  id: string;
  labName: string;
  role: string;
  address?: string;
  rating: number;
  totalCollections: number;
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

export const PathologyPartnersPage: React.FC = () => {
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

const { data: partnersData, isLoading: partnersQueryLoading } = usePartnersQuery();
  const isLoading = partnersQueryLoading && partners.length === 0;

  useEffect(() => {
    if (partnersData) setPartners(partnersData);
  }, [partnersData]);

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

  const filtered = partners.filter(p => {
    const matchesSearch =
      p.user.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.mobile.includes(search) ||
      p.labName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    ALL: partners.length,
    PENDING: partners.filter(p => p.approvalStatus === 'PENDING').length,
    APPROVED: partners.filter(p => p.approvalStatus === 'APPROVED').length,
    REJECTED: partners.filter(p => p.approvalStatus === 'REJECTED').length,
    SUSPENDED: partners.filter(p => p.approvalStatus === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pathology Partners</h1>
          <p className="text-sm text-muted-foreground">Manage partner registrations, approvals, and status.</p>
        </div>
     <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
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
                <th className="px-6 py-4 font-bold">Registered</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
           {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse border-b border-border">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-muted rounded w-28" />
                            <div className="h-2.5 bg-muted rounded w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 bg-muted rounded w-32 mb-1.5" />
                        <div className="h-2.5 bg-muted rounded w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 bg-muted rounded w-28 mb-1.5" />
                        <div className="h-3 bg-muted rounded w-36" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3.5 bg-muted rounded w-12 mb-1.5" />
                        <div className="h-2.5 bg-muted rounded w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted rounded-full w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 bg-muted rounded w-20" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="h-7 w-7 bg-muted rounded-full" />
                          <div className="h-7 w-7 bg-muted rounded-full" />
                        </div>
                      </td>
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
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(partner.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-card">
                <div>
                  <div className="text-xs font-bold text-primary tracking-widest uppercase">Partner Details</div>
                  <h2 className="text-xl font-bold text-foreground">{selectedPartner.user.name}</h2>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Status */}
                <div className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold',
                  STATUS_CONFIG[selectedPartner.approvalStatus].bg,
                  STATUS_CONFIG[selectedPartner.approvalStatus].text,
                  STATUS_CONFIG[selectedPartner.approvalStatus].border,
                )}>
                  {React.createElement(STATUS_CONFIG[selectedPartner.approvalStatus].icon, { className: 'h-4 w-4' })}
                  {STATUS_CONFIG[selectedPartner.approvalStatus].label}
                  {selectedPartner.rejectionReason && (
                    <span className="ml-2 font-normal text-xs">- {selectedPartner.rejectionReason}</span>
                  )}
                </div>

               
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Personal Info</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPartner.user.mobile}</span>
                  </div>
                  {selectedPartner.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedPartner.user.email}</span>
                    </div>
                  )}
                  {selectedPartner.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedPartner.address}</span>
                    </div>
                  )}
                </div>

                {/* Lab */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Lab Details</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Microscope className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{selectedPartner.labName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Role: {selectedPartner.role}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{selectedPartner.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">· {selectedPartner.totalCollections} collections</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      selectedPartner.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                    )}>
                      {selectedPartner.isAvailable ? '● Available' : '○ Unavailable'}
                    </span>
                  </div>
                </div>

               {/* Ratings */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Ratings & Reviews</h3>
                  {ratingsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : !partnerRatings || partnerRatings.totalRatings === 0 ? (
                    <p className="text-sm text-muted-foreground">No ratings yet.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-foreground">{partnerRatings.averageRating.toFixed(1)}</span>
                        <div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((i: number) => (
                              <Star key={i} className={cn('h-4 w-4', i <= Math.round(partnerRatings.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{partnerRatings.totalRatings} ratings</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {[5,4,3,2,1].map((star: number) => {
                          const count = partnerRatings.breakdown[star] || 0;
                          const pct = partnerRatings.totalRatings > 0 ? (count / partnerRatings.totalRatings) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-muted-foreground font-bold">{star}</span>
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-4 text-right text-muted-foreground">{count}</span>
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

                {/* Actions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartner.approvalStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedPartner)}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => setIsRejecting(true)}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}
                    {selectedPartner.approvalStatus === 'APPROVED' && (
                      <button
                        onClick={() => handleSuspend(selectedPartner)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ShieldAlert className="h-4 w-4" /> Suspend Partner
                      </button>
                    )}
                    {(selectedPartner.approvalStatus === 'SUSPENDED' || selectedPartner.approvalStatus === 'REJECTED') && (
                      <button
                        onClick={() => handleActivate(selectedPartner)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" /> Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
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