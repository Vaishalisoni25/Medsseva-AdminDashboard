import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/services/api';
import { Building2, Lock, Mail, ArrowRight, Loader2, ShieldCheck, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

export const PartnerPortalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your Partner Email Address and Password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/partner/login`, {
        email: email.trim(),
        identifier: email.trim(),
        password,
      });

      if (res.data.token) {
        localStorage.setItem('partner_token', res.data.token);
        localStorage.setItem('partner_user', JSON.stringify(res.data.partner));
        localStorage.setItem('portal_type', 'PARTNER');
        toast.success(`Welcome ${res.data.partner.labName}`);
        navigate('/partner-portal/dashboard');
      }
    } catch (err: any) {
      console.error('Partner login failed:', err);
      toast.error(err.response?.data?.error || 'Invalid partner email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500/20 relative overflow-hidden">
      {/* Soft Ambient Background Highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between z-10 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <span className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/20">
            M
          </span>
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
            MedsSeva <span className="text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">Tie-up Partner Portal</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all shadow-sm"
        >
          Staff / Admin Login
        </button>
      </header>

      {/* Main Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <FlaskConical className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tie-up Partner Sign In</h1>
            <p className="text-xs text-slate-500 font-medium">Access your diagnostic lab referrals, investigations & 30% commission payouts</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Partner Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. labpartner@medsseva.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter your partner password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5">
            <div className="text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure Isolated Portal
            </div>
            <div className="text-[10px] text-slate-500">
              Partners only have access to their own assigned lab collections and earnings
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-400 font-medium z-10">
        © {new Date().getFullYear()} MedsSeva Diagnostics Group • Tie-up Laboratory Network
      </footer>
    </div>
  );
};

export default PartnerPortalLoginPage;
