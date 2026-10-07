import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  adminService,
  AdminDoctor,
  VerificationStatus,
  StatusCounts,
} from '../../services/admin/adminService';
import { getApiErrorMessage } from '../../utils/apiError';

export interface AdminState {
  doctors: AdminDoctor[];
  selectedFilter: VerificationStatus | 'all';
  searchQuery: string;
  counts: StatusCounts;
  selectedDoctor: AdminDoctor | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  actionSuccessMessage: string | null;
}

const initialState: AdminState = {
  doctors: [],
  selectedFilter: 'pending',
  searchQuery: '',
  counts: {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  },
  selectedDoctor: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionSuccessMessage: null,
};

export const fetchAdminDoctors = createAsyncThunk(
  'admin/fetchDoctors',
  async (
    params: { status?: VerificationStatus | 'all'; search?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const statusParam = params?.status === 'all' ? undefined : params?.status;
      const [listResult, countsResult] = await Promise.all([
        adminService.listDoctors({
          status: statusParam,
          search: params?.search,
        }),
        adminService.getStatusCounts(),
      ]);

      return {
        doctors: listResult.doctors,
        counts: countsResult,
      };
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to load the doctor list. Please try again.'));
    }
  }
);

export const fetchDoctorDetail = createAsyncThunk(
  'admin/fetchDoctorDetail',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const doctor = await adminService.getDoctorDetail(doctorId);
      return doctor;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to load doctor details. Please try again.'));
    }
  }
);

export const approveDoctorAction = createAsyncThunk(
  'admin/approveDoctor',
  async (doctorId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await adminService.approveDoctor(doctorId);
      // Auto-refresh list and counts
      const state = getState() as { admin: AdminState };
      dispatch(
        fetchAdminDoctors({
          status: state.admin.selectedFilter,
          search: state.admin.searchQuery,
        })
      );
      return res;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to approve this doctor. Please try again.'));
    }
  }
);

export const rejectDoctorAction = createAsyncThunk(
  'admin/rejectDoctor',
  async (doctorId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await adminService.rejectDoctor(doctorId);
      // Auto-refresh list and counts
      const state = getState() as { admin: AdminState };
      dispatch(
        fetchAdminDoctors({
          status: state.admin.selectedFilter,
          search: state.admin.searchQuery,
        })
      );
      return res;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Unable to reject this doctor. Please try again.'));
    }
  }
);

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedFilter(state, action: PayloadAction<VerificationStatus | 'all'>) {
      state.selectedFilter = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    clearActionMessage(state) {
      state.actionSuccessMessage = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearSelectedDoctor(state) {
      state.selectedDoctor = null;
    },
    clearAdminState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchAdminDoctors
    builder
      .addCase(fetchAdminDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload.doctors;
        state.counts = action.payload.counts;
      })
      .addCase(fetchAdminDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Could not load doctors';
      });

    // fetchDoctorDetail
    builder
      .addCase(fetchDoctorDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedDoctor = null;
      })
      .addCase(fetchDoctorDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedDoctor = action.payload;
      })
      .addCase(fetchDoctorDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.selectedDoctor = null;
        state.error = (action.payload as string) || 'Could not load doctor detail';
      });

    // approveDoctorAction
    builder
      .addCase(approveDoctorAction.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
        state.actionSuccessMessage = null;
      })
      .addCase(approveDoctorAction.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.actionSuccessMessage = action.payload.message || 'Doctor approved successfully.';
        if (state.selectedDoctor && state.selectedDoctor.doctor_id === action.payload.doctor.doctor_id) {
          state.selectedDoctor = action.payload.doctor;
        }
      })
      .addCase(approveDoctorAction.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = (action.payload as string) || 'Failed to approve doctor';
      });

    // rejectDoctorAction
    builder
      .addCase(rejectDoctorAction.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
        state.actionSuccessMessage = null;
      })
      .addCase(rejectDoctorAction.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.actionSuccessMessage = action.payload.message || 'Doctor rejected.';
        if (state.selectedDoctor && state.selectedDoctor.doctor_id === action.payload.doctor.doctor_id) {
          state.selectedDoctor = action.payload.doctor;
        }
      })
      .addCase(rejectDoctorAction.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = (action.payload as string) || 'Failed to reject doctor';
      });
  },
});

export const {
  setSelectedFilter,
  setSearchQuery,
  clearActionMessage,
  clearError,
  clearSelectedDoctor,
  clearAdminState,
} = adminSlice.actions;

export default adminSlice.reducer;
