import React, { useState, useEffect } from 'react';
import { useCouponsQuery, useCouponAnalyticsQuery } from '@/hooks/useAdminQueries';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import {
  fetchCoupons,
  fetchCouponAnalytics,
  createCouponThunk,
  toggleCouponThunk,
  deleteCouponThunk,
} from '../redux/slices/couponSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Ticket, Calendar, Users, ToggleLeft, ToggleRight, X, Save, Loader2, Trash2,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast, ConfirmDialog } from '../components/Toast';

export const CouponsPage: React.FC = () => {  
  const dispatch = useAppDispatch();
const couponState = useAppSelector(state => state.coupons);
const coupons = couponState?.coupons ?? [];
const analytics = couponState?.analytics ?? null;
const loading = couponState?.loading ?? false;
const saving = couponState?.saving ?? false;
const error = couponState?.error ?? null;
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string } | null>(null);
  const { success, error: toastError } = useToast();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [expiry, setExpiry] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(false);

 useCouponsQuery();
  useCouponAnalyticsQuery();

  useEffect(() => {
    if (error) toastError(error);
  }, [error]);

  const resetForm = () => {
    setCode(''); setName(''); setDescription(''); setDiscountValue('');
    setMinOrder(''); setMaxDiscount(''); setUsageLimit(''); setPerUserLimit('1');
    setExpiry(''); setStartsAt(''); setIsFirstOrderOnly(false);
    setDiscountType('PERCENTAGE');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiry) {
      toastError('Please fill all required fields.');
      return;
    }

    const result = await dispatch(createCouponThunk({
      code, name, description, discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrder ? parseFloat(minOrder) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      perUserLimit: parseInt(perUserLimit) || 1,
      expiresAt: expiry,
      startsAt: startsAt || undefined,
      isFirstOrderOnly,
    }));

    if (createCouponThunk.fulfilled.match(result)) {
      success(`Coupon ${code.toUpperCase()} deployed successfully.`);
      setIsDrawerOpen(false);
      resetForm();
      dispatch(fetchCouponAnalytics());
    } else {
      toastError(result.payload as string || 'Failed to create coupon');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await dispatch(toggleCouponThunk({ id, isActive: !currentStatus }));
    if (toggleCouponThunk.fulfilled.match(result)) {
      success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}.`);
    }
  };

const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, code } = confirmDelete;
    setConfirmDelete(null);
    const result = await dispatch(deleteCouponThunk(id));
    if (deleteCouponThunk.fulfilled.match(result)) {
      success(`Coupon ${code} deleted.`);
      dispatch(fetchCouponAnalytics());
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketing Coupons & Promo Engine</h1>
          <p className="text-sm text-muted-foreground">Draft, manage, and deploy algorithmic discount triggers to optimize patient onboarding.</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="px-4 py-2 bg-primary text-white hover:bg-primary/90 font-black text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Launch Coupon
        </button>
      </div>
{loading && !analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
              <div className="h-2.5 bg-muted rounded w-24" />
              <div className="h-7 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Coupons', value: analytics.total },
            { label: 'Active', value: analytics.active },
            { label: 'Expired', value: analytics.expired },
            { label: 'Total Discount Given', value: `₹${(analytics.totalDiscountGiven || 0).toLocaleString('en-IN')}` },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl font-black text-foreground mt-1">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

  {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border-2 border-dashed border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border" />
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-7 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2.5 bg-muted rounded w-28 mt-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-7 w-7 bg-muted rounded" />
                    <div className="h-8 w-8 bg-muted rounded" />
                  </div>
                </div>
                <div className="border-t border-dashed border-border pt-4 space-y-2.5">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 bg-muted rounded w-20" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <motion.div
              layout
              key={coupon.id}
              className={cn(
                "bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all border-dashed border-2",
                coupon.isActive ? "border-primary/40" : "border-border opacity-60"
              )}
            >
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border-r border-dashed border-border z-10" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border-l border-dashed border-border z-10" />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="bg-primary/10 text-primary font-mono font-black tracking-widest border border-primary/30 rounded px-3 py-1 text-sm inline-block">
                      {coupon.code}
                    </div>
                    {coupon.name && <div className="text-xs text-foreground font-semibold pt-0.5">{coupon.name}</div>}
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                      <Users className="h-3 w-3" /> Applied by {coupon._count?.redemptions || coupon.usedCount} users
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                <button
                      onClick={() => setConfirmDelete({ id: coupon.id, code: coupon.code })}
                      className="p-1 text-muted-foreground hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleToggleStatus(coupon.id, coupon.isActive)} className="hover:scale-110 transition-transform">
                      {coupon.isActive ? (
                        <ToggleRight className="h-8 w-8 text-primary" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5" /> Rebate Offer
                    </span>
                    <span className="text-foreground">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                    </span>
                  </div>
                  {coupon.maxDiscount && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Max Discount</span>
                      <span className="font-bold text-foreground">₹{coupon.maxDiscount}</span>
                    </div>
                  )}
                  {coupon.minOrderAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Minimum Order</span>
                      <span className="font-bold text-foreground">₹{coupon.minOrderAmount}</span>
                    </div>
                  )}
                  {coupon.isFirstOrderOnly && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Eligibility</span>
                      <span className="font-bold text-amber-600">First Order Only</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Valid Until
                    </span>
                    <span className="font-bold text-rose-600">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN') : 'No Expiry'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

  <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete coupon "${confirmDelete?.code}"?`}
        description="This action cannot be undone. The coupon will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border bg-card flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" /> Design Coupon Code
                  </h2>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Promo Code (Uppercase) *</label>
                  <input required type="text" placeholder="e.g. SUMMERSAVE50"
                    className="w-full p-2 border border-input rounded text-sm uppercase font-mono font-bold"
                    value={code} onChange={(e) => setCode(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">Coupon Name</label>
                  <input type="text" placeholder="e.g. Summer Sale 2026"
                    className="w-full p-2 border border-input rounded text-sm"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">Description</label>
                  <textarea placeholder="Short description for patients..."
                    className="w-full p-2 border border-input rounded text-sm resize-none" rows={2}
                    value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">Discount Methodology *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setDiscountType('PERCENTAGE')}
                      className={cn("py-2 rounded border text-xs font-bold",
                        discountType === 'PERCENTAGE' ? "bg-primary text-white border-primary" : "bg-card border-border")}>
                      Percentage (%)
                    </button>
                    <button type="button" onClick={() => setDiscountType('FIXED')}
                      className={cn("py-2 rounded border text-xs font-bold",
                        discountType === 'FIXED' ? "bg-primary text-white border-primary" : "bg-card border-border")}>
                      Fixed Currency (₹)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">Discount Magnitude *</label>
                  <input required type="number" placeholder={discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 150'}
                    className="w-full p-2 border border-input rounded text-sm font-bold"
                    value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Min Cart Value</label>
                    <input type="number" placeholder="e.g. 500"
                      className="w-full p-2 border border-input rounded text-sm"
                      value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Max Discount (₹)</label>
                    <input type="number" placeholder="e.g. 300"
                      className="w-full p-2 border border-input rounded text-sm"
                      value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Total Usage Limit</label>
                    <input type="number" placeholder="e.g. 100"
                      className="w-full p-2 border border-input rounded text-sm"
                      value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Per User Limit</label>
                    <input type="number" placeholder="e.g. 1"
                      className="w-full p-2 border border-input rounded text-sm"
                      value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Start Date</label>
                    <input type="date" className="w-full p-2 border border-input rounded text-sm"
                      value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Expiry Date *</label>
                    <input required type="date" className="w-full p-2 border border-input rounded text-sm"
                      value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <input type="checkbox" id="firstOrder" checked={isFirstOrderOnly}
                    onChange={(e) => setIsFirstOrderOnly(e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <label htmlFor="firstOrder" className="text-xs font-bold cursor-pointer">First Order Only</label>
                </div>

                <div className="flex justify-end gap-2 pt-6 border-t border-border">
                  <button type="button" onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="px-6 py-2 bg-primary text-white hover:bg-primary/90 font-black text-xs rounded-lg flex items-center gap-1 disabled:opacity-50">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Deploy Coupon
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};