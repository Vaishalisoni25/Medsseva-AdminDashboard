import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'CartUpdate' | 'TechnicianGPS' | 'NewLead' | 'BookingTick';
  message: string;
  severity: 'info' | 'warning' | 'success';
  meta?: any;
}

export interface PhlebotomistTracker {
  id: string;
  name: string;
  currentTaskCode: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  speedKmHr: number;
  lastContact: string;
}

interface SimulationState {
  isRunning: boolean;
  eventsFeed: LiveEvent[];
  liveCartCount: number;
  activeCheckoutsCount: number;
  phlebotomists: PhlebotomistTracker[];
  serverCpuUsage: number;
  apiSuccessRate: number;
}

// Base center near Gurugram / Delhi
const BASE_LAT = 28.4595;
const BASE_LNG = 77.0266;

const INITIAL_PHLEBOTOMISTS: PhlebotomistTracker[] = [
  { id: 'u-5', name: 'Vikram Singh', currentTaskCode: 'LMS-583910', lat: BASE_LAT + 0.005, lng: BASE_LNG - 0.003, batteryLevel: 88, speedKmHr: 12, lastContact: new Date().toISOString() },
  { id: 'u-phlebo-2', name: 'Rahul Sharma', currentTaskCode: 'LMS-294751', lat: BASE_LAT - 0.012, lng: BASE_LNG + 0.008, batteryLevel: 64, speedKmHr: 28, lastContact: new Date().toISOString() }
];

const initialState: SimulationState = {
  isRunning: true,
  eventsFeed: [
    { id: 'ev-init', timestamp: new Date().toISOString(), type: 'BookingTick', message: 'Realtime LIMS socket stream initialized successfully.', severity: 'success' }
  ],
  liveCartCount: 14,
  activeCheckoutsCount: 3,
  phlebotomists: INITIAL_PHLEBOTOMISTS,
  serverCpuUsage: 24,
  apiSuccessRate: 99.95
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    toggleSimulation: (state) => {
      state.isRunning = !state.isRunning;
    },
    tickSimulation: (state) => {
      if (!state.isRunning) return;

      // 1. Vary server telemetry
      state.serverCpuUsage = Math.round(20 + Math.random() * 35);
      state.apiSuccessRate = Math.round((99.8 + Math.random() * 0.2) * 100) / 100;

      // 2. Vary cart simulations randomly
      const dCart = Math.random() > 0.5 ? 1 : -1;
      state.liveCartCount = Math.max(2, state.liveCartCount + dCart);
      
      if (Math.random() > 0.7) {
        const dCheck = Math.random() > 0.5 ? 1 : -1;
        state.activeCheckoutsCount = Math.max(0, state.activeCheckoutsCount + dCheck);
      }

      // 3. Jitter active phlebotomist coordinates for movement simulation
      state.phlebotomists = state.phlebotomists.map(p => {
        const deltaLat = (Math.random() - 0.5) * 0.0008;
        const deltaLng = (Math.random() - 0.5) * 0.0008;
        return {
          ...p,
          lat: p.lat + deltaLat,
          lng: p.lng + deltaLng,
          speedKmHr: Math.round(5 + Math.random() * 35),
          batteryLevel: Math.max(1, p.batteryLevel - 0.1),
          lastContact: new Date().toISOString()
        };
      });

      // 4. Create a randomized live feed event trigger
      const rand = Math.random();
      let newEvent: LiveEvent | null = null;

      if (rand < 0.2) {
        newEvent = {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'CartUpdate',
          message: `Anonymous user in Mumbai added 'Comprehensive Diabetes Care' to cart`,
          severity: 'info'
        };
      } else if (rand < 0.4) {
        const tech = state.phlebotomists[0];
        newEvent = {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'TechnicianGPS',
          message: `Phlebotomist ${tech.name} moving at ${tech.speedKmHr} km/h near Accession Node`,
          severity: 'info'
        };
      } else if (rand < 0.5) {
        newEvent = {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'NewLead',
          message: `Urgent callback request queued for '+91 98******22'`,
          severity: 'warning'
        };
      }

      if (newEvent) {
        state.eventsFeed.unshift(newEvent);
        if (state.eventsFeed.length > 30) {
          state.eventsFeed.pop(); // Keep memory low
        }
      }
    },
    forceAddEvent: (state, action: PayloadAction<Omit<LiveEvent, 'id' | 'timestamp'>>) => {
      state.eventsFeed.unshift({
        ...action.payload,
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }
  }
});

export const { toggleSimulation, tickSimulation, forceAddEvent } = simulationSlice.actions;
export default simulationSlice.reducer;
