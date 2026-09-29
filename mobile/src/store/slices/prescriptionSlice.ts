/**
 * DoctorDirect – Prescription Slice (Milestone 8)
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CreatePrescriptionPayload,
  normalizePrescription,
  Prescription,
  RawPrescription,
  UpdatePrescriptionPayload,
} from '../../types/prescription';
import {
  createPrescriptionApi,
  fetchPatientPrescriptionHistoryApi,
  fetchPrescriptionByConsultationApi,
  fetchPrescriptionByIdApi,
  finalizePrescriptionApi,
  updatePrescriptionDraftApi,
} from '../../services/prescription/prescriptionService';

interface PrescriptionState {
  activePrescription: Prescription | null;
  patientPrescriptions: Prescription[];
  isLoading: boolean;
  isSaving: boolean;
  isFinalizing: boolean;
  error: string | null;
  successMsg: string | null;
}

const initialState: PrescriptionState = {
  activePrescription: null,
  patientPrescriptions: [],
  isLoading: false,
  isSaving: false,
  isFinalizing: false,
  error: null,
  successMsg: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const createPrescription = createAsyncThunk(
  'prescription/create',
  async (payload: CreatePrescriptionPayload, { rejectWithValue }) => {
    try {
      const res = await createPrescriptionApi(payload);
      return normalizePrescription(res.prescription);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to create prescription draft'
      );
    }
  }
);

export const loadPrescriptionByConsultation = createAsyncThunk(
  'prescription/loadByConsultation',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const res = await fetchPrescriptionByConsultationApi(consultationId);
      if (!res.prescription) {
        return null;
      }
      return normalizePrescription(res.prescription);
    } catch (err: any) {
      // 404 simply means no prescription created yet for this consultation
      if (err?.response?.status === 404) {
        return null;
      }
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load prescription'
      );
    }
  }
);

export const loadPrescriptionById = createAsyncThunk(
  'prescription/loadById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await fetchPrescriptionByIdApi(id);
      return normalizePrescription(res.prescription);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load prescription'
      );
    }
  }
);

export const savePrescriptionDraft = createAsyncThunk(
  'prescription/saveDraft',
  async (
    payload: { id: string; data: UpdatePrescriptionPayload },
    { rejectWithValue }
  ) => {
    try {
      const res = await updatePrescriptionDraftApi(payload.id, payload.data);
      return normalizePrescription(res.prescription);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to update prescription draft'
      );
    }
  }
);

export const finalizePrescription = createAsyncThunk(
  'prescription/finalize',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await finalizePrescriptionApi(id);
      return normalizePrescription(res.prescription);
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to finalize prescription'
      );
    }
  }
);

export const loadPatientPrescriptions = createAsyncThunk(
  'prescription/loadPatientHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchPatientPrescriptionHistoryApi();
      return (res.prescriptions || []).map((p: RawPrescription) =>
        normalizePrescription(p)
      );
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.error || 'Failed to load prescription history'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const prescriptionSlice = createSlice({
  name: 'prescription',
  initialState,
  reducers: {
    clearPrescriptionState(state) {
      state.activePrescription = null;
      state.isLoading = false;
      state.isSaving = false;
      state.isFinalizing = false;
      state.error = null;
      state.successMsg = null;
    },
    clearPrescriptionError(state) {
      state.error = null;
    },
    clearPrescriptionSuccessMsg(state) {
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    // createPrescription
    builder
      .addCase(createPrescription.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(
        createPrescription.fulfilled,
        (state, action: PayloadAction<Prescription>) => {
          state.isSaving = false;
          state.activePrescription = action.payload;
          state.successMsg = 'Prescription draft created successfully';
        }
      )
      .addCase(createPrescription.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // loadPrescriptionByConsultation
    builder
      .addCase(loadPrescriptionByConsultation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loadPrescriptionByConsultation.fulfilled,
        (state, action: PayloadAction<Prescription | null>) => {
          state.isLoading = false;
          state.activePrescription = action.payload;
        }
      )
      .addCase(loadPrescriptionByConsultation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // loadPrescriptionById
    builder
      .addCase(loadPrescriptionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loadPrescriptionById.fulfilled,
        (state, action: PayloadAction<Prescription>) => {
          state.isLoading = false;
          state.activePrescription = action.payload;
        }
      )
      .addCase(loadPrescriptionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // savePrescriptionDraft
    builder
      .addCase(savePrescriptionDraft.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(
        savePrescriptionDraft.fulfilled,
        (state, action: PayloadAction<Prescription>) => {
          state.isSaving = false;
          state.activePrescription = action.payload;
          state.successMsg = 'Prescription draft updated successfully';
        }
      )
      .addCase(savePrescriptionDraft.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // finalizePrescription
    builder
      .addCase(finalizePrescription.pending, (state) => {
        state.isFinalizing = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(
        finalizePrescription.fulfilled,
        (state, action: PayloadAction<Prescription>) => {
          state.isFinalizing = false;
          state.activePrescription = action.payload;
          state.successMsg = 'Prescription finalized and signed';
        }
      )
      .addCase(finalizePrescription.rejected, (state, action) => {
        state.isFinalizing = false;
        state.error = action.payload as string;
      });

    // loadPatientPrescriptions
    builder
      .addCase(loadPatientPrescriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loadPatientPrescriptions.fulfilled,
        (state, action: PayloadAction<Prescription[]>) => {
          state.isLoading = false;
          state.patientPrescriptions = action.payload;
        }
      )
      .addCase(loadPatientPrescriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearPrescriptionState,
  clearPrescriptionError,
  clearPrescriptionSuccessMsg,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;
