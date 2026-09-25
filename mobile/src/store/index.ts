import { configureStore } from '@reduxjs/toolkit';

/**
 * DoctorDirect Redux store — Milestone 1 foundation.
 *
 * No business-logic slices are added here yet.
 * Feature slices (auth, appointments, doctors, consultations, sync, etc.)
 * will be added incrementally in their respective milestones.
 */
export const store = configureStore({
  reducer: {
    // slices will be added here in later milestones
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
