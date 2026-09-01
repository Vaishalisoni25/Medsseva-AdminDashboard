import React, { useState, useEffect, useMemo } from 'react';
import { useBranchesQuery, useBookingsQuery, useSettlementsQuery } from '@/hooks/useAdminQueries';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} from '../redux/slices/branchSlice';
import { fetchBookings } from '../redux/slices/bookingSlice';
import { financeService } from '../services/api';
import { Branch, BranchFormData } from '../services/branch.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Calendar,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  CreditCard,
  Send,
  Loader2,
  Store,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../components/Toast';

const DEFAULT_COMMISSION_PRESETS = [15, 20, 25, 30, 35, 40, 50];

const emptyFranchiseForm: BranchFormData & { commissionRate?: number } = {
  name: '',
  code: '',
  line1: '',
  city: '',
  state: 'Maharashtra',
  pincode: '',
  contactNumber: '',
  email: '',
  workingHours: '07:00 AM - 09:00 PM',
  availableSlots: [],
  homeCollection: true,
  labVisit: true,
  isActive: true,
  commissionRate: 25,
};

export const FranchisesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { success, error: toastError } = useToast();

  // Redux & Queries
  const { branches, loading: branchesLoading } = useAppSelector((state: any) => state.branches || { branches: [], loading: false });
  const { bookings, loading: bookingsLoading } = useAppSelector((state: any) => state.bookings || { bookings: [], loading: false });

  useBranchesQuery();
  useBookingsQuery();
  useSettlementsQuery();

  // Tab State
  const [activeTab, setActiveTab] = useState<'pipeline' | 'directory' | 'settlements'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState('ALL');

  // Settlements State
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [processingSettlementId, setProcessingSettlementId] = useState<string | null>(null);

  // Modals State
  const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Branch | null>(null);
  const [franchiseForm, setFranchiseForm] = useState(emptyFranchiseForm);
  const [isSubmittingFranchise, setIsSubmittingFranchise] = useState(false);

  // Settlement Generator Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementFranchiseId, setSettlementFranchiseId] = useState('');
  const [settlementPeriodStart, setSettlementPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [settlementPeriodEnd, setSettlementPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [settlementCommissionRate, setSettlementCommissionRate] = useState(25);
  const [isGeneratingSettlement, setIsGeneratingSettlement] = useState(false);

  // Fetch Settlements
  const loadSettlements = async () => {
    try {
      setLoadingSettlements(true);
      const data = await financeService.getSettlements();
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoadingSettlements(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  // Compute Cities
  const cities = useMemo(() => {
    const cSet = new Set<string>();
    (branches || []).forEach((b: Branch) => {
      if (b.city) cSet.add(b.city);
    });
    return Array.from(cSet);
  }, [branches]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalFranchises = branches?.length || 0;
    const activeFranchises = (branches || []).filter((b: Branch) => b.isActive).length;
    
    // Booking pipeline for franchises
    const franchiseBookings = (bookings || []).filter((b: any) => b.branchId || b.franchiseId);
    const totalRevenue = franchiseBookings.reduce((sum: number, b: any) => sum + (Number(b.totalPaid) || Number(b.totalAmount) || 0), 0);
    
    // Active / Live in-progress samples
    const activeSamples = franchiseBookings.filter((b: any) => 
      ['CONFIRMED', 'SAMPLE_COLLECTED', 'IN_TRANSIT', 'PROCESSING'].includes(b.status)
    ).length;

    // Unpaid Commission
    const pendingSettlementsSum = (settlements || [])
      .filter((s: any) => s.status === 'PENDING')
      .reduce((sum: number, s: any) => sum + (Number(s.netPayable) || Number(s.commissionAmount) || 0), 0);

    return {
      totalFranchises,
      activeFranchises,
      totalFranchiseBookings: franchiseBookings.length,
      activeSamples,
      totalRevenue,
      pendingSettlementsSum,
    };
  }, [branches, bookings, settlements]);

  // Filtered Bookings for Pipeline
  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((b: any) => {
      if (selectedFranchiseFilter !== 'ALL' && b.branchId !== selectedFranchiseFilter && b.franchiseId !== selectedFranchiseFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && b.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (b.patientName || b.patient?.name || '').toLowerCase();
        const pPhone = (b.patientPhone || b.patient?.phone || '').toLowerCase();
        const bId = (b.id || b.tokenNumber || '').toLowerCase();
        const testNames = (b.tests || []).map((t: any) => t.test?.name || t.name || '').join(' ').toLowerCase();
        return pName.includes(q) || pPhone.includes(q) || bId.includes(q) || testNames.includes(q);
      }
      return true;
    });
  }, [bookings, selectedFranchiseFilter, selectedStatusFilter, searchQuery]);

  // Filtered Franchises for Directory
  const filteredFranchises = useMemo(() => {
    return (branches || []).filter((b: Branch) => {
      if (selectedCity !== 'ALL' && b.city !== selectedCity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          (b.contactNumber && b.contactNumber.includes(q)) ||
          (b.email && b.email.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [branches, selectedCity, searchQuery]);

  // Handlers for Franchise CRUD
  const handleOpenCreateFranchise = () => {
    setEditingFranchise(null);
    setFranchiseForm({
      ...emptyFranchiseForm,
      code: `FR-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsFranchiseModalOpen(true);
  };

  const handleOpenEditFranchise = (b: Branch) => {
    setEditingFranchise(b);
    setFranchiseForm({
      name: b.name,
      code: b.code,
      line1: b.line1,
      city: b.city,
      state: b.state,
      pincode: b.pincode,
      contactNumber: b.contactNumber || '',
      email: b.email || '',
      workingHours: b.workingHours || '07:00 AM - 09:00 PM',
      availableSlots: b.availableSlots || [],
      homeCollection: b.homeCollection ?? true,
      labVisit: b.labVisit ?? true,
      isActive: b.isActive ?? true,
      commissionRate: 25,
    });
    setIsFranchiseModalOpen(true);
  };

  const handleSaveFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseForm.name.trim() || !franchiseForm.code.trim()) {
      toastError('Please fill in Franchise Name and Code.');
      return;
    }

    try {
      setIsSubmittingFranchise(true);
      if (editingFranchise) {
        await dispatch(updateBranch({ id: editingFranchise.id, data: franchiseForm })).unwrap();
        success('Franchise partner updated successfully.');
      } else {
        await dispatch(createBranch(franchiseForm)).unwrap();
        success('New Franchise partner onboarded successfully.');
      }
      setIsFranchiseModalOpen(false);
      dispatch(fetchBranches());
    } catch (err: any) {
      toastError(err?.message || 'Failed to save franchise.');
    } finally {
      setIsSubmittingFranchise(false);
    }
  };

  const handleDeleteFranchise = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete Franchise "${name}"? This action cannot be undone.`)) return;
    try {
      await dispatch(deleteBranch(id)).unwrap();
      success(`Franchise "${name}" deleted.`);
      dispatch(fetchBranches());
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete franchise.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await dispatch(toggleBranchStatus({ id, isActive: !currentStatus })).unwrap();
      success(`Franchise marked as ${!currentStatus ? 'Active' : 'Inactive'}.`);
      dispatch(fetchBranches());
    } catch (err: any) {
      toastError(err?.message || 'Failed to toggle franchise status.');
    }
  };

  // Generate Settlement
  const handleOpenSettlementModal = (franchise?: Branch) => {
    if (franchise) {
      setSettlementFranchiseId(franchise.id);
    } else if (branches && branches.length > 0) {
      setSettlementFranchiseId(branches[0].id);
    }
    setIsSettlementModalOpen(true);
  };

  const handleGenerateSettlementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFranchise = branches.find((b: Branch) => b.id === settlementFranchiseId);
    if (!targetFranchise) {
      toastError('Please select a valid franchise partner.');
      return;
    }

    try {
      setIsGeneratingSettlement(true);
      await financeService.generateSettlement({
        franchiseId: targetFranchise.id,
        franchiseName: targetFranchise.name,
        periodStart: settlementPeriodStart,
        periodEnd: settlementPeriodEnd,
        commissionRate: settlementCommissionRate,
      });
      success(`Commission settlement batch generated for ${targetFranchise.name}.`);
      setIsSettlementModalOpen(false);
      loadSettlements();
    } catch (err: any) {
      toastError(err?.response?.data?.error || 'Failed to generate settlement batch.');
    } finally {
      setIsGeneratingSettlement(false);
    }
  };

  // Process Payout
  const handleProcessPayout = async (settlementId: string) => {
    if (!window.confirm('Confirm payout release for this settlement? This will mark the commission as PAID.')) return;
    try {
      setProcessingSettlementId(settlementId);
      await financeService.processSettlement(settlementId);
      success('Commission payout processed and marked as PAID.');
      loadSettlements();
    } catch (err: any) {
      toastError(err?.response?.data?.error || 'Failed to process payout.');
    } finally {
      setProcessingSettlementId(null);
    }
  };

  // Helper for sample stage
  const getStageBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Booking Placed', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'CONFIRMED':
        return { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'SAMPLE_COLLECTED':
        return { label: 'Sample Collected', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'IN_TRANSIT':
        return { label: 'In Transit to Lab', bg: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' };
      case 'PROCESSING':
        return { label: 'Analyzing in LIMS', bg: 'bg-teal-50 text-teal-700 border-teal-200 animate-pulse' };
      case 'COMPLETED':
        return { label: 'Report Dispatched', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <Network className="h-6 w-6 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Franchise Network & Live Tracking
              </h1>
              <p className="text-xs text-teal-200/90 font-medium">
                End-to-end monitoring of franchise collection hubs, sample logistics, patient booking pipelines, and automated commission reconciliations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenSettlementModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 backdrop-blur-sm transition-all shadow-sm"
          >
            <DollarSign className="h-4 w-4 text-teal-300" /> Generate Settlement
          </button>
          <button
            onClick={handleOpenCreateFranchise}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" /> Onboard Franchise
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Franchise Units</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{metrics.totalFranchises}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {metrics.activeFranchises} Operational / Active
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center border border-teal-200/50">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Sample Flow</p>
            <h3 className="text-2xl font-black text-foreground mt-1">{metrics.activeSamples}</h3>
            <p className="text-[11px] font-semibold text-purple-600 mt-1 flex items-center gap-1">
              <Truck className="h-3 w-3" /> In Transit & Processing
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center border border-purple-200/50">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Network GMV</p>
            <h3 className="text-2xl font-black text-foreground mt-1">₹{metrics.totalRevenue.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-semibold text-blue-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Across {metrics.totalFranchiseBookings} Orders
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center border border-blue-200/50">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Payouts</p>
            <h3 className="text-2xl font-black text-foreground mt-1">₹{metrics.pendingSettlementsSum.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Awaiting Clearance
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center border border-amber-200/50">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* TABS CONTROLLER */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-border bg-muted/20 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={cn(
              "px-5 py-3 text-xs font-black border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 shrink-0",
              activeTab === 'pipeline'
                ? "border-teal-600 text-teal-600 bg-background rounded-t-xl"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Truck className="h-4 w-4" /> 1. Live Sample & Booking Pipeline
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={cn(
              "px-5 py-3 text-xs font-black border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 shrink-0",
              activeTab === 'directory'
                ? "border-teal-600 text-teal-600 bg-background rounded-t-xl"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" /> 2. Franchise Network Directory ({branches?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={cn(
              "px-5 py-3 text-xs font-black border-b-2 tracking-wider uppercase transition-all flex items-center gap-2 shrink-0",
              activeTab === 'settlements'
                ? "border-teal-600 text-teal-600 bg-background rounded-t-xl"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="h-4 w-4" /> 3. Commission Settlements & Payouts ({settlements?.length || 0})
          </button>
        </div>

        {/* CONTROLS / FILTER BAR */}
        <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'pipeline'
                    ? "Search patient, phone, booking ref, test..."
                    : activeTab === 'directory'
                    ? "Search franchise name, code, pincode, owner..."
                    : "Search settlement batch, franchise..."
                }
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {activeTab === 'pipeline' && (
              <>
                <select
                  value={selectedFranchiseFilter}
                  onChange={e => setSelectedFranchiseFilter(e.target.value)}
                  className="px-3 py-2 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Franchise Hubs</option>
                  {(branches || []).map((b: Branch) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PENDING">Booking Placed</option>
                  <option value="SAMPLE_COLLECTED">Sample Collected</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="PROCESSING">In LIMS Processing</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </>
            )}

            {activeTab === 'directory' && (
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="px-3 py-2 bg-muted/30 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="ALL">All Cities ({cities.length})</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                dispatch(fetchBranches());
                dispatch(fetchBookings());
                loadSettlements();
              }}
              className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE SAMPLE PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Booking / Token</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Test Package / Investigation</th>
                  <th className="px-6 py-3.5">Franchise Unit</th>
                  <th className="px-6 py-3.5">Sample Stage</th>
                  <th className="px-6 py-3.5 text-right">Billed Amount</th>
                  <th className="px-6 py-3.5 text-right">Franchise Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                      Loading live pipeline telemetry...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No active bookings or samples matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b: any) => {
                    const stage = getStageBadge(b.status);
                    const billed = Number(b.totalPaid) || Number(b.totalAmount) || 0;
                    const franchiseShare = Math.round(billed * 0.25); // standard 25% preview
                    const franchiseName = (branches || []).find((br: Branch) => br.id === b.branchId || br.id === b.franchiseId)?.name || b.branch?.name || 'Authorized Franchise Hub';

                    return (
                      <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-foreground">#{b.tokenNumber || b.id.slice(0, 8)}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '-'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{b.patientName || b.patient?.name || 'Patient'}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {b.patientPhone || b.patient?.phone || '-'} • {b.patientAge || b.patient?.age || '-'}Y ({b.patientGender || b.patient?.gender || 'N/A'})
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground truncate max-w-xs">
                            {(b.tests || []).map((t: any) => t.test?.name || t.name).join(', ') || 'Routine Diagnostic Panel'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Type: {b.type === 'HOME_COLLECTION' ? '🏠 Home Phlebotomy' : '🏢 Walk-in Center'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-teal-600" />
                            {franchiseName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {b.city || 'Central Region'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-1", stage.bg)}>
                            {stage.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="font-extrabold text-foreground font-mono">₹{billed.toLocaleString('en-IN')}</div>
                          <div className="text-[9px] text-emerald-600 font-bold uppercase">{b.paymentStatus || 'PAID'}</div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="font-extrabold text-teal-700 dark:text-teal-400 font-mono">₹{franchiseShare.toLocaleString('en-IN')}</div>
                          <div className="text-[9px] text-muted-foreground font-bold">(~25% margin)</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: FRANCHISE DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFranchises.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  No franchise centers found matching filters.
                </div>
              ) : (
                filteredFranchises.map((f: Branch) => (
                  <div
                    key={f.id}
                    className="bg-card border border-border hover:border-teal-500/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-extrabold rounded border border-teal-200 dark:border-teal-800">
                              {f.code}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                              f.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {f.isActive ? 'Active Hub' : 'Inactive'}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-foreground mt-1.5 leading-snug">{f.name}</h4>
                        </div>
                        <button
                          onClick={() => handleToggleStatus(f.id, f.isActive)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg border font-bold transition-all shrink-0",
                            f.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          )}
                          title="Toggle Active Status"
                        >
                          {f.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      {/* Location & Details */}
                      <div className="space-y-2 text-xs text-muted-foreground mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{f.line1}, {f.city}, {f.state} - {f.pincode}</span>
                        </div>
                        {f.contactNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <a href={`tel:${f.contactNumber}`} className="font-mono hover:text-teal-600 font-bold">{f.contactNumber}</a>
                          </div>
                        )}
                        {f.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{f.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{f.workingHours || '07:00 AM - 09:00 PM'}</span>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                        {f.homeCollection && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded text-[9px] font-extrabold border border-blue-200 dark:border-blue-800">
                            ✓ Home Phlebotomy
                          </span>
                        )}
                        {f.labVisit && (
                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded text-[9px] font-extrabold border border-purple-200 dark:border-purple-800">
                            ✓ Walk-in Collection
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded text-[9px] font-extrabold border border-amber-200 dark:border-amber-800">
                          25% Commission Split
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border">
                      <button
                        onClick={() => handleOpenSettlementModal(f)}
                        className="flex-1 py-1.5 px-3 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 border border-teal-200 dark:border-teal-800"
                      >
                        <DollarSign className="h-3.5 w-3.5" /> Settle Dues
                      </button>
                      <button
                        onClick={() => handleOpenEditFranchise(f)}
                        className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Franchise"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFranchise(f.id, f.name)}
                        className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Delete Franchise"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COMMISSION SETTLEMENTS & PAYOUTS */}
        {activeTab === 'settlements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Settlement Ref</th>
                  <th className="px-6 py-3.5">Franchise Partner</th>
                  <th className="px-6 py-3.5">Billing Period</th>
                  <th className="px-6 py-3.5 text-right">Gross GMV</th>
                  <th className="px-6 py-3.5 text-right">Commission Rate</th>
                  <th className="px-6 py-3.5 text-right">Net Payable</th>
                  <th className="px-6 py-3.5 text-center">Payout Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium">
                {loadingSettlements ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                      Fetching settlement ledger...
                    </td>
                  </tr>
                ) : settlements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No commission settlements generated yet. Click "Generate Settlement" above to calculate batches.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {s.settlementRef || `SET-${s.id.slice(0, 8).toUpperCase()}`}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{s.franchiseName || 'Franchise Partner'}</div>
                        <div className="text-[10px] text-muted-foreground">{s.franchiseId || '-'}</div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground font-mono text-[11px]">
                        {s.period || `${new Date(s.periodStart).toLocaleDateString('en-IN')} - ${new Date(s.periodEnd).toLocaleDateString('en-IN')}`}
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                        ₹{(Number(s.totalBusiness) || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold text-teal-700">
                        {s.commissionRate || 25}%
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-extrabold text-foreground text-sm">
                        ₹{(Number(s.netPayable) || Number(s.commissionAmount) || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-1",
                          s.status === 'PROCESSED'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.status === 'APPROVED'
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                        )}>
                          {s.status === 'PROCESSED' ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {s.status || 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {s.status === 'PENDING' || s.status === 'APPROVED' ? (
                          <button
                            onClick={() => handleProcessPayout(s.id)}
                            disabled={processingSettlementId === s.id}
                            className="px-3 py-1.5 bg-[#006D6F] hover:bg-[#004B4D] text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1 ml-auto disabled:opacity-50"
                          >
                            {processingSettlementId === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Release Payout
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 font-mono">
                            Paid (Ref: {s.payoutRef?.slice(0, 12) || 'OK'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ONBOARD / EDIT FRANCHISE PARTNER */}
      <AnimatePresence>
        {isFranchiseModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFranchiseModalOpen(false)}
              className="fixed inset-0 bg-slate-950 z-[90] cursor-pointer backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto h-max max-w-xl w-full bg-background rounded-3xl border border-border z-[100] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-[#006D6F] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal-200" />
                  <h3 className="text-base font-black tracking-tight">
                    {editingFranchise ? 'Edit Franchise Partner' : 'Onboard New Franchise Partner'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFranchiseModalOpen(false)}
                  className="hover:bg-white/10 p-1 rounded-lg text-teal-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFranchise} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Franchise Name *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={franchiseForm.name}
                      onChange={e => setFranchiseForm({ ...franchiseForm, name: e.target.value })}
                      placeholder="e.g. MedsSeva Collection Center Indore"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Franchise Code *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 border border-border rounded-xl text-xs font-mono bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={franchiseForm.code}
                      onChange={e => setFranchiseForm({ ...franchiseForm, code: e.target.value })}
                      placeholder="e.g. FR-IND-01"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">Address Line 1 *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-border rounded-xl text-xs bg-card focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={franchiseForm.line1}
                    onChange={e => setFranchiseForm({ ...franchiseForm, line1: e.target.value })}
                    placeholder="Shop/Unit No, Landmark, Street"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">City *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card"
                      value={franchiseForm.city}
                      onChange={e => setFranchiseForm({ ...franchiseForm, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">State *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card"
                      value={franchiseForm.state}
                      onChange={e => setFranchiseForm({ ...franchiseForm, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Pincode *</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 border border-border rounded-xl text-xs font-mono bg-card"
                      value={franchiseForm.pincode}
                      onChange={e => setFranchiseForm({ ...franchiseForm, pincode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Contact Phone *</label>
                    <input
                      required
                      type="tel"
                      className="w-full p-2.5 border border-border rounded-xl text-xs font-mono bg-card"
                      value={franchiseForm.contactNumber}
                      onChange={e => setFranchiseForm({ ...franchiseForm, contactNumber: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Email Address</label>
                    <input
                      type="email"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card"
                      value={franchiseForm.email}
                      onChange={e => setFranchiseForm({ ...franchiseForm, email: e.target.value })}
                      placeholder="franchise@medsseva.com"
                    />
                  </div>
                </div>

                {/* Commission Preset */}
                <div className="space-y-1.5 p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-2xl">
                  <label className="text-xs font-black text-teal-900 dark:text-teal-200 flex items-center justify-between">
                    <span>Default Commission Split Rate (%)</span>
                    <span className="text-teal-600 font-bold">{franchiseForm.commissionRate || 25}%</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {DEFAULT_COMMISSION_PRESETS.map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setFranchiseForm({ ...franchiseForm, commissionRate: rate })}
                        className={cn(
                          "px-3 py-1 text-xs font-black rounded-lg border transition-all",
                          (franchiseForm.commissionRate || 25) === rate
                            ? "bg-[#006D6F] text-white border-transparent"
                            : "bg-card text-foreground hover:bg-muted border-border"
                        )}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capabilities Checkboxes */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/20">
                    <input
                      type="checkbox"
                      checked={franchiseForm.homeCollection}
                      onChange={e => setFranchiseForm({ ...franchiseForm, homeCollection: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-foreground">Home Sample Collection</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/20">
                    <input
                      type="checkbox"
                      checked={franchiseForm.labVisit}
                      onChange={e => setFranchiseForm({ ...franchiseForm, labVisit: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-foreground">Walk-in Lab Visit</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsFranchiseModalOpen(false)}
                    className="px-4 py-2 text-xs border border-border font-bold rounded-xl hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFranchise}
                    className="px-6 py-2 text-xs bg-[#006D6F] hover:bg-[#004B4D] text-white font-black rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    {isSubmittingFranchise ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {editingFranchise ? 'Update Franchise' : 'Confirm & Onboard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: GENERATE SETTLEMENT BATCH */}
      <AnimatePresence>
        {isSettlementModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettlementModalOpen(false)}
              className="fixed inset-0 bg-slate-950 z-[90] cursor-pointer backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto h-max max-w-md w-full bg-background rounded-3xl border border-border z-[100] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-[#006D6F] text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-teal-200" />
                  <h3 className="text-base font-black tracking-tight">Generate Settlement Batch</h3>
                </div>
                <button
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="hover:bg-white/10 p-1 rounded-lg text-teal-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateSettlementSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">Select Franchise Partner *</label>
                  <select
                    required
                    value={settlementFranchiseId}
                    onChange={e => setSettlementFranchiseId(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-xs bg-card font-bold"
                  >
                    <option value="">-- Choose Franchise Hub --</option>
                    {(branches || []).map((b: Branch) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code} - {b.city})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Period Start Date *</label>
                    <input
                      required
                      type="date"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card"
                      value={settlementPeriodStart}
                      onChange={e => setSettlementPeriodStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground">Period End Date *</label>
                    <input
                      required
                      type="date"
                      className="w-full p-2.5 border border-border rounded-xl text-xs bg-card"
                      value={settlementPeriodEnd}
                      onChange={e => setSettlementPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-foreground">Agreed Commission Rate (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settlementCommissionRate}
                    onChange={e => setSettlementCommissionRate(parseFloat(e.target.value) || 25)}
                    className="w-full p-2.5 border border-border rounded-xl text-xs font-mono font-bold bg-card"
                  />
                </div>

                <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Tax on Commission (GST 18%):</span>
                    <span className="font-bold">Calculated automatically</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
                    <span>Ledger Action:</span>
                    <span>Audit Trail Recorded</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(false)}
                    className="px-4 py-2 text-xs border border-border font-bold rounded-xl hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingSettlement}
                    className="px-6 py-2 text-xs bg-[#006D6F] hover:bg-[#004B4D] text-white font-black rounded-xl flex items-center gap-1.5 shadow disabled:opacity-50"
                  >
                    {isGeneratingSettlement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Calculate & Settle
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};