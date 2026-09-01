import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  itemType: string;
  supplierId?: string;
  supplier?: { name: string };
  manufacturer?: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  maxCapacity?: number;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  purchaseCost?: number;
  branchId?: string;
  stockStatus: string;
  createdAt: string;
}

interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  inventoryItem?: { name: string; sku: string; unit: string };
  transactionType: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  referenceNumber?: string;
  remarks?: string;
  performedById?: string;
  branchId?: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  isActive: boolean;
}

interface InventoryAnalytics {
  total: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
  expiringSoon: number;
  expiringIn60: number;
  totalValue: number;
  mostConsumed: any[];
}

interface InventoryState {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  suppliers: Supplier[];
  analytics: InventoryAnalytics | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  transactions: [],
  suppliers: [],
  analytics: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchInventoryItems = createAsyncThunk('inventory/fetchItems', async (params: any = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/inventory${query ? '?' + query : ''}`);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to fetch inventory');
  }
});

export const fetchTransactions = createAsyncThunk('inventory/fetchTransactions', async (params: any = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/inventory/transactions${query ? '?' + query : ''}`);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to fetch transactions');
  }
});

export const fetchSuppliers = createAsyncThunk('inventory/fetchSuppliers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/inventory/suppliers');
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to fetch suppliers');
  }
});

export const fetchAnalytics = createAsyncThunk('inventory/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/inventory/analytics');
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to fetch analytics');
  }
});

export const createInventoryItem = createAsyncThunk('inventory/createItem', async (data: any, { rejectWithValue }) => {
  try {
    const res = await api.post('/inventory', data);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Failed to create item');
  }
});

export const recordStockIn = createAsyncThunk('inventory/stockIn', async (data: any, { rejectWithValue }) => {
  try {
    const res = await api.post('/inventory/stock-in', data);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Stock in failed');
  }
});

export const recordStockOut = createAsyncThunk('inventory/stockOut', async (data: any, { rejectWithValue }) => {
  try {
    const res = await api.post('/inventory/stock-out', data);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Stock out failed');
  }
});

export const recordAdjustment = createAsyncThunk('inventory/adjustment', async (data: any, { rejectWithValue }) => {
  try {
    const res = await api.post('/inventory/adjustment', data);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Adjustment failed');
  }
});

export const recordTransfer = createAsyncThunk('inventory/transfer', async (data: any, { rejectWithValue }) => {
  try {
    const res = await api.post('/inventory/transfer', data);
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.error || 'Transfer failed');
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryItems.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchInventoryItems.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchTransactions.fulfilled, (state, action) => { state.transactions = action.payload; })
      .addCase(fetchSuppliers.fulfilled, (state, action) => { state.suppliers = action.payload; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(createInventoryItem.pending, (state) => { state.saving = true; })
      .addCase(createInventoryItem.fulfilled, (state, action) => { state.saving = false; state.items.unshift(action.payload); })
      .addCase(createInventoryItem.rejected, (state, action) => { state.saving = false; state.error = action.payload as string; })
      .addCase(recordStockIn.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(recordStockOut.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(recordAdjustment.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      });
  },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;