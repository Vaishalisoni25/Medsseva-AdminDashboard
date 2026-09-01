import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { couponService } from '../../services/api';

interface Coupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  expiresAt?: string;
  startsAt?: string;
  isActive: boolean;
  isFirstOrderOnly: boolean;
  _count?: { redemptions: number };
  createdAt: string;
}

interface CouponAnalytics {
  total: number;
  active: number;
  expired: number;
  inactive: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  topCoupons: { code: string; usedCount: number; name?: string }[];
}

interface CouponState {
  coupons: Coupon[];
  analytics: CouponAnalytics | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CouponState = {
  coupons: [],
  analytics: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchCoupons = createAsyncThunk('coupons/fetchAll', async (_, { rejectWithValue }) => {
  try { return await couponService.getAll(); }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to fetch coupons'); }
});

export const fetchCouponAnalytics = createAsyncThunk('coupons/fetchAnalytics', async (_, { rejectWithValue }) => {
  try { return await couponService.getAnalytics(); }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to fetch analytics'); }
});

export const createCouponThunk = createAsyncThunk('coupons/create', async (data: any, { rejectWithValue }) => {
  try { return await couponService.create(data); }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to create coupon'); }
});

export const updateCouponThunk = createAsyncThunk('coupons/update', async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
  try { return await couponService.update(id, data); }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to update coupon'); }
});

export const toggleCouponThunk = createAsyncThunk('coupons/toggle', async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
  try { return await couponService.toggleStatus(id, isActive); }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to toggle coupon'); }
});

export const deleteCouponThunk = createAsyncThunk('coupons/delete', async (id: string, { rejectWithValue }) => {
  try { await couponService.delete(id); return id; }
  catch (e: any) { return rejectWithValue(e.response?.data?.error || 'Failed to delete coupon'); }
});

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: { clearCouponError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCoupons.fulfilled, (state, action) => { state.loading = false; state.coupons = action.payload; })
      .addCase(fetchCoupons.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchCouponAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(createCouponThunk.pending, (state) => { state.saving = true; })
      .addCase(createCouponThunk.fulfilled, (state, action) => { state.saving = false; state.coupons.unshift(action.payload); })
      .addCase(createCouponThunk.rejected, (state, action) => { state.saving = false; state.error = action.payload as string; })
      .addCase(updateCouponThunk.fulfilled, (state, action) => {
        const idx = state.coupons.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.coupons[idx] = action.payload;
      })
      .addCase(toggleCouponThunk.fulfilled, (state, action) => {
        const idx = state.coupons.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.coupons[idx] = action.payload;
      })
      .addCase(deleteCouponThunk.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter(c => c.id !== action.payload);
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;