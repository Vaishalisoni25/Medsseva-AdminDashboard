import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, BarChart3, Activity, PieChart as PieIcon,
  ArrowUpRight, Clock, Gauge, Award, ShieldAlert, RefreshCw,
  AlertTriangle, Info, Download, Calendar,
} from 'lucide-react';
import { analyticsService } from '../services/api';

const PIE_COLORS = ['#006D6F', '#DC2626'];

type Preset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
type RefreshInterval = 0 | 30 | 60 | 300;

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom' },
];

const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 300, label: '5m' },
];

interface Kpis {
  todayBookings: number;
  todayRevenue: number;
  totalRevenue: number;
  totalRefunds: number;
  pendingPayments: number;
  completedReports: number;
  pendingReports: number;
  pendingSampleCollections: number;
  homeCollectionBookings: number;
  labVisitBookings: number;
  activeBookings: number;
  totalBookings: number;
}

interface Tat {
  avgHours: number;
  medianHours: number;
  fastestHours: number;
  slowestHours: number;
  avgDoctorApprovalMinutes: number;
}

interface Sla {
  compliance: number;
  withinSla: number;
  nearSla: number;
  breachedSla: number;
  avgDelayHours: number;
  worstDelayHours: number;
  pieData: { name: string; value: number }[];
}

interface AnalyticsData {
  meta: { from: string; to: string; label: string };
  kpis: Kpis;
  tat: Tat;
  sla: Sla;
  revenueChart: { name: string; Revenue: number }[];
  bookingsByStatus: Record<string, number>;
  paymentModes: { mode: string; count: number; total: number }[];
  branchAnalytics: { branchId: string; branchName: string; bookingCount: number; revenue: number; pendingBookings: number }[];
  topTests: { testId: string; name: string; count: number }[];
  alerts: { type: string; message: string; severity: 'critical' | 'warning' | 'info' }[];
  insights: string[];
}

const safe = (v: number | null | undefined, fallback = 0): number =>
  typeof v === 'number' && isFinite(v) ? v : fallback;

const KpiSkeleton: React.FC = () => (
  <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-pulse" aria-hidden>
    <div className="h-12 w-12 bg-muted rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-2.5 bg-muted rounded w-32" />
      <div className="h-6 bg-muted rounded w-20" />
      <div className="h-2 bg-muted rounded w-24" />
    </div>
  </div>
);

const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-[400px]' }) => (
  <div className={`bg-card border rounded-2xl p-6 shadow-sm ${height} animate-pulse flex flex-col gap-4`} aria-hidden>
    <div className="h-4 bg-muted rounded w-48" />
    <div className="flex-1 bg-muted/50 rounded-xl" />
  </div>
);

const getErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  if (status === 401) return 'Session expired. Please log in again.';
  if (status === 403) return 'You do not have permission to view analytics.';
  if (status === 404) return 'Analytics endpoint not found. Contact support.';
  if (status >= 500) return 'Server error while loading analytics. Please retry.';
  if (!navigator.onLine) return 'No internet connection. Please check your network.';
  return e?.response?.data?.error || 'Failed to load analytics. Please try again.';
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('last30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(0);
  const [exportLoading, setExportLoading] = useState(false);
  const isFetching = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (preset === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = new Date(new Date(customTo).getTime() + 86400000).toISOString().split('T')[0];
      } else {
        params.preset = preset;
      }
      const result = await analyticsService.getDashboard(params as any);
      setData(result);
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (refreshInterval > 0) {
      timerRef.current = setInterval(fetchData, refreshInterval * 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refreshInterval, fetchData]);

  const handleExportCSV = useCallback(async () => {
    setExportLoading(true);
    try {
      const params: Record<string, string> = {};
      if (preset === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      } else {
        params.preset = preset;
      }
      const blob = await analyticsService.exportCSV(params as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${preset}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExportLoading(false);
    }
  }, [preset, customFrom, customTo]);

  const { criticalAlerts, warningAlerts } = useMemo(() => ({
    criticalAlerts: data?.alerts?.filter(a => a.severity === 'critical') ?? [],
    warningAlerts: data?.alerts?.filter(a => a.severity === 'warning') ?? [],
  }), [data?.alerts]);

  const kpis: Kpis = useMemo(() => ({
    todayBookings: safe(data?.kpis?.todayBookings),
    todayRevenue: safe(data?.kpis?.todayRevenue),
    totalRevenue: safe(data?.kpis?.totalRevenue),
    totalRefunds: safe(data?.kpis?.totalRefunds),
    pendingPayments: safe(data?.kpis?.pendingPayments),
    completedReports: safe(data?.kpis?.completedReports),
    pendingReports: safe(data?.kpis?.pendingReports),
    pendingSampleCollections: safe(data?.kpis?.pendingSampleCollections),
    homeCollectionBookings: safe(data?.kpis?.homeCollectionBookings),
    labVisitBookings: safe(data?.kpis?.labVisitBookings),
    activeBookings: safe(data?.kpis?.activeBookings),
    totalBookings: safe(data?.kpis?.totalBookings),
  }), [data?.kpis]);

  const tat: Tat = useMemo(() => ({
    avgHours: safe(data?.tat?.avgHours),
    medianHours: safe(data?.tat?.medianHours),
    fastestHours: safe(data?.tat?.fastestHours),
    slowestHours: safe(data?.tat?.slowestHours),
    avgDoctorApprovalMinutes: safe(data?.tat?.avgDoctorApprovalMinutes),
  }), [data?.tat]);

  const sla: Sla = useMemo(() => ({
    compliance: safe(data?.sla?.compliance, 100),
    withinSla: safe(data?.sla?.withinSla),
    nearSla: safe(data?.sla?.nearSla),
    breachedSla: safe(data?.sla?.breachedSla),
    avgDelayHours: safe(data?.sla?.avgDelayHours),
    worstDelayHours: safe(data?.sla?.worstDelayHours),
    pieData: Array.isArray(data?.sla?.pieData) ? data.sla.pieData : [],
  }), [data?.sla]);

  const revenueChart = useMemo(() =>
    Array.isArray(data?.revenueChart) ? data.revenueChart : [],
    [data?.revenueChart]
  );

  const topTests = useMemo(() =>
    Array.isArray(data?.topTests) ? data.topTests : [],
    [data?.topTests]
  );

  const periodLabel = data?.meta?.label ?? PRESETS.find(p => p.value === preset)?.label ?? '';

  if (loading) {
    return (
      <div className="space-y-6 pb-12" aria-busy="true" aria-label="Loading analytics">
        <div className="flex items-center justify-between">
          <div className="space-y-2 animate-pulse">
            <div className="h-7 bg-muted rounded w-72" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
          <div className="h-9 bg-muted rounded-lg w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8"><ChartSkeleton /></div>
          <div className="xl:col-span-4"><ChartSkeleton /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><ChartSkeleton height="h-[380px]" /></div>
          <div className="lg:col-span-4"><ChartSkeleton height="h-[380px]" /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4" role="alert">
        <div className="h-14 w-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-rose-500" aria-hidden />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">Analytics Unavailable</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Retry loading analytics"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="h-7 w-7 text-[#006D6F]" aria-hidden /> LIMS Performance & TAT Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Command console tracking clinical turnaround velocities, SLA breaches, and technician efficiency indexes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date preset picker */}
          <div className="flex items-center gap-1 bg-muted border rounded-lg p-1" role="group" aria-label="Date range">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all focus:outline-none focus:ring-1 focus:ring-primary ${preset === p.value ? 'bg-card text-slate-900 shadow' : 'text-muted-foreground hover:text-foreground'}`}
                aria-pressed={preset === p.value}
                aria-label={`Filter by ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {preset === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="text-[10px] border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="From date"
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="text-[10px] border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="To date"
              />
            </div>
          )}

          {/* Auto refresh */}
          <select
            value={refreshInterval}
            onChange={e => setRefreshInterval(Number(e.target.value) as RefreshInterval)}
            className="text-[10px] border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary font-bold"
            aria-label="Auto refresh interval"
          >
            {REFRESH_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.value === 0 ? 'Auto Refresh: Off' : `Refresh: ${o.label}`}
              </option>
            ))}
          </select>

          {/* Manual refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Refresh analytics"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          </button>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-1 px-3 py-2 text-[10px] font-black bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Export analytics as CSV"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>

          {/* SLA badge */}
          <div
            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm uppercase tracking-wide border ${sla.compliance >= 90 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : sla.compliance >= 75 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
            aria-label={`SLA compliance: ${sla.compliance}%`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden /> {sla.compliance}% SLA
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Median Lab TAT</div>
            <div className="text-2xl font-black text-slate-800">
              {tat.medianHours > 0 ? `${tat.medianHours} Hours` : '-'}
            </div>
            <div className="text-[9px] font-bold text-teal-600 mt-0.5">
              {tat.fastestHours > 0 ? `Fastest: ${tat.fastestHours}h` : 'No data yet'}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0" aria-hidden>
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Physician Sign-off Vel.</div>
            <div className="text-2xl font-black text-slate-800">
              {tat.avgDoctorApprovalMinutes > 0 ? `${tat.avgDoctorApprovalMinutes} Mins` : '-'}
            </div>
            <div className="text-[9px] font-bold text-emerald-600 mt-0.5">Average approval cycle</div>
          </div>
        </div>

        <div className={`bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-l-4 ${sla.breachedSla > 0 ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${sla.breachedSla > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`} aria-hidden>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pending SLA Escapes</div>
            <div className={`text-2xl font-black ${sla.breachedSla > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {sla.breachedSla > 0 ? `${sla.breachedSla} Cases` : 'All Clear'}
            </div>
            <div className={`text-[9px] font-bold mt-0.5 ${sla.breachedSla > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {sla.breachedSla > 0 ? `Avg delay: ${sla.avgDelayHours}h` : 'No SLA breaches'}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-card border p-6 rounded-2xl shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-3 border-b mb-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#006D6F]" aria-hidden /> Revenue Ingress vs SLA Compliance Ledger
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden /> {periodLabel}
            </span>
          </div>
          <div className="flex-1 min-h-0 w-full">
            {revenueChart.every(d => (d.Revenue ?? 0) === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                No revenue data for the selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006D6F" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#006D6F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={v => `₹${Number(v) / 1000}k`} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Area
                    name="Gross Booking Volume"
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#006D6F"
                    strokeWidth={3}
                    fill="url(#colorRev)"
                    activeDot={{ r: 5, tabIndex: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="xl:col-span-4 bg-card border p-6 rounded-2xl shadow-sm flex flex-col h-[400px]">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-slate-600" aria-hidden /> Cycle Compliance
            </h3>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            {sla.pieData.every(d => (d.value ?? 0) === 0) ? (
              <div className="text-xs text-muted-foreground italic text-center">No SLA data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sla.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={() => window.location.href = '/reports'}
                    style={{ cursor: 'pointer' }}
                    aria-label="SLA compliance pie chart"
                  >
                    {sla.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} reports`, '']} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none" aria-label={`${sla.compliance}% success rate`}>
              <div className="text-2xl font-black text-slate-800">{sla.compliance}%</div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Success Rate</div>
            </div>
          </div>
          <div className="space-y-2.5 mt-4 pt-4 border-t text-xs font-bold">
            {sla.pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} aria-hidden />
                  <span>{entry.name}</span>
                </div>
                <span className="font-black text-slate-800">{entry.value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card border p-6 rounded-2xl shadow-sm h-[380px] flex flex-col">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#006D6F]" aria-hidden /> Top Tests by Booking Volume
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            {topTests.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                No test booking data for the selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTests} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94A3B8" interval={0} tick={{ width: 80 }} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94A3B8" />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    formatter={(v: any) => [v, 'Bookings']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar
                    name="Total Bookings"
                    dataKey="count"
                    fill="#006D6F"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    onClick={(entry: any) => {
                      if (entry?.testId) window.location.href = `/bookings?test=${entry.testId}`;
                    }}
                    style={{ cursor: 'pointer' }}
                    aria-label="Click to filter bookings by test"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-gradient-to-br from-[#004B4D] to-[#006D6F] text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[9px] font-black tracking-widest uppercase text-teal-300 bg-black/20 px-2 py-1 rounded w-max mb-4 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-teal-300 rounded-full animate-pulse" aria-hidden /> Real-time Pulse
            </div>
            <h3 className="text-lg font-black text-white">Actionable Insights</h3>
            {(data?.insights?.length ?? 0) > 0 ? (
              <p className="text-xs text-teal-100 leading-relaxed mt-2">{data.insights[0]}</p>
            ) : (
              <p className="text-xs text-teal-100 leading-relaxed mt-2">
                No insights available yet. Data will appear as bookings and reports are processed.
              </p>
            )}
          </div>

          <div className="space-y-3 my-6">
            {criticalAlerts.length === 0 && warningAlerts.length === 0 ? (
              <div className="bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold flex items-center gap-2" role="status">
                <Info className="h-3.5 w-3.5 text-teal-300 shrink-0" aria-hidden />
                <span className="text-teal-200">All systems operating normally.</span>
              </div>
            ) : (
              [...criticalAlerts.slice(0, 1), ...warningAlerts.slice(0, 1)].map((alert, i) => (
                <div key={i} className="bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold flex justify-between items-start gap-2" role="alert">
                  <span className="text-teal-200 leading-snug">{alert.type}</span>
                  <span className={`shrink-0 text-white text-[9px] font-black px-1.5 rounded ${alert.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}>
                    {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => window.location.href = '/samples'}
            className="w-full py-3 bg-white text-[#006D6F] font-black rounded-xl shadow text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1 uppercase focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Navigate to sample collection queue"
          >
            Manage Sample Queue <ArrowUpRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};