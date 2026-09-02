import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService } from '@/services/api';
import { 
  Stethoscope, FileText, CheckCircle2, Clock, 
  DollarSign, TrendingUp, Calendar, Search, LogOut, 
  ExternalLink, Building2, User, Activity, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const DoctorPortalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'WEEKLY' | '15_DAYS' | '30_DAYS' | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchDoctorData = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const res = await commissionService.getDoctorPortalData(selectedPeriod);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load doctor portal data:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/doctor-portal/login');
      } else {
        toast.error(err.response?.data?.error || 'Failed to fetch doctor portal data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData(period);
  }, [period]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor_user');
    localStorage.removeItem('portal_type');
    toast.success('Logged out successfully');
    navigate('/doctor-portal/login');
  };

  const referrals = data?.referrals || [];
  const filteredReferrals = referrals.filter((r: any) => {
    const q = search.toLowerCase();
    return (
      r.patientName?.toLowerCase().includes(q) ||
      r.bookingCode?.toLowerCase().includes(q) ||
      r.tests?.some((t: any) => t.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20">
      {/* Top Navbar */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-inner shrink-0">
            <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
              MedsSeva <span className="text-teal-400 text-[10px] sm:text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 font-bold">Doctor Portal</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">
              {data?.doctor?.name ? `Dr. ${data.doctor.name}` : 'Doctor Dashboard'} • <span className="font-mono text-teal-300">{data?.doctor?.code || 'DOC-101'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchDoctorData(period)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Doctor Welcome & Badges Bar */}
        <div className="bg-gradient-to-r from-teal-950/80 via-slate-800/90 to-slate-800/80 border border-teal-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 z-10">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">Welcome Back</div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Dr. {data?.doctor?.name || 'Doctor'}</h1>
            <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-2 pt-1">
              <span>{data?.doctor?.qualification || 'MBBS, MD'}</span>
              <span>•</span>
              <span>{data?.doctor?.specialization || 'Clinical Pathology'}</span>
              <span>•</span>
              <span className="text-slate-300">Reg: {data?.doctor?.registrationNo || 'MCI-88921'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 z-10">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl px-3 sm:px-4 py-2 text-center flex-1 sm:flex-none">
              <div className="text-[10px] font-bold uppercase text-teal-400">Configured Commission</div>
              <div className="text-base sm:text-lg font-black text-white">{data?.summary?.commissionRate ?? 30}%</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 sm:px-4 py-2 text-center flex-1 sm:flex-none">
              <div className="text-[10px] font-bold uppercase text-blue-400">Payment Cycle</div>
              <div className="text-base sm:text-lg font-black text-white">{data?.summary?.paymentCycle || 'MONTHLY'}</div>
            </div>
          </div>
        </div>

        {/* Period Selector & KPI Metrics */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1 bg-slate-800 border border-slate-700/80 p-1 rounded-xl w-full sm:w-auto">
              {[
                { id: 'WEEKLY', label: '7 Days' },
                { id: '15_DAYS', label: '15 Days' },
                { id: '30_DAYS', label: '30 Days' },
                { id: 'ALL', label: 'All Time' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id as any)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
                    period === tab.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient / test..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Referred Samples</span>
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white">{data?.summary?.totalReferredSamples ?? 0}</div>
              <div className="text-xs text-slate-400 mt-1">{data?.summary?.totalTestsCount ?? 0} Total Tests Conducted</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Billed Volume</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">₹{data?.summary?.totalBilledAmount?.toLocaleString('en-IN') ?? 0}</div>
              <div className="text-xs text-slate-400 mt-1">Diagnostic Turnover</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Commission</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">₹{data?.summary?.totalCommissionEarned?.toLocaleString('en-IN') ?? 0}</div>
              <div className="text-xs text-emerald-500/80 font-medium mt-1">Calculated @ {data?.summary?.commissionRate ?? 30}%</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Payout Breakdown</span>
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-emerald-400 font-bold">₹{data?.summary?.paidCommission?.toLocaleString('en-IN') ?? 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">● Paid</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-400 font-bold">₹{data?.summary?.unpaidCommission?.toLocaleString('en-IN') ?? 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">● Unpaid (Pending)</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Referred Samples & Reports Table */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" /> Referred Samples & Commission Logs
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredReferrals.length} referrals
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Tests Ordered</th>
                  <th className="py-3 px-4 text-right">Billed Amount</th>
                  <th className="py-3 px-4 text-right">Commission ({data?.summary?.commissionRate ?? 30}%)</th>
                  <th className="py-3 px-4 text-center">Payout Status</th>
                  <th className="py-3 px-4 text-center">Lab Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      No referred samples found for this cycle period.
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((item: any) => (
                    <tr key={item.bookingId} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                        {item.bookingCode}
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {new Date(item.scheduledDate || item.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{item.patientName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.patientAge ? `${item.patientAge} Y` : ''} {item.patientGender ? `• ${item.patientGender}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.tests?.map((t: any, idx: number) => (
                            <span key={idx} className="bg-slate-700/60 border border-slate-600/50 text-slate-200 px-2 py-0.5 rounded text-[10px]">
                              {t.name} (₹{t.price})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white font-mono">
                        ₹{item.totalPaid?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">
                        +₹{item.commissionAmount?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          item.payoutStatus === 'PAID'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        }`}>
                          ● {item.payoutStatus}
                        </span>
                        {item.paidAt && (
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            Paid: {new Date(item.paidAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.report ? (
                          <a
                            href={item.report.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Report
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Processing</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorPortalDashboardPage;
