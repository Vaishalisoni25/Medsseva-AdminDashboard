import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { branchService, Branch, BranchFormData } from '../../services/branch.service';

interface BranchState {
  branches: Branch[];
  loading: boolean;
  error: string | null;
}

const initialState: BranchState = {
  branches: [],
  loading: false,
  error: null,
};

export const fetchBranches = createAsyncThunk('branches/fetchAll', async () => {
  const res = await branchService.getAll();
  return res.data;
});

export const createBranch = createAsyncThunk('branches/create', async (data: BranchFormData) => {
  const res = await branchService.create(data);
  return res.data;
});

export const updateBranch = createAsyncThunk(
  'branches/update',
  async ({ id, data }: { id: string; data: Partial<BranchFormData> }) => {
    const res = await branchService.update(id, data);
    return res.data;
  }
);

export const deleteBranch = createAsyncThunk('branches/delete', async (id: string) => {
  await branchService.delete(id);
  return id;
});

export const toggleBranchStatus = createAsyncThunk(
  'branches/toggleStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const res = await branchService.toggleStatus(id, isActive);
    return res.data;
  }
);

const branchSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBranches.fulfilled, (state, action) => { state.loading = false; state.branches = action.payload; })
      .addCase(fetchBranches.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(createBranch.fulfilled, (state, action) => { state.branches.unshift(action.payload); })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const idx = state.branches.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.branches[idx] = action.payload;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.branches = state.branches.filter(b => b.id !== action.payload);
      })
      .addCase(toggleBranchStatus.fulfilled, (state, action) => {
        const idx = state.branches.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.branches[idx] = action.payload;
      });
  },
});

export default branchSlice.reducer;