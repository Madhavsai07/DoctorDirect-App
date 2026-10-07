import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchSpecializations,
  fetchDoctors,
  fetchDoctorProfile,
  fetchDoctorSlots,
  fetchMyAvailability,
  addAvailabilityWindow,
  updateAvailabilityWindow,
  removeAvailabilityWindow,
  fetchMySlots,
  generateMySlots,
  fetchMyScheduleOverrides,
  saveMyScheduleOverride,
  deleteMyScheduleOverride,
  updateMySlot,
} from '../../services/doctors/doctorService';
import {
  Doctor,
  Specialization,
  Availability,
  Slot,
  ScheduleOverride,
  normalizeDoctor,
  normalizeAvailability,
  normalizeSlot,
} from '../../types/doctor';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

interface DoctorState {
  // Patient-facing
  specializations: Specialization[];
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  doctorSlots: Slot[];

  // Doctor-facing
  myAvailability: Availability[];
  mySlots: Slot[];
  myScheduleOverrides: ScheduleOverride[];

  // UI
  isLoadingList: boolean;
  isLoadingProfile: boolean;
  isLoadingAvailability: boolean;
  isLoadingSlots: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  specializations: [],
  doctors: [],
  selectedDoctor: null,
  doctorSlots: [],
  myAvailability: [],
  mySlots: [],
  myScheduleOverrides: [],
  isLoadingList: false,
  isLoadingProfile: false,
  isLoadingAvailability: false,
  isLoadingSlots: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────────────────────

export const loadSpecializations = createAsyncThunk(
  'doctor/loadSpecializations',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSpecializations();
      return data.specializations.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
      })) as Specialization[];
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load specializations');
    }
  }
);

export const loadDoctors = createAsyncThunk(
  'doctor/loadDoctors',
  async (
    params: { search?: string; specialization_id?: string; limit?: number; offset?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchDoctors(params);
      return data.doctors.map(normalizeDoctor);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load doctors');
    }
  }
);

export const loadDoctorProfile = createAsyncThunk(
  'doctor/loadDoctorProfile',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const data = await fetchDoctorProfile(doctorId);
      return normalizeDoctor(data.doctor);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load doctor profile');
    }
  }
);

export const loadDoctorSlots = createAsyncThunk(
  'doctor/loadDoctorSlots',
  async (
    { doctorId, fromDate, toDate }: { doctorId: string; fromDate: string; toDate: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchDoctorSlots(doctorId, fromDate, toDate);
      return data.slots.map(normalizeSlot);
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load slots');
    }
  }
);

// ── Doctor-facing thunks ──────────────────────────────────────────────────────

export const loadMyAvailability = createAsyncThunk(
  'doctor/loadMyAvailability',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchMyAvailability();
      return data.availability.map(normalizeAvailability);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to load availability');
    }
  }
);

export const addAvailability = createAsyncThunk(
  'doctor/addAvailability',
  async (
    dto: { day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number; is_active?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await addAvailabilityWindow(dto);
      return normalizeAvailability(data.availability as unknown as Parameters<typeof normalizeAvailability>[0]);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to add availability');
    }
  }
);

export const updateAvailability = createAsyncThunk(
  'doctor/updateAvailability',
  async (
    { id, dto }: { id: string; dto: Partial<{ day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number; is_active: boolean }> },
    { rejectWithValue }
  ) => {
    try {
      const data = await updateAvailabilityWindow(id, dto);
      return normalizeAvailability(data.availability as unknown as Parameters<typeof normalizeAvailability>[0]);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to update availability');
    }
  }
);

export const removeAvailability = createAsyncThunk(
  'doctor/removeAvailability',
  async (availabilityId: string, { rejectWithValue }) => {
    try {
      await removeAvailabilityWindow(availabilityId);
      return availabilityId;
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to remove availability');
    }
  }
);

export const loadMySlots = createAsyncThunk(
  'doctor/loadMySlots',
  async ({ fromDate, toDate }: { fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      const data = await generateMySlots(fromDate, toDate);
      return data.slots.map(normalizeSlot);
    } catch {
      try {
        const data = await fetchMySlots(fromDate, toDate);
        return data.slots.map(normalizeSlot);
      } catch (e2: unknown) {
        return rejectWithValue(e2 instanceof Error ? e2.message : 'Failed to load my slots');
      }
    }
  }
);

export const loadMyScheduleOverrides = createAsyncThunk(
  'doctor/loadMyScheduleOverrides',
  async ({ fromDate, toDate }: { fromDate: string; toDate: string }, { rejectWithValue }) => {
    try {
      return await fetchMyScheduleOverrides(fromDate, toDate);
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load date overrides');
    }
  }
);

export const saveScheduleOverride = createAsyncThunk(
  'doctor/saveScheduleOverride',
  async (
    payload: { date: string; is_blocked: boolean; windows: Array<{ start_time: string; end_time: string; slot_duration_minutes: number }> },
    { rejectWithValue }
  ) => {
    try {
      await saveMyScheduleOverride(payload);
      return payload.date;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save date override');
    }
  }
);

export const clearScheduleOverride = createAsyncThunk(
  'doctor/clearScheduleOverride',
  async (date: string, { rejectWithValue }) => {
    try {
      await deleteMyScheduleOverride(date);
      return date;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to restore weekly schedule');
    }
  }
);

export const changeMySlot = createAsyncThunk(
  'doctor/changeMySlot',
  async (
    payload: { slotId: string; action: 'edit' | 'block' | 'restore'; start_time?: string; end_time?: string },
    { rejectWithValue }
  ) => {
    try {
      return normalizeSlot(await updateMySlot(payload));
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update slot');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────

export const doctorSlice = createSlice({
  name: 'doctor',
  initialState,
  reducers: {
    clearDoctorState() {
      return initialState;
    },
    clearSelectedDoctor(state) {
      state.selectedDoctor = null;
      state.doctorSlots = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Specializations
    builder
      .addCase(loadSpecializations.fulfilled, (state, a) => { state.specializations = a.payload; })

    // Doctor list
      .addCase(loadDoctors.pending, (state) => { state.isLoadingList = true; state.error = null; })
      .addCase(loadDoctors.fulfilled, (state, a) => { state.isLoadingList = false; state.doctors = a.payload; })
      .addCase(loadDoctors.rejected, (state, a) => { state.isLoadingList = false; state.error = a.payload as string; })

    // Doctor profile
      .addCase(loadDoctorProfile.pending, (state) => { state.isLoadingProfile = true; state.error = null; })
      .addCase(loadDoctorProfile.fulfilled, (state, a) => { state.isLoadingProfile = false; state.selectedDoctor = a.payload; })
      .addCase(loadDoctorProfile.rejected, (state, a) => { state.isLoadingProfile = false; state.error = a.payload as string; })

    // Doctor slots (patient view)
      .addCase(loadDoctorSlots.pending, (state) => { state.isLoadingSlots = true; })
      .addCase(loadDoctorSlots.fulfilled, (state, a) => { state.isLoadingSlots = false; state.doctorSlots = a.payload; })
      .addCase(loadDoctorSlots.rejected, (state, a) => { state.isLoadingSlots = false; state.error = a.payload as string; })

    // My availability
      .addCase(loadMyAvailability.pending, (state) => { state.isLoadingAvailability = true; state.error = null; })
      .addCase(loadMyAvailability.fulfilled, (state, a) => { state.isLoadingAvailability = false; state.myAvailability = a.payload; })
      .addCase(loadMyAvailability.rejected, (state, a) => { state.isLoadingAvailability = false; state.error = a.payload as string; })

      .addCase(addAvailability.fulfilled, (state, a) => { state.myAvailability.push(a.payload); })
      .addCase(updateAvailability.fulfilled, (state, a) => {
        const idx = state.myAvailability.findIndex((av) => av.id === a.payload.id);
        if (idx >= 0) state.myAvailability[idx] = a.payload;
      })
      .addCase(removeAvailability.fulfilled, (state, a) => {
        state.myAvailability = state.myAvailability.filter((av) => av.id !== a.payload);
      })

    // My slots
      .addCase(loadMySlots.pending, (state) => { state.isLoadingSlots = true; })
      .addCase(loadMySlots.fulfilled, (state, a) => { state.isLoadingSlots = false; state.mySlots = a.payload; })
      .addCase(loadMySlots.rejected, (state, a) => { state.isLoadingSlots = false; state.error = a.payload as string; })

      .addCase(loadMyScheduleOverrides.fulfilled, (state, a) => { state.myScheduleOverrides = a.payload; })
      .addCase(changeMySlot.fulfilled, (state, a) => {
        const index = state.mySlots.findIndex((slot) => slot.id === a.payload.id);
        if (index >= 0) state.mySlots[index] = a.payload;
      });
  },
});

export const { clearDoctorState } = doctorSlice.actions;

export const { clearSelectedDoctor, clearError } = doctorSlice.actions;
export default doctorSlice.reducer;
