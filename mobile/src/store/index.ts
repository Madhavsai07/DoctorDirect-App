import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import doctorReducer from './slices/doctorSlice';
import appointmentReducer from './slices/appointmentSlice';
import consultationReducer from './slices/consultationSlice';
import prescriptionReducer from './slices/prescriptionSlice';
import notificationReducer from './slices/notificationSlice';
import adminReducer from './slices/adminSlice';

/**
 * DoctorDirect Redux Store
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctor: doctorReducer,
    appointment: appointmentReducer,
    consultation: consultationReducer,
    prescription: prescriptionReducer,
    notification: notificationReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
