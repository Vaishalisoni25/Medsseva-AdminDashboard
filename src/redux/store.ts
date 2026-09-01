import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import testReducer from './slices/testSlice';
import reportReducer from './slices/reportSlice';
import financeReducer from './slices/financeSlice';
import couponReducer from './slices/couponSlice';
import cmsReducer from './slices/cmsSlice';
import inventoryReducer from './slices/inventorySlice';
import crmReducer from './slices/crmSlice';
import simulationReducer from './slices/simulationSlice';
import branchReducer from './slices/branchSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  bookings: bookingReducer,
  tests: testReducer,
  reports: reportReducer,
finance: financeReducer,
coupons: couponReducer,
  cms: cmsReducer,
  inventory: inventoryReducer,
  crm: crmReducer,
 simulation: simulationReducer,
  branches: branchReducer,
});

const persistConfig = {
  key: 'lms_admin_persist_v4',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
