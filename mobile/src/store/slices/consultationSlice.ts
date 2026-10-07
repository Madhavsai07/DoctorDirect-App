/**
 * DoctorDirect – Consultation Slice (Milestone 7)
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Consultation,
  normalizeConsultation,
  RawConsultation,
  UpdateConsultationPayload,
} from '../../types/consultation';
import {
  completeConsultationApi,
  fetchConsultationByAppointmentApi,
  startOrGetConsultationApi,
  updateConsultationDraftApi,
} from '../../services/consultations/consultationService';
import { getApiErrorMessage } from '../../utils/apiError';

interface ConsultationState {
  activeConsultation: Consultation | null;
  isLoading: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  error: string | null;
  successMsg: string | null;
}

const initialState: ConsultationState = {
  activeConsultation: null,
  isLoading: false,
  isSaving: false,
  isCompleting: false,
  error: null,
  successMsg: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const startOrGetConsultation = createAsyncThunk(
  'consultation/startOrGet',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const res = await startOrGetConsultationApi(appointmentId);
      return normalizeConsultation(res.consultation as RawConsultation);
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to start the consultation. Please try again.'));
    }
  }
);

export const loadConsultationByAppointment = createAsyncThunk(
  'consultation/loadByAppointment',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const res = await fetchConsultationByAppointmentApi(appointmentId);
      return normalizeConsultation(res.consultation as RawConsultation);
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to load the consultation. Please try again.'));
    }
  }
);

export const saveConsultationDraft = createAsyncThunk(
  'consultation/saveDraft',
  async (
    payload: { id: string; data: UpdateConsultationPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await updateConsultationDraftApi(payload.id, payload.data);
      return normalizeConsultation(res.consultation as RawConsultation);
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to save the consultation draft. Please try again.'));
    }
  }
);

export const completeConsultation = createAsyncThunk(
  'consultation/complete',
  async (
    payload: { id: string; data?: UpdateConsultationPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await completeConsultationApi(payload.id, payload.data);
      return normalizeConsultation(res.consultation as RawConsultation);
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to complete the consultation. Please try again.'));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    clearConsultationState(state) {
      state.activeConsultation = null;
      state.isLoading = false;
      state.isSaving = false;
      state.isCompleting = false;
      state.error = null;
      state.successMsg = null;
    },
    clearConsultationError(state) {
      state.error = null;
    },
    clearSuccessMsg(state) {
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    // startOrGetConsultation
    builder
      .addCase(startOrGetConsultation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startOrGetConsultation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeConsultation = action.payload;
      })
      .addCase(startOrGetConsultation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // loadConsultationByAppointment
    builder
      .addCase(loadConsultationByAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadConsultationByAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeConsultation = action.payload;
      })
      .addCase(loadConsultationByAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // saveConsultationDraft
    builder
      .addCase(saveConsultationDraft.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveConsultationDraft.fulfilled, (state, action) => {
        state.isSaving = false;
        state.activeConsultation = action.payload;
        state.successMsg = 'Consultation draft saved successfully.';
      })
      .addCase(saveConsultationDraft.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // completeConsultation
    builder
      .addCase(completeConsultation.pending, (state) => {
        state.isCompleting = true;
        state.error = null;
      })
      .addCase(completeConsultation.fulfilled, (state, action) => {
        state.isCompleting = false;
        state.activeConsultation = action.payload;
        state.successMsg = 'Consultation finalized and appointment completed.';
      })
      .addCase(completeConsultation.rejected, (state, action) => {
        state.isCompleting = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearConsultationState,
  clearConsultationError,
  clearSuccessMsg,
} = consultationSlice.actions;

export default consultationSlice.reducer;
