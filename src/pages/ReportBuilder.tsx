import React, { useState, useCallback, useMemo,useEffect } from 'react';
import { useReportsQuery, useBookingsForReportQuery } from '@/hooks/useAdminQueries';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import {
  fetchBookingsForReport,
  createReportThunk,
  updateReportDraftThunk,
  fetchAllReports,
} from '../redux/slices/reportSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  FileText,
  Search,
  X,
  Save,
  Plus,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  Building2,
  UserCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { branchService, Branch } from '../services/branch.service';
import { useToast } from '../components/Toast';

type Flag = 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW' | 'PENDING';
type ResultType = 'NUMERIC' | 'TEXT' | 'POS_NEG' | 'YES_NO';

type RangeEntry = {
  gender: 'MALE' | 'FEMALE' | 'ANY';
  minAge: number;
  maxAge: number;
  minRange: number;
  maxRange: number;
};

type ParameterEntry = {
  parameterId: string;
  parameterName: string;
  category: string;
  value: string;
  unit: string;
  referenceRanges: RangeEntry[];
  referenceRange: string;
  resultType: ResultType;
  flag: Flag;
  isAbnormal: boolean;
  criticalLow: string;
  criticalHigh: string;
  interpretation: string;
  description: string;
  displayOrder: number;
};

type TestGroup = {
  testId: string;
  testName: string;
  parameters: ParameterEntry[];
};

type Notes = {
  clinicalNotes: string;
  technicianRemarks: string;
  doctorRemarks: string;
  internalNotes: string;
};

type VerificationDetails = {
  reportBranchId: string;
  doctorName: string;
  doctorQualification: string;
  doctorRegNo: string;
  doctorDesignation: string;
  doctorVerifiedAt: string;
};

const computeFlag = (value: string, param: ParameterEntry): Flag => {
  if (!value || value.trim() === '') return 'PENDING';

  if (param.resultType === 'TEXT') {
    if (!param.interpretation) return 'NORMAL';
    const expected = param.interpretation.trim().toLowerCase();
    const actual = value.trim().toLowerCase();
    return actual === expected ? 'NORMAL' : 'HIGH';
  }

  if (param.resultType === 'POS_NEG') {
    const v = value.trim().toLowerCase();
    return v === 'positive' || v === 'reactive' ? 'HIGH' : 'NORMAL';
  }

  const num = parseFloat(value);
  if (isNaN(num)) return 'PENDING';
  if (param.referenceRanges.length === 0) return 'NORMAL';
  const r = param.referenceRanges[0];
  const critLow = parseFloat(param.criticalLow);
  const critHigh = parseFloat(param.criticalHigh);
  if (!isNaN(critLow) && num < critLow) return 'CRITICAL_LOW';
  if (!isNaN(critHigh) && num > critHigh) return 'CRITICAL_HIGH';
  if (num < r.minRange) return 'LOW';
  if (num > r.maxRange) return 'HIGH';
  return 'NORMAL';
};
const buildRangeString = (ranges: RangeEntry[]): string => {
  if (!ranges || ranges.length === 0) return '';
  const r = ranges[0];
  return `${r.minRange} - ${r.maxRange}`;
};

const parseDbReferenceRanges = (raw: any, gender?: string, age?: number): RangeEntry[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  const g = (gender || '').toUpperCase();
  const resolvedGender: 'MALE' | 'FEMALE' | 'ANY' =
    g === 'MALE' ? 'MALE' : g === 'FEMALE' ? 'FEMALE' : 'ANY';

  const priorityKeys = [
    resolvedGender === 'MALE' ? 'male' : resolvedGender === 'FEMALE' ? 'female' : null,
    'general',
    'normal',
  ].filter(Boolean) as string[];

  const entries: RangeEntry[] = [];

  for (const key of Object.keys(raw)) {
    const val = raw[key];
    if (val && typeof val === 'object' && !('text' in val)) {
      const min = val.min ?? 0;
      const max = val.max ?? 0;
      const entryGender: 'MALE' | 'FEMALE' | 'ANY' =
        key === 'male' ? 'MALE' : key === 'female' ? 'FEMALE' : 'ANY';
      entries.push({ gender: entryGender, minAge: 0, maxAge: 120, minRange: min, maxRange: max });
    }
  }

  if (entries.length === 0) return [];

  const preferred = priorityKeys.find(k => raw[k] && typeof raw[k] === 'object' && !('text' in raw[k]));
  if (preferred) {
    const val = raw[preferred];
    const entryGender: 'MALE' | 'FEMALE' | 'ANY' =
      preferred === 'male' ? 'MALE' : preferred === 'female' ? 'FEMALE' : 'ANY';
    return [{ gender: entryGender, minAge: 0, maxAge: 120, minRange: val.min ?? 0, maxRange: val.max ?? 0 }, ...entries.filter(e => e.gender !== entryGender)];
  }

  return entries;
};

const getTextExpectation = (raw: any): string | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  for (const val of Object.values(raw)) {
    if (val && typeof val === 'object' && 'text' in (val as any)) {
      return (val as any).text as string;
    }
  }
  return null;
};

const buildTestGroups = (booking: any): TestGroup[] => {
  const groups: TestGroup[] = [];
  let order = 0;

const processTest = (test: any) => {
    if (!test) return;
    const parameters: ParameterEntry[] = (test.parameters || []).map((p: any) => {
      const textExpectation = getTextExpectation(p.referenceRanges);
      const ranges: RangeEntry[] = parseDbReferenceRanges(
        p.referenceRanges,
        booking.patientGender,
        booking.patientAge
      );
      const isTextType = textExpectation !== null;
      const isPosNeg = isTextType && /reactive|positive|negative/i.test(textExpectation);
      const resultType: ResultType = isPosNeg ? 'POS_NEG' : isTextType ? 'TEXT' : 'NUMERIC';
      return {
        parameterId: p.id,
        parameterName: p.name,
        category: '',
        value: '',
        unit: p.unit || '',
        referenceRanges: ranges,
        referenceRange: isTextType ? (textExpectation || '') : buildRangeString(ranges),
        resultType,
        flag: 'PENDING' as Flag,
        isAbnormal: false,
        criticalLow: '',
        criticalHigh: '',
        interpretation: textExpectation || '',
        description: '',
        displayOrder: order++,
      };
    });
    if (parameters.length > 0) {
      groups.push({ testId: test.id, testName: test.name, parameters });
    }
  };

  (booking.tests || []).forEach((bt: any) => processTest(bt.test));
  (booking.packages || []).forEach((bp: any) => {
    (bp.package?.testsIncluded || []).forEach((pt: any) => processTest(pt.test));
  });

  return groups;
};

const FLAG_CONFIG: Record<Flag, { label: string; className: string }> = {
  NORMAL: { label: 'Normal', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  HIGH: { label: 'High ↑', className: 'text-amber-600 bg-amber-50 border-amber-200' },
  LOW: { label: 'Low ↓', className: 'text-blue-600 bg-blue-50 border-blue-200' },
  CRITICAL_HIGH: { label: 'Critical ↑↑', className: 'text-red-600 bg-red-50 border-red-200' },
  CRITICAL_LOW: { label: 'Critical ↓↓', className: 'text-red-600 bg-red-50 border-red-200' },
  PENDING: { label: 'Pending', className: 'text-muted-foreground bg-muted border-border' },
};

const emptyParam = (order: number): ParameterEntry => ({
  parameterId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  parameterName: '',
  category: '',
  value: '',
  unit: '',
  referenceRanges: [{ gender: 'ANY', minAge: 0, maxAge: 120, minRange: 0, maxRange: 0 }],
  referenceRange: '',
  resultType: 'NUMERIC',
  flag: 'PENDING',
  isAbnormal: false,
  criticalLow: '',
  criticalHigh: '',
  interpretation: '',
  description: '',
  displayOrder: order,
});

const toLocalDatetimeValue = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyVerification = (): VerificationDetails => ({
  reportBranchId: '',
  doctorName: '',
  doctorQualification: '',
  doctorRegNo: '',
  doctorDesignation: '',
  doctorVerifiedAt: new Date().toISOString(),
});

export const ReportBuilderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bookingsForReport = [], bookingsLoading, reports = [] } = useAppSelector(s => s.reports);
const toast = useToast();
 const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const preselectedBookingId = new URLSearchParams(window.location.search).get('bookingId');

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [notes, setNotes] = useState<Notes>({ clinicalNotes: '', technicianRemarks: '', doctorRemarks: '', internalNotes: '' });
  const [verification, setVerification] = useState<VerificationDetails>(emptyVerification());
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingParam, setEditingParam] = useState<{ groupIdx: number; paramIdx: number } | null>(null);

useReportsQuery();
  useBookingsForReportQuery();

  useEffect(() => {
    branchService.getAll().then(res => {
      if (res?.data) setBranches(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!preselectedBookingId || bookingsForReport.length === 0) return;
    const target = bookingsForReport.find((b: any) => b.id === preselectedBookingId);
    if (target && !selectedBooking) {
      handleSelectBooking(target);
    }
  }, [preselectedBookingId, bookingsForReport]);

  useEffect(() => {
    if (verification.reportBranchId) {
      const found = branches.find(b => b.id === verification.reportBranchId) || null;
      setSelectedBranchDetails(found);
    } else {
      setSelectedBranchDetails(null);
    }
  }, [verification.reportBranchId, branches]);

  const handleSelectBooking = useCallback((booking: any) => {
    setSelectedBooking(booking);
    setShowModal(false);
    setEditingParam(null);
    const existingReport = reports.find((r: any) => r.bookingId === booking.id);
    if (existingReport) {
      const groups = buildTestGroups(booking);
      groups.forEach(g => {
        g.parameters.forEach(p => {
          const match = existingReport.parameters?.find((ep: any) => ep.parameterId === p.parameterId || ep.parameterName === p.parameterName);
          if (match) {
            p.value = match.observedValue || '';
            p.flag = computeFlag(match.observedValue, p);
            p.isAbnormal = match.isAbnormal || false;
          }
        });
      });
      setTestGroups(groups);
      setNotes({
        clinicalNotes: existingReport.clinicalNotes || '',
        technicianRemarks: existingReport.technicianRemarks || '',
        doctorRemarks: existingReport.doctorRemarks || '',
        internalNotes: existingReport.internalNotes || '',
      });
    const fallbackBranchId = booking.collectionMode === 'HOME'
        ? (booking.sampleDelivery?.branch?.id || '')
        : (booking.branchId || '');
      setVerification({
        reportBranchId: existingReport.reportBranchId || fallbackBranchId,
        doctorName: existingReport.doctorName || '',
        doctorQualification: existingReport.doctorQualification || '',
        doctorRegNo: existingReport.doctorRegNo || '',
        doctorDesignation: existingReport.doctorDesignation || '',
        doctorVerifiedAt: existingReport.doctorVerifiedAt || new Date().toISOString(),
      });
    } else {
      setTestGroups(buildTestGroups(booking));
      setNotes({ clinicalNotes: '', technicianRemarks: '', doctorRemarks: '', internalNotes: '' });
  const defaultBranchId = booking.collectionMode === 'HOME'
        ? (booking.sampleDelivery?.branch?.id || '')
        : (booking.branchId || '');
      setVerification({ ...emptyVerification(), reportBranchId: defaultBranchId });
    }
  }, [reports]);

  const updateParam = (groupIdx: number, paramIdx: number, patch: Partial<ParameterEntry>) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g,
      parameters: g.parameters.map((p, pi) => {
        if (pi !== paramIdx) return p;
        const updated = { ...p, ...patch };
        if (patch.value !== undefined || patch.referenceRanges !== undefined || patch.criticalLow !== undefined || patch.criticalHigh !== undefined) {
          const val = patch.value !== undefined ? patch.value : p.value;
          const ranges = patch.referenceRanges !== undefined ? patch.referenceRanges : p.referenceRanges;
          const newParam = { ...updated, referenceRanges: ranges };
          const flag = computeFlag(val, newParam);
          updated.flag = flag;
          updated.isAbnormal = flag !== 'NORMAL' && flag !== 'PENDING';
          if (patch.referenceRanges !== undefined) updated.referenceRange = buildRangeString(ranges);
        }
        return updated;
      }),
    }));
  };

  const updateRange = (groupIdx: number, paramIdx: number, rangeIdx: number, patch: Partial<RangeEntry>) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g,
      parameters: g.parameters.map((p, pi) => {
        if (pi !== paramIdx) return p;
        const newRanges = p.referenceRanges.map((r, ri) => ri !== rangeIdx ? r : { ...r, ...patch });
        const flag = computeFlag(p.value, { ...p, referenceRanges: newRanges });
        return { ...p, referenceRanges: newRanges, referenceRange: buildRangeString(newRanges), flag, isAbnormal: flag !== 'NORMAL' && flag !== 'PENDING' };
      }),
    }));
  };

  const addRange = (groupIdx: number, paramIdx: number) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g,
      parameters: g.parameters.map((p, pi) => pi !== paramIdx ? p : {
        ...p, referenceRanges: [...p.referenceRanges, { gender: 'ANY', minAge: 0, maxAge: 120, minRange: 0, maxRange: 0 }],
      }),
    }));
  };

  const deleteRange = (groupIdx: number, paramIdx: number, rangeIdx: number) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g,
      parameters: g.parameters.map((p, pi) => pi !== paramIdx ? p : {
        ...p, referenceRanges: p.referenceRanges.filter((_, ri) => ri !== rangeIdx),
      }),
    }));
  };

  const addParameter = (groupIdx: number) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g, parameters: [...g.parameters, emptyParam(g.parameters.length)],
    }));
    setEditingParam({ groupIdx, paramIdx: testGroups[groupIdx].parameters.length });
  };

  const deleteParameter = (groupIdx: number, paramIdx: number) => {
    setTestGroups(prev => prev.map((g, gi) => gi !== groupIdx ? g : {
      ...g, parameters: g.parameters.filter((_, pi) => pi !== paramIdx),
    }));
    setEditingParam(null);
  };

  const moveParameter = (groupIdx: number, paramIdx: number, dir: -1 | 1) => {
    const newIdx = paramIdx + dir;
    setTestGroups(prev => prev.map((g, gi) => {
      if (gi !== groupIdx) return g;
      const params = [...g.parameters];
      if (newIdx < 0 || newIdx >= params.length) return g;
      [params[paramIdx], params[newIdx]] = [params[newIdx], params[paramIdx]];
      return { ...g, parameters: params };
    }));
  };

  const buildPayload = () => {
    const parameters: any[] = [];
    testGroups.forEach(g => g.parameters.forEach(p => {
      parameters.push({
        parameterId: p.parameterId.startsWith('new-') ? undefined : p.parameterId,
        parameterName: p.parameterName,
        observedValue: p.value || '0',
        unit: p.unit,
        referenceRange: p.referenceRange,
        isAbnormal: p.isAbnormal,
      });
    }));
    const testNames = [
      ...(selectedBooking?.tests?.map((bt: any) => bt.test?.name) || []),
      ...(selectedBooking?.packages?.map((bp: any) => bp.package?.name) || []),
    ].filter(Boolean).join(', ');
    return {
      bookingId: selectedBooking.id,
      testName: testNames || 'Diagnostic Test',
      clinicalNotes: notes.clinicalNotes,
      technicianRemarks: notes.technicianRemarks,
      doctorRemarks: notes.doctorRemarks,
      internalNotes: notes.internalNotes,
      parameters,
      recipientType: 'USER',
      recipientId: selectedBooking.userId,
      reportBranchId: verification.reportBranchId || null,
      doctorName: verification.doctorName || null,
      doctorQualification: verification.doctorQualification || null,
      doctorRegNo: verification.doctorRegNo || null,
      doctorDesignation: verification.doctorDesignation || null,
      doctorVerifiedAt: verification.doctorVerifiedAt || null,
    };
  };

  const handleSaveDraft = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const existingReport = reports.find((r: any) => r.bookingId === selectedBooking.id);
      const payload = buildPayload();
      if (existingReport) {
        await dispatch(updateReportDraftThunk({ id: existingReport.id, payload })).unwrap();
      } else {
        await dispatch(createReportThunk(payload)).unwrap();
      }
      await dispatch(fetchAllReports());
     toast.success('Draft saved', 'Report draft has been saved successfully.');
    } catch (e: any) {
      toast.error('Save failed', typeof e === 'string' ? e : 'Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

const filteredBookings = useMemo(() => {
    const raw = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!raw) return bookingsForReport;
    return bookingsForReport.filter((b: any) => {
      const testNames = (b.tests || []).map((bt: any) => bt.test?.name || '').join(' ');
      const packageNames = (b.packages || []).map((bp: any) => bp.package?.name || '').join(' ');
      const testCategories = (b.tests || []).map((bt: any) => bt.test?.category?.name || '').join(' ');
      const fields = [
        b.patientName,
        b.bookingCode,
        b.id,
        b.patientMobile,
        b.user?.mobile,
        b.uhid,
        b.sampleId,
        testNames,
        packageNames,
        testCategories,
      ].map(f => (f || '').toLowerCase());
      return fields.some(f => f.includes(raw));
    });
  }, [bookingsForReport, searchQuery]);

  const bookingsWithoutReport = filteredBookings.filter((b: any) => !b.report || b.report.status === 'DRAFT');

  const getBookingTestNames = (booking: any) => {
    const tests = booking.tests?.map((bt: any) => bt.test?.name).filter(Boolean) || [];
    const pkgs = booking.packages?.map((bp: any) => bp.package?.name).filter(Boolean) || [];
    return [...tests, ...pkgs].join(', ') || 'No tests';
  };

  const isEditingThis = (gi: number, pi: number) => editingParam?.groupIdx === gi && editingParam?.paramIdx === pi;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Report Builder</h1>
          <p className="text-sm text-muted-foreground">Select a booking, enter test values, and save as draft.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm hover:bg-primary/90">
          <FileText className="h-4 w-4" /> Create Report
        </button>
      </div>

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-2xl z-[60] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Select Booking</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <input type="text" placeholder="Search by name, code, mobile, test, package..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
             {bookingsLoading ? <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                : bookingsWithoutReport.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">No matching bookings found</div>
                    <div className="text-xs text-muted-foreground max-w-xs">Try searching by patient name, booking code, mobile number, test name, or package name.</div>
                  </div>
                )
                : bookingsWithoutReport.map((b: any) => (
                  <button key={b.id} onClick={() => handleSelectBooking(b)} className="w-full text-left p-3 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-foreground">{b.patientName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{b.bookingCode}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{getBookingTestNames(b)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{b.patientMobile || b.user?.mobile}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Recent Drafts</h3>
          <div className="space-y-2">
            {reports.filter((r: any) => r.status === 'DRAFT').map((r: any) => {
              const booking = bookingsForReport.find((b: any) => b.id === r.bookingId);
              return (
                <button key={r.id} onClick={() => booking && handleSelectBooking(booking)} className={cn("w-full text-left p-3 border rounded-xl shadow-sm transition-all flex items-center justify-between", selectedBooking?.id === r.bookingId ? "bg-primary text-white border-primary" : "bg-card border-border hover:border-primary/50")}>
                  <div>
                    <div className="font-bold text-sm truncate max-w-[160px]">{booking?.patientName || r.booking?.patientName}</div>
                    <div className={cn("text-xs font-mono mt-0.5", selectedBooking?.id === r.bookingId ? "text-white/70" : "text-muted-foreground")}>{booking?.bookingCode || r.booking?.bookingCode}</div>
                    <span className={cn("inline-block text-[9px] font-black uppercase mt-1", selectedBooking?.id === r.bookingId ? "text-white" : "text-amber-600")}>Draft</span>
                  </div>
                  <ChevronRight className={cn("h-4 w-4", selectedBooking?.id === r.bookingId ? "text-white" : "text-muted-foreground")} />
                </button>
              );
            })}
            {reports.filter((r: any) => r.status === 'DRAFT').length === 0 && (
              <div className="bg-muted/50 border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-xs">No draft reports.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedBooking ? (
              <motion.div key={selectedBooking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-xs text-muted-foreground">Patient</div><div className="font-bold">{selectedBooking.patientName}</div></div>
                    <div><div className="text-xs text-muted-foreground">Booking Code</div><div className="font-mono font-bold">{selectedBooking.bookingCode}</div></div>
                    <div><div className="text-xs text-muted-foreground">Mobile</div><div className="font-bold">{selectedBooking.patientMobile || selectedBooking.user?.mobile}</div></div>
                    <div><div className="text-xs text-muted-foreground">Collection</div><div className="font-bold">{selectedBooking.collectionMode}</div></div>
                    <div><div className="text-xs text-muted-foreground">Gender</div><div className="font-bold">{selectedBooking.patientGender || '-'}</div></div>
                    <div><div className="text-xs text-muted-foreground">Age</div><div className="font-bold">{selectedBooking.patientAge ? `${selectedBooking.patientAge} yrs` : '-'}</div></div>
                  <div><div className="text-xs text-muted-foreground">Branch</div><div className="font-bold">{selectedBooking.collectionMode === 'HOME' ? (selectedBooking.sampleDelivery?.branch?.name || 'Not Assigned') : (selectedBooking.branch?.name || 'Not Assigned')}</div></div>
                    <div><div className="text-xs text-muted-foreground">Scheduled</div><div className="font-bold">{new Date(selectedBooking.scheduledDate).toLocaleDateString('en-IN')}</div></div>
                  </div>
                </div>

                {testGroups.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 space-y-2">
                    <div className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> No parameters found for:</div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {[...(selectedBooking?.tests?.map((bt: any) => bt.test) || []), ...(selectedBooking?.packages?.flatMap((bp: any) => bp.package?.testsIncluded?.map((pt: any) => pt.test) || []) || [])].filter(Boolean).map((t: any) => (
                        <li key={t.id}><span className="font-semibold">{t.name}</span> - go to Test Catalog and add parameters.</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testGroups.map((group, groupIdx) => (
                  <div key={group.testId} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-muted/50 px-5 py-3.5 border-b border-border flex items-center justify-between">
                      <div className="font-bold text-sm text-foreground">{group.testName}</div>
                      <button onClick={() => addParameter(groupIdx)} className="text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded">
                        <Plus className="h-3.5 w-3.5" /> Add Parameter
                      </button>
                    </div>

                    <div className="divide-y divide-border">
                      {group.parameters.map((param, paramIdx) => {
                        const flagCfg = FLAG_CONFIG[param.flag];
                        const isEditing = isEditingThis(groupIdx, paramIdx);
                        return (
                          <div key={param.parameterId} className={cn("transition-all", isEditing ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/10")}>
                            <div className="px-5 py-3 flex items-center gap-3">
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => moveParameter(groupIdx, paramIdx, -1)} disabled={paramIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                                <button onClick={() => moveParameter(groupIdx, paramIdx, 1)} disabled={paramIdx === group.parameters.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                              </div>

                              <div className="flex-1 grid grid-cols-12 gap-3 items-center text-sm">
                                <div className="col-span-3">
                                  {isEditing ? (
                                    <input value={param.parameterName} onChange={e => updateParam(groupIdx, paramIdx, { parameterName: e.target.value })} className="w-full text-sm font-semibold border border-border rounded px-2 py-1 bg-background outline-none focus:border-primary" placeholder="Parameter name" />
                                  ) : (
                                    <div className="font-semibold text-foreground">{param.parameterName || <span className="text-muted-foreground italic">Unnamed</span>}
                                      <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">{param.unit}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="col-span-2">
                                  {isEditing ? (
                                    <input value={param.unit} onChange={e => updateParam(groupIdx, paramIdx, { unit: e.target.value })} className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none focus:border-primary" placeholder="Unit" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-mono">{param.referenceRange || '-'}</span>
                                  )}
                                </div>

                                <div className="col-span-2">
                                  {param.resultType === 'NUMERIC' ? (
                                    <input type="number" step="0.01" value={param.value} onChange={e => updateParam(groupIdx, paramIdx, { value: e.target.value })}
                                      className={cn("w-full text-center py-1 px-2 text-sm font-bold rounded border outline-none focus:ring-1",
                                        param.flag === 'CRITICAL_HIGH' || param.flag === 'CRITICAL_LOW' ? "border-red-300 text-red-700 bg-red-50 focus:ring-red-200"
                                          : param.flag === 'HIGH' || param.flag === 'LOW' ? "border-amber-300 text-amber-700 bg-amber-50 focus:ring-amber-200"
                                          : param.flag === 'NORMAL' ? "border-emerald-300 text-emerald-700 bg-emerald-50 focus:ring-emerald-200"
                                          : "border-input bg-card focus:ring-primary/20"
                                      )} placeholder="Value" />
                                  ) : param.resultType === 'POS_NEG' ? (
                                    <select value={param.value} onChange={e => updateParam(groupIdx, paramIdx, { value: e.target.value, flag: e.target.value === 'Positive' ? 'HIGH' : 'NORMAL' })} className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none">
                                      <option value="">Select</option>
                                      <option>Positive</option>
                                      <option>Negative</option>
                                    </select>
                                  ) : param.resultType === 'YES_NO' ? (
                                    <select value={param.value} onChange={e => updateParam(groupIdx, paramIdx, { value: e.target.value })} className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none">
                                      <option value="">Select</option>
                                      <option>Yes</option>
                                      <option>No</option>
                                    </select>
                                  ) : (
                                    <input type="text" value={param.value} onChange={e => updateParam(groupIdx, paramIdx, { value: e.target.value })} className="w-full text-xs border border-border rounded px-2 py-1 bg-background outline-none focus:border-primary" placeholder="Result" />
                                  )}
                                </div>

                                <div className="col-span-2">
                                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded border uppercase", flagCfg.className)}>{flagCfg.label}</span>
                                </div>

                                <div className="col-span-3 flex items-center justify-end gap-1.5">
                                  {isEditing ? (
                                    <select value={param.resultType} onChange={e => updateParam(groupIdx, paramIdx, { resultType: e.target.value as ResultType })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none">
                                      <option value="NUMERIC">Numeric</option>
                                      <option value="TEXT">Text</option>
                                      <option value="POS_NEG">Pos/Neg</option>
                                      <option value="YES_NO">Yes/No</option>
                                    </select>
                                  ) : null}
                                  <button onClick={() => setEditingParam(isEditing ? null : { groupIdx, paramIdx })} className={cn("p-1.5 rounded text-xs font-bold", isEditing ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => deleteParameter(groupIdx, paramIdx)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="px-5 pb-4 space-y-4 border-t border-border/50 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Critical Low</label>
                                    <input type="number" step="0.01" value={param.criticalLow} onChange={e => updateParam(groupIdx, paramIdx, { criticalLow: e.target.value })} className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background outline-none focus:border-primary" placeholder="e.g. 2.0" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Critical High</label>
                                    <input type="number" step="0.01" value={param.criticalHigh} onChange={e => updateParam(groupIdx, paramIdx, { criticalHigh: e.target.value })} className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background outline-none focus:border-primary" placeholder="e.g. 20.0" />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Reference Ranges</label>
                                    <button type="button" onClick={() => addRange(groupIdx, paramIdx)} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-0.5 rounded">
                                      <Plus className="h-3 w-3" /> Add Range
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {param.referenceRanges.map((r, ri) => (
                                      <div key={ri} className="grid grid-cols-6 gap-2 items-center bg-muted/30 rounded p-2">
                                        <select value={r.gender} onChange={e => updateRange(groupIdx, paramIdx, ri, { gender: e.target.value as any })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none col-span-1">
                                          <option value="ANY">ANY</option>
                                          <option value="MALE">MALE</option>
                                          <option value="FEMALE">FEMALE</option>
                                        </select>
                                        <input type="number" value={r.minAge} onChange={e => updateRange(groupIdx, paramIdx, ri, { minAge: Number(e.target.value) })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none col-span-1" placeholder="Min Age" />
                                        <input type="number" value={r.maxAge} onChange={e => updateRange(groupIdx, paramIdx, ri, { maxAge: Number(e.target.value) })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none col-span-1" placeholder="Max Age" />
                                        <input type="number" step="0.01" value={r.minRange} onChange={e => updateRange(groupIdx, paramIdx, ri, { minRange: Number(e.target.value) })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none col-span-1" placeholder="Min" />
                                        <input type="number" step="0.01" value={r.maxRange} onChange={e => updateRange(groupIdx, paramIdx, ri, { maxRange: Number(e.target.value) })} className="text-[10px] border border-border rounded px-1.5 py-1 bg-background outline-none col-span-1" placeholder="Max" />
                                        <button type="button" onClick={() => deleteRange(groupIdx, paramIdx, ri)} className="text-destructive hover:bg-destructive/10 p-1 rounded col-span-1">
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Description</label>
                                  <textarea value={param.description} onChange={e => updateParam(groupIdx, paramIdx, { description: e.target.value })} className="w-full h-16 text-xs border border-border rounded px-2 py-1.5 bg-background outline-none focus:border-primary resize-none" placeholder="Parameter description..." />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Interpretation</label>
                                  <textarea value={param.interpretation} onChange={e => updateParam(groupIdx, paramIdx, { interpretation: e.target.value })} className="w-full h-16 text-xs border border-border rounded px-2 py-1.5 bg-background outline-none focus:border-primary resize-none" placeholder="Clinical interpretation..." />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-foreground">Notes & Remarks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([
                      { key: 'clinicalNotes', label: 'Clinical Notes' },
                      { key: 'technicianRemarks', label: 'Technician Remarks' },
                      { key: 'doctorRemarks', label: 'Doctor Remarks' },
                      { key: 'internalNotes', label: 'Internal Notes (Admin Only)' },
                    ] as { key: keyof Notes; label: string }[]).map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">{label}</label>
                        <textarea value={notes[key]} onChange={e => setNotes(n => ({ ...n, [key]: e.target.value }))} className="w-full h-20 p-2 bg-card border border-input rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none text-foreground" placeholder={`Enter ${label.toLowerCase()}...`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Verification & Report Details
                  </h4>

                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Branch Details
                    </div>
                    <select
                      value={verification.reportBranchId}
                      onChange={e => setVerification(v => ({ ...v, reportBranchId: e.target.value }))}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 outline-none focus:border-primary bg-card"
                    >
                      <option value="">- Select Laboratory Branch -</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} - {b.city}</option>
                      ))}
                    </select>

                    {selectedBranchDetails && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border border-border text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Branch Name</div>
                          <div className="font-semibold text-foreground">{selectedBranchDetails.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">City</div>
                          <div className="font-semibold text-foreground">{selectedBranchDetails.city}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Phone</div>
                          <div className="font-semibold text-foreground">{(selectedBranchDetails as any).contactNumber || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Email</div>
                          <div className="font-semibold text-foreground">{(selectedBranchDetails as any).email || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Address</div>
                          <div className="font-semibold text-foreground">{(selectedBranchDetails as any).line1}, {selectedBranchDetails.state} {(selectedBranchDetails as any).pincode}</div>
                        </div>
                        {(selectedBranchDetails as any).labRegNo && (
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Lab Reg. No.</div>
                            <div className="font-semibold text-foreground">{(selectedBranchDetails as any).labRegNo}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" /> Doctor / Verifier Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Doctor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Anjali Mehta"
                          value={verification.doctorName}
                          onChange={e => setVerification(v => ({ ...v, doctorName: e.target.value }))}
                          className="w-full text-xs border border-input rounded-lg px-2.5 py-2 outline-none focus:border-primary bg-card"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Qualification</label>
                        <input
                          type="text"
                          placeholder="e.g. MD Pathology"
                          value={verification.doctorQualification}
                          onChange={e => setVerification(v => ({ ...v, doctorQualification: e.target.value }))}
                          className="w-full text-xs border border-input rounded-lg px-2.5 py-2 outline-none focus:border-primary bg-card"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Registration No.</label>
                        <input
                          type="text"
                          placeholder="e.g. MCI-44922"
                          value={verification.doctorRegNo}
                          onChange={e => setVerification(v => ({ ...v, doctorRegNo: e.target.value }))}
                          className="w-full text-xs border border-input rounded-lg px-2.5 py-2 outline-none focus:border-primary bg-card"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Designation</label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Pathologist"
                          value={verification.doctorDesignation}
                          onChange={e => setVerification(v => ({ ...v, doctorDesignation: e.target.value }))}
                          className="w-full text-xs border border-input rounded-lg px-2.5 py-2 outline-none focus:border-primary bg-card"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Verification Date & Time</label>
                        <input
                          type="datetime-local"
                          value={verification.doctorVerifiedAt ? toLocalDatetimeValue(verification.doctorVerifiedAt) : ''}
                          onChange={e => setVerification(v => ({ ...v, doctorVerifiedAt: new Date(e.target.value).toISOString() }))}
                          className="w-full text-xs border border-input rounded-lg px-2.5 py-2 outline-none focus:border-primary bg-card"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-xs font-bold">Back</button>
                  <button onClick={handleSaveDraft} disabled={saving} className="px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-xs font-black flex items-center gap-2 shadow-sm disabled:opacity-60">
                    <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-2xl h-[450px] flex flex-col items-center justify-center text-center p-8 shadow-inner">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4"><ClipboardList className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold text-foreground mb-1">No booking selected</h3>
                <p className="text-sm text-muted-foreground max-w-md">Click "Create Report" to select a booking and start entering test values.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};