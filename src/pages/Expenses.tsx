import React, { useEffect, useState } from 'react';
import {
  Receipt, Plus, Search, Filter, RefreshCw, Calendar,
  DollarSign, TrendingDown, Trash2, Edit2, X, Check,
  AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight,
  FileText, CreditCard, Building2, Tag, Layers, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService } from '../services/api';

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  referenceNo?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  vendorName?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; name: string; email?: string } | null;
  createdAt: string;
}

interface ExpenseSummary {
  todayTotal: number;
  monthTotal: number;
  yearTotal: number;
  allTimeTotal: number;
  totalCount: number;
  categoryBreakdown: { category: string; totalAmount: number; count: number }[];
}

const CATEGORY_MAP: Record<string, { label: string; color: string; border: string }> = {
  LAB_REAGENTS: { label: 'Lab Reagents & Chemicals', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  EQUIPMENT_MAINTENANCE: { label: 'Equipment & Calibration', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  STAFF_SALARY: { label: 'Staff Salary & Wages', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  UTILITIES: { label: 'Electricity & Utilities', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  RENT: { label: 'Lab Facility & Rent', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  OFFICE_SUPPLIES: { label: 'Office & Stationery', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  MARKETING: { label: 'Marketing & Promotion', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  LOGISTICS: { label: 'Sample Transport & Logistics', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  MISCELLANEOUS: { label: 'Miscellaneous / Other', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

const getCategoryMeta = (cat: string) => {
  if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
  return {
    label: cat,
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  };
};

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash' },
  { id: 'UPI', label: 'UPI / QR' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
  { id: 'CHEQUE', label: 'Cheque' },
  { id: 'CREDIT_CARD', label: 'Credit / Debit Card' },
];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    todayTotal: 0,
    monthTotal: 0,
    yearTotal: 0,
    allTimeTotal: 0,
    totalCount: 0,
    categoryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | 'TODAY' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LAB_REAGENTS');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [vendorName, setVendorName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        expenseService.getExpenses({
          search: search || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          paymentMethod: selectedPaymentMethod !== 'ALL' ? selectedPaymentMethod : undefined,
          period: selectedPeriod !== 'ALL' ? selectedPeriod : undefined,
        }),
        expenseService.getExpenseSummary(),
      ]);

      if (expRes?.expenses) setExpenses(expRes.expenses);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      console.error('Failed to load expenses data:', err);
      toast.error('Failed to load expense records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedPaymentMethod, selectedPeriod]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('LAB_REAGENTS');
    setCustomCategory('');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setVendorName('');
    setReferenceNo('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    if (CATEGORY_MAP[exp.category] && exp.category !== 'MISCELLANEOUS') {
      setCategory(exp.category);
      setCustomCategory('');
    } else {
      setCategory('MISCELLANEOUS');
      setCustomCategory(exp.category === 'MISCELLANEOUS' ? '' : exp.category);
    }
    setAmount(exp.amount.toString());
    setExpenseDate(new Date(exp.expenseDate).toISOString().split('T')[0]);
    setPaymentMethod(exp.paymentMethod || 'CASH');
    setVendorName(exp.vendorName || '');
    setReferenceNo(exp.referenceNo || '');
    setNotes(exp.notes || '');
    setModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid title and amount.');
      return;
    }

    if (category === 'MISCELLANEOUS' && !customCategory.trim()) {
      toast.error('Please specify the other category name.');
      return;
    }

    setSaving(true);
    try {
      const finalCategory = category === 'MISCELLANEOUS'
        ? (customCategory.trim() || 'MISCELLANEOUS')
        : category;

      const payload = {
        title: title.trim(),
        category: finalCategory,
        amount: parseFloat(amount),
        expenseDate,
        paymentMethod,
        vendorName: vendorName.trim() || undefined,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await expenseService.createExpense(payload);
        toast.success('Expense recorded successfully');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save expense:', err);
      toast.error(err?.response?.data?.error || 'Failed to save expense record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setDeleting(true);
    try {
      await expenseService.deleteExpense(id);
      toast.success('Expense deleted successfully');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      toast.error('Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Laboratory Expenses & Outflows</h1>
            <p className="text-xs text-muted-foreground">Record, categorize, and monitor daily laboratory operating expenses & reagent costs.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Expenses</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₹{summary.todayTotal?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Daily Outflow Today</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">This Month's Total</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            ₹{summary.monthTotal?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Current Month Expenses</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">This Year's Total</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            ₹{summary.yearTotal?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">Annual Outflow Total</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">All-Time Total</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            ₹{summary.allTimeTotal?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-medium">{summary.totalCount || 0} Total Records</div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN STRIP */}
      {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-rose-500" /> Category-Wise Expenditure Breakdown
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {summary.categoryBreakdown.map((item) => {
              const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.MISCELLANEOUS;
              return (
                <div
                  key={item.category}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${meta.color} ${meta.border}`}
                >
                  <span>{meta.label}</span>
                  <span className="font-mono font-black">₹{item.totalAmount?.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] opacity-75 font-normal">({item.count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, vendor, invoice ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none focus:border-rose-500"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_MAP).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>

          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none focus:border-rose-500"
          >
            <option value="ALL">All Payment Modes</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.label}</option>
            ))}
          </select>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs font-bold">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODAY', label: 'Today' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'THIS_YEAR', label: 'This Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* EXPENSES TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3.5 px-4 font-bold">Date & Title</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Vendor / Payee</th>
                <th className="py-3.5 px-4 font-bold">Payment Mode</th>
                <th className="py-3.5 px-4 font-bold">Ref / Invoice No</th>
                <th className="py-3.5 px-4 font-bold text-right">Amount (₹)</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-rose-500" /> Loading expense records...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-muted-foreground/40" />
                    <div>No expense entries found matching your filters.</div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const meta = getCategoryMeta(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{exp.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                          {exp.notes && ` • ${exp.notes}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.color} ${meta.border}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {exp.vendorName || <span className="text-muted-foreground italic">—</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted border border-border text-[10px] font-bold text-foreground">
                          {PAYMENT_METHODS.find(p => p.id === exp.paymentMethod)?.label || exp.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        {exp.referenceNo || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono text-sm">
                        ₹{exp.amount?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                {editingExpense ? 'Edit Laboratory Expense' : 'Record Laboratory Expense'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expense Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CBC Reagents Batch #220"
                  required
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-rose-500"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-rose-600 font-mono outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Conditional Custom Category Input when Miscellaneous/Other is selected */}
              {category === 'MISCELLANEOUS' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Specify Other Category Name *
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Lab Sanitization, Bio-Waste Disposal, Software AMC"
                    required={category === 'MISCELLANEOUS'}
                    className="w-full px-3.5 py-2 bg-background border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground outline-none focus:border-rose-500"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>{pm.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. MedPlus Medical Supplies"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Invoice / Receipt Ref No</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. INV-2026-908"
                    className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs font-mono text-foreground outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes & Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details or purpose of this expenditure..."
                  className="w-full px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-md shadow-rose-600/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Delete Expense Record?</h3>
              <p className="text-xs text-muted-foreground mt-1">This action cannot be undone. This expense will be removed from accounts.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExpense(deleteConfirmId)}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
