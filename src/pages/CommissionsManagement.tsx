import React, { useState, useEffect } from 'react';
import { commissionService } from '@/services/api';
import { 
  Stethoscope, Building2, DollarSign, 
  Settings, CheckCircle2, Search, Edit3, X, Loader2, RefreshCw,
  TrendingUp, Users, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const CommissionsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DOCTORS' | 'PARTNERS'>('DOCTORS');
  const [period, setPeriod] = useState<'WEEKLY' | '15_DAYS' | '30_DAYS' | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ doctors: [], partners: [], recentCommissions: [] });
  const [search, setSearch] = useState('');

  // Edit Commission Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editRate, setEditRate] = useState<number>(30);
  const [editCycle, setEditCycle] = useState<string>('MONTHLY');
  const [editCode, setEditCode] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchCommissions = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      const res = await commissionService.getAdminCommissions(selectedPeriod);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin commissions:', err);
      toast.error('Failed to load commissions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions(period);
  }, [period]);

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditRate(item.commissionRate ?? 30);
    setEditCycle(item.paymentCycle || 'MONTHLY');
    setEditCode(item.code || '');
  };

  const handleSaveConfig = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await commissionService.updateConfig(editingItem.entityType, editingItem.id, {
        commissionRate: editRate,
        paymentCycle: editCycle,
        code: editCode,
      });
      toast.success('Commission settings updated successfully');
      setEditingItem(null);
      fetchCommissions(period);
    } catch (err: any) {
      console.error('Failed to update config:', err);
      toast.error('Failed to update commission settings.');
    } finally {
      setSaving(false);
    }
  };

  const list = activeTab === 'DOCTORS' ? data.doctors : data.partners;
  const filteredList = list.filter((item: any) => {
    const q = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.code?.toLowerCase().includes(q) ||
      item.specialization?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = list.reduce((acc: number, curr: any) => acc + (curr.totalRevenue || 0), 0);
  const totalCommission = list.reduce((acc: number, curr: any) => acc + (curr.totalCommission || 0), 0);
  const totalSamples = list.reduce((acc: number, curr: any) => acc + (curr.totalSamples || 0), 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-primary" /> Referral & Commission Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage doctor & partner commission rates, payment cycles, and payout records.
          </p>
        </div>

        <button
          onClick={() => fetchCommissions(period)}
          className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Referrals</div>
          <div className="text-2xl font-black text-foreground">{totalSamples} Samples</div>
          <div className="text-xs text-muted-foreground mt-1">Across all registered {activeTab.toLowerCase()}</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Referral Revenue</div>
          <div className="text-2xl font-black text-foreground">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Diagnostic Turnover</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Commissions</div>
          <div className="text-2xl font-black text-emerald-600">₹{totalCommission.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted-foreground mt-1">Payable across {activeTab.toLowerCase()}</div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'DOCTORS' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctor Portals ({data.doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'PARTNERS' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4" /> Tie-up Partners ({data.partners.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl text-xs">
            {[
              { id: 'WEEKLY', label: 'Weekly' },
              { id: '15_DAYS', label: '15 Days' },
              { id: '30_DAYS', label: '30 Days' },
              { id: 'ALL', label: 'All Time' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  period === tab.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-card border border-input rounded-xl text-xs outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">{activeTab === 'DOCTORS' ? 'Doctor Name' : 'Partner Lab'}</th>
                <th className="py-3 px-4">Specialization / Role</th>
                <th className="py-3 px-4 text-center">Commission %</th>
                <th className="py-3 px-4 text-center">Payment Cycle</th>
                <th className="py-3 px-4 text-right">Referral Samples</th>
                <th className="py-3 px-4 text-right">Calculated Commission</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    No {activeTab.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                filteredList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {item.code}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {item.name}
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {item.branchName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.specialization || item.qualification || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                        {item.commissionRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {item.paymentCycle}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">
                      {item.totalSamples}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                      ₹{item.totalCommission?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1 rounded-lg border border-border hover:bg-muted text-xs font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" /> Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Commission Modal */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-50" onClick={() => setEditingItem(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-2xl z-[60] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" /> Configure Commission ({editingItem.name})
                </h3>
                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Portal Code</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-input rounded-xl text-sm outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Commission Percentage (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editRate}
                      onChange={e => setEditRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-card border border-input rounded-xl text-sm outline-none focus:border-primary font-bold"
                    />
                    <span className="font-bold text-muted-foreground">%</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {[15, 20, 25, 30, 35, 40].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditRate(val)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          editRate === val ? 'bg-primary text-white border-primary' : 'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Cycle</label>
                  <select
                    value={editCycle}
                    onChange={e => setEditCycle(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-input rounded-xl text-sm outline-none focus:border-primary font-semibold"
                  >
                    <option value="WEEKLY">Weekly (7 Days)</option>
                    <option value="15_DAYS">15 Days (Fortnightly)</option>
                    <option value="MONTHLY">Monthly (30 Days)</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-border">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
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

export default CommissionsManagementPage;
