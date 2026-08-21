import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSampleQueueQuery } from '@/hooks/useAdminQueries';
import { sampleService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Beaker,
  Clock,
  ArrowUpRight,
  CheckSquare,
  Thermometer,
  Layers,
  Search,
  ShieldAlert,
  FlaskConical,
  X,
  Activity,
  FileCheck,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { io as socketIO } from 'socket.io-client';

interface SampleBooking {
  id: string;
  bookingCode: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  status: string;
  sampleCollectedAt: string | null;
  deliveredToLabAt: string | null;
  branchId: string | null;
  branch: { id: string; name: string; code: string } | null;
  tests: { test: { id: string; name: string } }[];
  packages: { package: { id: string; name: string } }[];
  sample: {
    id: string;
    accessionNumber: string;
    sampleType: string;
    condition: string;
    status: string;
    receivedAt: string;
    processingStartedAt: string | null;
  } | null;
}

type SampleCondition = 'GOOD' | 'HAEMOLYSED' | 'INSUFFICIENT' | 'LEAKED';

const CONDITION_LABELS: Record<SampleCondition, string> = {
  GOOD: 'Good (Passed Inspection)',
  HAEMOLYSED: 'Haemolysed (Damaged Cells)',
  INSUFFICIENT: 'Insufficient Quantity',
  LEAKED: 'Leaked Vial',
};

const SAMPLE_TYPES = [
  'Blood (EDTA Tube)',
  'Blood (Serum)',
  'Blood (Fluoride)',
  'Urine (Random)',
  'Urine (24hr)',
  'Stool',
  'Swab',
  'Sputum',
];

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const SamplesPage: React.FC = () => {
  const [bookings, setBookings] = useState<SampleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<SampleBooking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sampleType, setSampleType] = useState(SAMPLE_TYPES[0]);
  const [condition, setCondition] = useState<SampleCondition>('GOOD');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [notes, setNotes] = useState('');

  const socketRef = useRef<any>(null);

const { data: queueData, isLoading: queueLoading } = useSampleQueueQuery();

  useEffect(() => {
    if (queueData) { setBookings(queueData); setError(null); }
    if (!queueLoading) setLoading(false);
  }, [queueData, queueLoading]);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await sampleService.getQueue();
      setBookings(data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load LIMS queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!queueData) fetchQueue();
    const token = localStorage.getItem('medsseva_token');
    if (token) {
      const socket = socketIO(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token },
      });
      socketRef.current = socket;

      socket.emit('lims:join');

      socket.on('lims:update', ({ booking }: { type: string; booking: SampleBooking }) => {
        setBookings(prev => {
          const idx = prev.findIndex(b => b.id === booking.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = booking;
            return next;
          }
          return [booking, ...prev];
        });
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchQueue]);

  const inboundQueue = bookings.filter(b =>
    b.status === 'SAMPLE_COLLECTED' && !b.sample &&
    (b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.patientName.toLowerCase().includes(search.toLowerCase()))
  );

  const accessionedQueue = bookings.filter(b =>
    (b.status === 'DELIVERED_TO_LAB' && b.sample?.status === 'ACCESSIONED') &&
    (b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.patientName.toLowerCase().includes(search.toLowerCase()))
  );

  const processingQueue = bookings.filter(b =>
    b.status === 'PROCESSING' && b.sample?.status === 'PROCESSING' &&
    (b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.patientName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenIntake = (b: SampleBooking) => {
    setSelectedBooking(b);
    setSampleType(SAMPLE_TYPES[0]);
    setCondition('GOOD');
    setRejectionNotes('');
    setNotes('');
  };

  const processAccession = async () => {
    if (!selectedBooking) return;
    if (condition !== 'GOOD' && !rejectionNotes.trim()) return;

    setSubmitting(true);
    try {
      await sampleService.receiveSample({
        bookingId: selectedBooking.id,
        sampleType,
        condition,
        notes: notes || undefined,
        rejectionReason: condition !== 'GOOD' ? rejectionNotes : undefined,
      });
      setSelectedBooking(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to process sample.');
    } finally {
      setSubmitting(false);
    }
  };

  const startCentrifugeAnalysis = async (bookingId: string) => {
    try {
      await sampleService.startProcessing(bookingId);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to start processing.');
    }
  };

  const getSampleTypes = (booking: SampleBooking): string[] => {
    const types = new Set<string>();
    booking.tests.forEach(() => types.add('Blood (EDTA Tube)'));
    booking.packages.forEach(() => types.add('Blood (Serum)'));
    return types.size > 0 ? Array.from(types) : ['Blood (EDTA Tube)'];
  };

if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-72" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="h-9 w-72 bg-muted rounded-lg" />
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <div className="h-10 w-10 bg-muted rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-40" />
              <div className="h-2.5 bg-muted rounded w-56" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-28 bg-muted rounded" />
            <div className="h-6 w-36 bg-muted rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {[
            { accent: 'bg-emerald-100', label: 'bg-emerald-200', bar: 'border-emerald-200' },
            { accent: 'bg-indigo-100', label: 'bg-indigo-200', bar: 'border-indigo-200' },
            { accent: 'bg-sky-100', label: 'bg-sky-200', bar: 'border-sky-200' },
          ].map((col, ci) => (
            <div key={ci} className="bg-card border rounded-2xl overflow-hidden shadow-sm h-[650px] flex flex-col">
              <div className={`${col.accent} border-b p-4 flex justify-between items-center`}>
                <div className="h-3.5 bg-muted rounded w-36" />
                <div className={`h-5 w-6 ${col.label} rounded-full`} />
              </div>
              <div className="flex-1 p-4 space-y-3 bg-slate-50/30">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`bg-card border ${col.bar} rounded-xl p-3.5 shadow-sm space-y-3`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <div className="h-3 bg-muted rounded w-28" />
                        <div className="h-2.5 bg-muted rounded w-20" />
                      </div>
                      <div className="h-4 w-12 bg-muted rounded" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div className="h-2.5 w-16 bg-muted rounded" />
                      <div className="h-2.5 w-16 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-emerald-600" /> Advanced LIMS Sample Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Logistics checkpoint for accessioning, physical condition QC, and centrifuge testing flows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchQueue}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Scan Tube Barcode..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-input text-xs font-bold shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-xl">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Centrifuge Intake Vault #3</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Safe Guard Protocol: 2°C – 8°C •{' '}
              <span className="text-amber-600 font-black">Device Not Connected</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black px-2.5 py-1 rounded uppercase">
            IoT Not Configured
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded uppercase">
            Chain of Custody Secure
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* COLUMN 1: INBOUND */}
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm h-[650px] flex flex-col">
          <div className="bg-emerald-50/40 border-b p-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-emerald-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" /> 1. Inbound Intake
            </h3>
            <span className="h-5 px-2 bg-emerald-200 text-emerald-900 text-[10px] font-black rounded-full flex items-center justify-center border border-emerald-300">
              {inboundQueue.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30">
            {inboundQueue.map(booking => (
              <motion.div
                layoutId={`card-${booking.id}`}
                key={booking.id}
                className="bg-card border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-emerald-300 hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => handleOpenIntake(booking)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 truncate max-w-[160px]">{booking.patientName}</h4>
                    <div className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">{booking.bookingCode}</div>
                  </div>
                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                    Arrived
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {getSampleTypes(booking).map((s, i) => (
                    <span key={i} className="text-[8px] bg-slate-100 text-slate-600 font-black px-1.5 py-0.5 rounded truncate max-w-full">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                    <Clock className="h-3 w-3" /> {timeAgo(booking.sampleCollectedAt)}
                  </div>
                  <button className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-0.5">
                    Accession <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
            {inboundQueue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl opacity-60 bg-white">
                <CheckSquare className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400">No pending inbound scan collections</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: ACCESSIONED */}
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm h-[650px] flex flex-col">
          <div className="bg-indigo-50/40 border-b p-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" /> 2. Accession Queue
            </h3>
            <span className="h-5 px-2 bg-indigo-200 text-indigo-900 text-[10px] font-black rounded-full flex items-center justify-center border border-indigo-300">
              {accessionedQueue.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30">
            {accessionedQueue.map(booking => (
              <motion.div
                key={booking.id}
                className="bg-card border border-slate-200 rounded-xl p-3.5 shadow-sm border-l-4 border-l-indigo-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{booking.patientName}</h4>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 mt-0.5">
                      <FileCheck className="h-3 w-3" /> {booking.sample?.accessionNumber}
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>

                <div className="mt-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-black px-2 py-1 rounded flex items-center gap-1">
                  <CheckSquare className="h-3 w-3 text-emerald-600" />
                  Condition: {booking.sample?.condition || 'GOOD'} - Cleared
                </div>

                <div className="text-[8px] text-slate-400 font-bold mt-2">
                  Received {timeAgo(booking.sample?.receivedAt || null)}
                </div>

                <button
                  onClick={() => startCentrifugeAnalysis(booking.id)}
                  className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded flex items-center justify-center gap-1 shadow uppercase"
                >
                  <RefreshCw className="h-3 w-3" /> Spin Centrifuge
                </button>
              </motion.div>
            ))}
            {accessionedQueue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl opacity-60 bg-white">
                <FileCheck className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400">Queue is clear. Centrifuge empty.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: PROCESSING */}
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm h-[650px] flex flex-col">
          <div className="bg-sky-50/40 border-b p-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-sky-900 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-sky-600" /> 3. In Analyzer
            </h3>
            <span className="h-5 px-2 bg-sky-200 text-sky-900 text-[10px] font-black rounded-full flex items-center justify-center border border-sky-300">
              {processingQueue.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30">
            {processingQueue.map(booking => (
              <motion.div
                key={booking.id}
                className="bg-card border border-slate-200 rounded-xl p-3.5 shadow-sm border-l-4 border-l-sky-500 relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-sky-100 overflow-hidden">
                  <div className="h-full bg-sky-600 w-1/2 rounded" style={{ animation: 'shimmer 1.5s infinite linear' }} />
                </div>

                <div className="flex justify-between items-start mt-1">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{booking.patientName}</h4>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">{booking.bookingCode}</div>
                  </div>
                  <span className="text-[8px] font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Testing
                  </span>
                </div>

                <div className="mt-1 text-[8px] text-indigo-600 font-bold">
                  {booking.sample?.accessionNumber}
                </div>

                <div className="mt-3 p-2 bg-sky-50/50 border border-sky-100 rounded-lg flex items-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-sky-600 border-t-transparent rounded-full" />
                  <span className="text-[9px] font-extrabold text-sky-800">
                    Processing - {booking.sample?.sampleType || 'Sample'}
                  </span>
                </div>

                <div className="text-[8px] text-slate-400 font-bold mt-2">
                  Started {timeAgo(booking.sample?.processingStartedAt || null)}
                </div>

                <a
                  href="/report-builder"
                  className="w-full mt-4 py-1.5 border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 text-[9px] font-black rounded flex items-center justify-center gap-1 transition-all uppercase"
                >
                  Enter Derived Data <ArrowUpRight className="h-3 w-3" />
                </a>
              </motion.div>
            ))}
            {processingQueue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl opacity-60 bg-white">
                <Beaker className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400">No samples in wet analyzer machinery</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACCESSION MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setSelectedBooking(null)}
              className="fixed inset-0 bg-slate-950 z-[90] cursor-pointer backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto h-max max-w-lg w-full bg-background rounded-2xl border border-border z-[100] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-emerald-700 text-white p-5 flex justify-between items-center border-b border-emerald-800 shadow-sm">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-100" />
                  <h3 className="text-base font-black tracking-tight uppercase">Scan Reception Node</h3>
                </div>
                <button
                  onClick={() => !submitting && setSelectedBooking(null)}
                  className="hover:bg-white/10 p-1 rounded text-emerald-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 bg-slate-50/20">
                <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Subject Profile</span>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{selectedBooking.patientName}</h4>
                    <p className="text-[10px] font-bold text-slate-500">
                      {selectedBooking.patientGender}, {selectedBooking.patientAge} Yrs
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Booking Key</span>
                    <div className="font-mono text-xs font-black text-slate-700">{selectedBooking.bookingCode}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">Sample Type</label>
                    <select
                      className="w-full p-2 border text-sm rounded bg-card font-bold"
                      value={sampleType}
                      onChange={e => setSampleType(e.target.value)}
                    >
                      {SAMPLE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">Visual Condition QC</label>
                    <select
                      className="w-full p-2 border text-sm rounded bg-card font-bold"
                      value={condition}
                      onChange={e => setCondition(e.target.value as SampleCondition)}
                    >
                      {(Object.entries(CONDITION_LABELS) as [SampleCondition, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">Notes (optional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border text-sm rounded bg-card"
                    placeholder="Any additional observations..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {condition !== 'GOOD' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl"
                  >
                    <div className="flex items-center gap-1.5 text-rose-800">
                      <ShieldAlert className="h-4 w-4" />
                      <span className="text-xs font-black uppercase">Strict Rejection Mandatory</span>
                    </div>
                    <p className="text-[10px] text-rose-700 opacity-90">
                      This sample violates biological stability checks. You must reject it to auto-queue an urgent re-collection booking dispatch.
                    </p>
                    <textarea
                      className="w-full p-2 border border-rose-200 text-xs rounded text-rose-950 placeholder-rose-300 bg-white focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="Record rejection rationale for audit history..."
                      value={rejectionNotes}
                      onChange={e => setRejectionNotes(e.target.value)}
                    />
                  </motion.div>
                )}

                <div className="mt-4 pt-4 border-t flex justify-end gap-2 bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => !submitting && setSelectedBooking(null)}
                    className="px-4 py-2 text-xs border font-extrabold rounded"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  {condition === 'GOOD' ? (
                    <button
                      onClick={processAccession}
                      disabled={submitting}
                      className="px-6 py-2 text-xs bg-emerald-700 text-white font-black rounded shadow-md hover:bg-emerald-800 flex items-center gap-1 uppercase disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                      Approve & Accession
                    </button>
                  ) : (
                    <button
                      onClick={processAccession}
                      disabled={submitting || !rejectionNotes.trim()}
                      className="px-6 py-2 text-xs bg-rose-600 text-white font-black rounded shadow-md hover:bg-rose-700 flex items-center gap-1 uppercase disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                      Reject Sample
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};