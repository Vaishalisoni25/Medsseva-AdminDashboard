import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { API_URL } from '@/services/api';
import { 
  CheckCircle2, AlertTriangle, Loader2, FileText, 
  LogIn, ArrowLeft, ShieldCheck, Calendar, Activity, Building2, User, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface ReportVerificationData {
  verified: boolean;
  reportId: string;
  bookingCode: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  doctorQualification: string;
  doctorDesignation: string;
  status: string;
  reportedDate: string;
  branchName: string;
  branchCity?: string;
  tests: string[];
  pdfUrl?: string | null;
}

export const VerifyReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportVerificationData | null>(null);

  useEffect(() => {
    const verifyReport = async () => {
      if (!reportId) {
        setError('Invalid lab report link.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_URL}/reports/${reportId}/verify`);
        setData(res.data);
      } catch (err: any) {
        console.error('[Report Verification Error]', err);
        setError(err.response?.data?.error || 'Failed to verify lab report. The report ID may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyReport();
  }, [reportId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-teal-500/20 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b py-4 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg">M</span>
          <span className="font-extrabold text-teal-800 tracking-tight">MedsSeva <span className="text-teal-600 text-xs font-normal">Diagnostic LIMS</span></span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors"
        >
          <LogIn className="w-4 h-4" /> Staff / Admin Login
        </button>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {loading ? (
            <div className="bg-white rounded-2xl border p-8 shadow-md flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-600">Verifying diagnostic report authenticity...</p>
            </div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border p-8 shadow-md text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Report Verification Failed</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{error}</p>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </motion.div>
          ) : data ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border shadow-xl overflow-hidden"
            >
              {/* Green Verified Header */}
              <div className="bg-gradient-to-tr from-teal-800 to-teal-600 text-white p-6 text-center relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/5 blur-xl" />
                <div className="absolute -bottom-16 -right-12 w-32 h-32 rounded-full bg-white/5 blur-xl" />
                
                <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-white/20 flex items-center justify-center text-teal-100 mx-auto mb-3 shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-extrabold tracking-wide uppercase">Official Diagnostic Report</h2>
                <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">Authenticity Validated & Certified ✅</p>
              </div>

              {/* Report Details Body */}
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs border-b pb-2">
                    <span className="font-semibold text-slate-400">LAB REPORT ID</span>
                    <span className="font-mono font-bold text-slate-800">{data.reportId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b pb-2">
                    <span className="font-semibold text-slate-400">BOOKING CODE</span>
                    <span className="font-mono font-bold text-slate-800">{data.bookingCode || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">REPORT STATUS</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px] uppercase">
                      ● {data.status}
                    </span>
                  </div>
                </div>

                {/* Patient & Pathologist Info */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</div>
                      <div className="text-sm font-bold text-slate-800">
                        {data.patientName} {data.patientAge ? `(${data.patientAge} Y / ${data.patientGender || 'Unspecified'})` : ''}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-semibold">(Masked for privacy compliance)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investigated Tests / Panels</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {data.tests && data.tests.length > 0 ? (
                          data.tests.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 border text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-slate-800">Diagnostic Pathology</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Validating Pathologist</div>
                      <div className="text-sm font-bold text-slate-800">{data.doctorName}</div>
                      <div className="text-xs text-slate-500 font-medium">{data.doctorQualification} — {data.doctorDesignation}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported Date & Time</div>
                      <div className="text-sm font-semibold text-slate-800">
                        {data.reportedDate ? new Date(data.reportedDate).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        }) : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processing Laboratory</div>
                      <div className="text-sm font-semibold text-slate-800">{data.branchName}</div>
                      {data.branchCity && <div className="text-xs text-slate-400 font-medium">{data.branchCity}</div>}
                    </div>
                  </div>
                </div>

                {/* Authorized Actions */}
                <div className="pt-4 border-t space-y-3">
                  {data.pdfUrl ? (
                    <a 
                      href={data.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/10 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" /> Download Official PDF Report
                    </a>
                  ) : currentUser ? (
                    <div className="text-center p-3 bg-teal-50 border border-teal-100 rounded-xl text-[11px] text-teal-800 font-medium leading-relaxed">
                      ✅ Authenticated as {currentUser.name} ({currentUser.role}). Report is validated.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-slate-50 border rounded-xl text-[11px] text-slate-500 font-medium leading-normal">
                        To access raw numerical parameter values or download historical records, please sign in to the patient or doctor portal.
                      </div>
                      <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-4 h-4" /> Sign In to Portal
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => navigate('/')}
                    className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        © {new Date().getFullYear()} MedsSeva Diagnostics Group • ISO 15189 & NABL Accredited Laboratory Network
      </footer>
    </div>
  );
};

export default VerifyReportPage;
