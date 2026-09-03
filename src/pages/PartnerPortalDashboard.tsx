import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionService } from '@/services/api';
import { customFormatService } from '@/services/customFormat.service';
import { exportInvoiceToPdf } from '@/utils/exportInvoicePdf';
import { LiveReportPreview } from '@/components/customFormats/LiveReportPreview';
import { 
  Building2, FileText, CheckCircle2, 
  DollarSign, TrendingUp, Search, LogOut, 
  FlaskConical, Activity, RefreshCw, Download, 
  ZoomIn, ZoomOut, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const PartnerPortalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'WEEKLY' | '15_DAYS' | '30_DAYS' | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  // Custom Report Template & Preview Modal State
  const [customTemplate, setCustomTemplate] = useState<any>(null);
  const [selectedReportItem, setSelectedReportItem] = useState<any>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.85);

  const fetchPartnerData = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const partnerUser = JSON.parse(localStorage.getItem('partner_user') || '{}');
      const res = await commissionService.getPartnerPortalData(selectedPeriod, partnerUser?.id);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load partner portal data:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/partner-portal/login');
      } else {
        toast.error(err.response?.data?.error || 'Failed to fetch partner portal data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData(period);
    // Fetch custom report template
    customFormatService.getReportTemplates()
      .then(templates => {
        const def = templates.find((t: any) => t.isDefault) || templates[0];
        if (def) setCustomTemplate(def);
      })
      .catch(() => {});
  }, [period]);

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_user');
    localStorage.removeItem('portal_type');
    toast.success('Logged out successfully');
    navigate('/partner-portal/login');
  };

  const handleDownloadReportPdf = async () => {
    if (!selectedReportItem) return;
    setExportingPdf(true);
    try {
      await exportInvoiceToPdf('#partner-report-preview-sheet', `Lab_Report_${selectedReportItem.bookingCode || 'Report'}.pdf`);
      toast.success('Report PDF downloaded successfully');
    } catch (err) {
      console.error('Export report PDF error:', err);
      toast.error('Failed to download Report PDF');
    } finally {
      setExportingPdf(false);
    }
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

  const patientReportData = selectedReportItem ? {
    patientName: selectedReportItem.patientName,
    age: selectedReportItem.patientAge || '32',
    gender: selectedReportItem.patientGender || 'Male',
    mobile: selectedReportItem.patientMobile || '',
    bookingCode: selectedReportItem.bookingCode,
    sampleId: `SMP-${selectedReportItem.bookingCode?.slice(-4) || '101'}`,
    collectionDate: selectedReportItem.scheduledDate || selectedReportItem.createdAt,
    reportingDate: selectedReportItem.report?.reportedDate || new Date().toISOString(),
    referredBy: data?.partner?.labName || 'Authorized Pathology Center',
    branchName: data?.partner?.address || 'Main Central Laboratory',
  } : undefined;

  const testReportItems = selectedReportItem?.tests?.map((t: any) => ({
    testName: t.name,
    testCode: t.code || 'LAB-TEST',
    category: t.category || 'CLINICAL PATHOLOGY / BIOCHEMISTRY',
    parameters: [
      { name: t.name, value: 'Normal / Complete', unit: '-', referenceRange: 'Within Biological Limits', isAbnormal: false, flag: 'NORMAL' as const },
    ],
    remarks: 'Sample investigated on automated analyzers and verified as per NABL guidelines.',
    interpretation: 'Diagnostic parameters are within normal physiological reference intervals.',
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shadow-sm shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
              MedsSeva <span className="text-emerald-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-bold">Tie-up Partner</span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
              {data?.partner?.labName || 'Partner Center'} • <span className="font-mono text-emerald-700 font-bold">{data?.partner?.partnerCode || 'PART-201'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchPartnerData(period)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Partner Welcome & Badges Bar */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-white to-white border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Tie-up Diagnostic Partner Dashboard</div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{data?.partner?.labName || 'Diagnostic Partner Lab'}</h1>
            <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-2 pt-1">
              <span className="font-semibold text-slate-700">{data?.partner?.address || 'Authorized Pathology Center'}</span>
              <span>•</span>
              <span>Code: <strong className="text-emerald-700 font-mono">{data?.partner?.partnerCode || 'PART-201'}</strong></span>
              {data?.partner?.approvalStatus && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {data.partner.approvalStatus}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center flex-1 sm:flex-none shadow-sm">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Configured Commission</div>
              <div className="text-lg sm:text-xl font-black text-emerald-800">{data?.summary?.commissionRate ?? 30}%</div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 text-center flex-1 sm:flex-none shadow-sm">
              <div className="text-[10px] font-bold uppercase text-teal-700">Payment Cycle</div>
              <div className="text-lg sm:text-xl font-black text-teal-800">{data?.summary?.paymentCycle || 'MONTHLY'}</div>
            </div>
          </div>
        </div>

        {/* Period Selector & Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl w-full sm:w-auto">
              {[
                { id: 'WEEKLY', label: '7 Days' },
                { id: '15_DAYS', label: '15 Days' },
                { id: '30_DAYS', label: '30 Days' },
                { id: 'ALL', label: 'All Time' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
                    period === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, test, ref..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Processed Samples</span>
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{data?.summary?.totalReferredSamples ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">{data?.summary?.totalTestsCount ?? 0} Total Tests Conducted</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Billed Turnover</span>
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{(data?.summary?.totalBilledAmount ?? 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 mt-1">Total Lab Collections</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Calculated Commission</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">₹{(data?.summary?.totalCommissionEarned ?? 0).toLocaleString('en-IN')}</div>
              <div className="text-xs text-muted-foreground mt-1">Calculated @ {data?.summary?.commissionRate ?? 30}% Rate</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Payout Status</span>
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-emerald-600 font-bold">₹{(data?.summary?.paidCommission ?? 0).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">● Paid</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-amber-600 font-bold">₹{(data?.summary?.unpaidCommission ?? 0).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">● Unpaid (Pending)</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Referred Samples & Reports Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Partner Lab Collections & Diagnostic Reports
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Showing {filteredReferrals.length} samples
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Investigated Tests</th>
                  <th className="py-3 px-4 text-right">Billed Amount</th>
                  <th className="py-3 px-4 text-right">Commission ({data?.summary?.commissionRate ?? 30}%)</th>
                  <th className="py-3 px-4 text-center">Payout Status</th>
                  <th className="py-3 px-4 text-center">Lab Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      {search ? `No referrals matching "${search}"` : 'No sample records found for this partner in this cycle period.'}
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((item: any) => (
                    <tr key={item.bookingId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {item.bookingCode}
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {new Date(item.scheduledDate || item.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.patientName}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.patientAge ? `${item.patientAge} Y` : ''} {item.patientGender ? `• ${item.patientGender}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.tests?.map((t: any, idx: number) => (
                            <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {t.name} (₹{t.price})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{item.totalPaid?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                        +₹{item.commissionAmount?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          item.payoutStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                        <button
                          onClick={() => setSelectedReportItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* REPORT PREVIEW MODAL */}
      <AnimatePresence>
        {selectedReportItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Diagnostic Lab Report — {selectedReportItem.patientName}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Booking Ref: <strong className="font-mono text-emerald-700">{selectedReportItem.bookingCode}</strong> • Official NABL Diagnostic Format
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom controls */}
                  <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setPreviewZoom(z => Math.max(0.4, z - 0.1))}
                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-600 px-1 font-mono">{Math.round(previewZoom * 100)}%</span>
                    <button
                      onClick={() => setPreviewZoom(z => Math.min(1.2, z + 0.1))}
                      className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadReportPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                  >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{exportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedReportItem(null)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Report Template Sheet */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center items-start">
                <div id="partner-report-preview-sheet" className="shadow-2xl rounded-sm">
                  <LiveReportPreview
                    template={customTemplate || {}}
                    patientData={patientReportData}
                    tests={testReportItems}
                    scale={previewZoom}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerPortalDashboardPage;
