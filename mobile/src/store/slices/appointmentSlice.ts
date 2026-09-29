/**
 * DoctorDirect – Appointment Slice (Milestone 6)
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Appointment,
  AppointmentStatus,
  normalizeAppointment,
  RawAppointment,
} from '../../types/appointment';
import {
  bookSlotApi,
  cancelAppointmentApi,
  confirmAppointmentApi,
  fetchDoctorAppointmentsApi,
  fetchPatientAppointmentsApi,
  rescheduleAppointmentApi,
  updateAppointmentStatusApi,
} from '../../services/appointments/appointmentService';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppointmentState {
  patientAppointments: Appointment[];
  doctorAppointments: Appointment[];
  isLoadingPatient: boolean;
  isLoadingDoctor: boolean;
  isBooking: boolean;
  isActioning: boolean; // confirm / cancel / reschedule
  error: string | null;
  actionError: string | null;
}

const initialState: AppointmentState = {
  patientAppointments: [],
  doctorAppointments: [],
  isLoadingPatient: false,
  isLoadingDoctor: false,
  isBooking: false,
  isActioning: false,
  error: null,
  actionError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loadPatientAppointments = createAsyncThunk(
  'appointment/loadPatient',
  async (status: 'upcoming' | 'past' | 'all' = 'all', { rejectWithValue }) => {
    try {
      const res = await fetchPatientAppointmentsApi(status);
      return res.appointments.map(normalizeAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load appointments');
    }
  }
);

export const loadDoctorAppointments = createAsyncThunk(
  'appointment/loadDoctor',
  async (status: 'upcoming' | 'past' | 'today' | 'all' = 'all', { rejectWithValue }) => {
    try {
      const res = await fetchDoctorAppointmentsApi(status);
      return res.appointments.map(normalizeAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load appointments');
    }
  }
);

export const bookSlot = createAsyncThunk(
  'appointment/bookSlot',
  async (
    payload: { slot_id: string; reason_for_visit?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await bookSlotApi(payload);
      return normalizeAppointment(res.appointment as RawAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Booking failed');
    }
  }
);

export const confirmAppointment = createAsyncThunk(
  'appointment/confirm',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const res = await confirmAppointmentApi(appointmentId);
      return normalizeAppointment(res.appointment as RawAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Confirmation failed');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointment/cancel',
  async (
    payload: { appointmentId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await cancelAppointmentApi(payload.appointmentId, payload.reason);
      return normalizeAppointment(res.appointment as RawAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Cancellation failed');
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointment/reschedule',
  async (
    payload: { appointmentId: string; new_slot_id: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await rescheduleAppointmentApi(payload.appointmentId, payload.new_slot_id);
      return normalizeAppointment(res.appointment as RawAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Reschedule failed');
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointment/updateStatus',
  async (
    payload: { appointmentId: string; status: AppointmentStatus; cancellation_reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await updateAppointmentStatusApi(
        payload.appointmentId,
        payload.status,
        payload.cancellation_reason
      );
      return normalizeAppointment(res.appointment as RawAppointment);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error || 'Status update failed');
    }
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function upsertInList(list: Appointment[], updated: Appointment): Appointment[] {
  const idx = list.findIndex((a) => a.id === updated.id);
  if (idx === -1) return [updated, ...list];
  const copy = [...list];
  copy[idx] = updated;
  return copy;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    clearActionError(state) {
      state.actionError = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // loadPatientAppointments
    builder
      .addCase(loadPatientAppointments.pending, (state) => {
        state.isLoadingPatient = true;
        state.error = null;
      })
      .addCase(loadPatientAppointments.fulfilled, (state, action) => {
        state.isLoadingPatient = false;
        state.patientAppointments = action.payload;
      })
      .addCase(loadPatientAppointments.rejected, (state, action) => {
        state.isLoadingPatient = false;
        state.error = action.payload as string;
      });

    // loadDoctorAppointments
    builder
      .addCase(loadDoctorAppointments.pending, (state) => {
        state.isLoadingDoctor = true;
        state.error = null;
      })
      .addCase(loadDoctorAppointments.fulfilled, (state, action) => {
        state.isLoadingDoctor = false;
        state.doctorAppointments = action.payload;
      })
      .addCase(loadDoctorAppointments.rejected, (state, action) => {
        state.isLoadingDoctor = false;
        state.error = action.payload as string;
      });

    // bookSlot
    builder
      .addCase(bookSlot.pending, (state) => {
        state.isBooking = true;
        state.actionError = null;
      })
      .addCase(bookSlot.fulfilled, (state, action) => {
        state.isBooking = false;
        state.patientAppointments = upsertInList(state.patientAppointments, action.payload);
      })
      .addCase(bookSlot.rejected, (state, action) => {
        state.isBooking = false;
        state.actionError = action.payload as string;
      });

    // confirmAppointment / cancelAppointment / rescheduleAppointment / updateAppointmentStatus
    const actionThunks = [confirmAppointment, cancelAppointment, rescheduleAppointment, updateAppointmentStatus];
    actionThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.isActioning = true;
          state.actionError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.isActioning = false;
          const updated = action.payload;
          state.patientAppointments = upsertInList(state.patientAppointments, updated);
          state.doctorAppointments = upsertInList(state.doctorAppointments, updated);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isActioning = false;
          state.actionError = action.payload as string;
        });
    });
  },
});

export const { clearActionError, clearError } = appointmentSlice.actions;
export default appointmentSlice.reducer;
