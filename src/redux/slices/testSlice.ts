import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MedicalTest, MedicalPackage } from '../../types';
import { testService, packageService } from '../../services/api';

interface TestState {
  tests: MedicalTest[];
  packages: MedicalPackage[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TestState = {
  tests: [],
  packages: [],
  status: 'idle',
  error: null,
};

export const fetchPackages = createAsyncThunk('tests/fetchPackages', async () => {
  const response = await packageService.getAllPackages();
  return response;
});

function normalizeReferenceRanges(raw: unknown): Array<{
  gender: 'MALE' | 'FEMALE' | 'ANY';
  minAge: number;
  maxAge: number;
  minRange: number;
  maxRange: number;
}> {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return [raw as any];
  return [];
}

function normalizeParameters(params: unknown): any[] {
  if (!Array.isArray(params)) return [];
  return params.map((p: any) => ({
    ...p,
    referenceRanges: normalizeReferenceRanges(p.referenceRanges),
  }));
}

export const fetchTests = createAsyncThunk('tests/fetchTests', async () => {
  const response = await testService.getAllTests();
  return response;
});
export const updateTest = createAsyncThunk('tests/updateTest', async ({ id, ...data }: any) => {
  const response = await testService.updateTest(id, data);
  return response;
});

export const addTest = createAsyncThunk('tests/addTest', async (test: any) => {
  const { id, ...testData } = test;
  const response = await testService.createTest(testData);
  return response;
});

// Using upsertTest for backwards compatibility with UI components
const testSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    upsertTest: (state, action: PayloadAction<MedicalTest>) => {
      // Local optimistic update
      const idx = state.tests.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) {
        state.tests[idx] = action.payload;
      } else {
        state.tests.push(action.payload);
      }
    },
    deleteTest: (state, action: PayloadAction<string>) => {
      // Optimistic delete
      state.tests = state.tests.filter(t => t.id !== action.payload);
    },
    upsertPackage: (state, action: PayloadAction<MedicalPackage>) => {
      const idx = state.packages.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.packages[idx] = action.payload;
      } else {
        state.packages.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTests.pending, (state) => {
        state.status = 'loading';
      })
.addCase(fetchTests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tests = action.payload.map((t: any) => ({
          ...t,
          code: t.id,
          category:
            t.category && typeof t.category === 'object'
              ? t.category.id
              : t.categoryId ?? t.category,
          reportTimeHours: parseInt(t.reportTime) || 24,
          sampleType: t.sampleType || 'Blood (EDTA Tube)',
          status: t.isActive ? 'active' : 'inactive',
          parameters: normalizeParameters(t.parameters),
        }));
      })
.addCase(updateTest.fulfilled, (state, action) => {
        const updated = {
          ...action.payload,
          code: action.payload.id,
          category: action.payload.categoryId || (action.payload.category && typeof action.payload.category === 'object' ? action.payload.category.id : action.payload.category),
          reportTimeHours: parseInt(action.payload.reportTime) || 24,
          sampleType: action.payload.sampleType || 'Blood (EDTA Tube)',
          status: action.payload.isActive ? 'active' : 'inactive',
          parameters: normalizeParameters(action.payload.parameters),
        };
        const idx = state.tests.findIndex(t => t.id === updated.id);
        if (idx !== -1) state.tests[idx] = updated;
      })
      .addCase(addTest.fulfilled, (state, action) => {
        const newTest = {
          ...action.payload,
          code: action.payload.id,
          category: action.payload.categoryId || (action.payload.category && typeof action.payload.category === 'object' ? action.payload.category.id : action.payload.category),
          reportTimeHours: parseInt(action.payload.reportTime) || 24,
          sampleType: 'Blood (EDTA Tube)'
        };
        const idx = state.tests.findIndex(t => t.id === newTest.id);
        if (idx !== -1) {
          state.tests[idx] = newTest;
        } else {
          state.tests.push(newTest);
        }
      })
    .addCase(fetchTests.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch tests';
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.packages = action.payload.map((pkg: any) => ({
          id: pkg.id,
          code: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.oldPrice || pkg.price,
          discountedPrice: pkg.price,
          testIds: pkg.testsIncluded?.map((pt: any) => pt.testId) ?? [],
          status: pkg.isActive ? 'active' : 'inactive',
        }));
      });
  }
});

export const { upsertTest, deleteTest, upsertPackage } = testSlice.actions;
export default testSlice.reducer;
