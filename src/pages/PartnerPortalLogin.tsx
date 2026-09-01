import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/services/api';
import { Building2, Lock, Key, ArrowRight, Loader2, ShieldCheck, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export const PartnerPortalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [partnerCode, setPartnerCode] = useState('PART-201');
  const [password, setPassword] = useState('Partner123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCode || !password) {
      toast.error('Please enter Partner Code / Login ID and Password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/partner/login`, {
        partnerCode,
        password,
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('partner_user', JSON.stringify(res.data.partner));
        localStorage.setItem('portal_type', 'PARTNER');
        toast.success(`Welcome ${res.data.partner.labName}`);
        navigate('/partner-portal/dashboard');
      }
    } catch (err: any) {
      console.error('Partner login failed:', err);
      toast.error(err.response?.data?.error || 'Invalid partner credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-emerald-500/20 font-sans relative overflow-hidden text-slate-100">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">M</span>
          <span className="font-extrabold text-white tracking-tight">MedsSeva <span className="text-emerald-400 text-xs font-normal">Tie-up Partner Portal</span></span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition-all"
        >
          Staff Login
        </button>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <FlaskConical className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Tie-up Partner Portal</h1>
            <p className="text-xs text-slate-400">Diagnostic tie-up lab sample collection, reports & commission payouts</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Partner Code / Login ID</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. PART-201 or Login ID"
                  value={partnerCode}
                  onChange={e => setPartnerCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter your partner password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In to Partner Portal <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 text-center">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Demo Partner Credentials:</div>
            <div className="text-xs font-mono text-emerald-400">
              Code: <span className="font-bold text-white">PART-201</span> • Pass: <span className="font-bold text-white">Partner123</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-500 font-medium z-10">
        © {new Date().getFullYear()} MedsSeva Diagnostics Group • Tie-up Laboratory Network
      </footer>
    </div>
  );
};

export default PartnerPortalLoginPage;
