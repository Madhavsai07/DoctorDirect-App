import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthBundle, AuthState, LoginCredentials, RegistrationPayload, RegistrationResult } from '../../types/auth';
import { authService } from '../../services/auth';
import { clearDoctorState } from './doctorSlice';
import { clearAppointmentState } from './appointmentSlice';
import { clearConsultationState } from './consultationSlice';
import { clearPrescriptionState } from './prescriptionSlice';
import { clearNotifications } from './notificationSlice';
import { clearAdminState } from './adminSlice';

const initialState: AuthState = {
  supabaseUser: null,
  user: null,
  role: null,
  verificationStatus: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

function clearAccountData(dispatch: (action: { type: string }) => unknown) {
  dispatch(clearDoctorState());
  dispatch(clearAppointmentState());
  dispatch(clearConsultationState());
  dispatch(clearPrescriptionState());
  dispatch(clearNotifications());
  dispatch(clearAdminState());
}

export const initializeAuth = createAsyncThunk<AuthBundle | null, void, { rejectValue: string }>(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try { return await authService.restoreSession(); }
    catch (error) { return rejectWithValue(authService.mapError(error)); }
  }
);

export const loginUser = createAsyncThunk<AuthBundle, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const bundle = await authService.signIn(credentials);
      clearAccountData(dispatch);
      return bundle;
    } catch (error) { return rejectWithValue(authService.mapError(error)); }
  }
);

export const registerUser = createAsyncThunk<RegistrationResult, { registration: RegistrationPayload; credentials: LoginCredentials }, { rejectValue: string }>(
  'auth/register',
  async ({ registration, credentials }, { dispatch, rejectWithValue }) => {
    try {
      const result = await authService.signUp(registration, credentials);
      if (result.bundle) clearAccountData(dispatch);
      return result;
    } catch (error) { return rejectWithValue(authService.mapError(error)); }
  }
);

export const refreshCurrentUser = createAsyncThunk<AuthBundle | null, void, { rejectValue: string }>(
  'auth/refreshCurrentUser',
  async (_, { rejectWithValue }) => {
    try { return await authService.restoreSession(); }
    catch (error) { return rejectWithValue(authService.mapError(error)); }
  }
);

/**
 * Async thunk for logout.
 */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authService.logout();
    } catch {
      // Ignore network / supabase error during logout
    } finally {
      clearAccountData(dispatch);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEnded() {
      return { ...initialState, isInitialized: true };
    },
    setAuthBundle(state, action: PayloadAction<AuthBundle>) {
      state.supabaseUser = action.payload.identity;
      state.user = action.payload.user;
      state.role = action.payload.user.role;
      state.verificationStatus = action.payload.user.verificationStatus ?? null;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.supabaseUser = action.payload.identity;
          state.user = action.payload.user;
          state.role = action.payload.user.role;
          state.verificationStatus = action.payload.user.verificationStatus ?? null;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload ?? 'Unable to restore your session.';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.supabaseUser = action.payload.identity;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.verificationStatus = action.payload.user.verificationStatus ?? null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Unable to sign in.';
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.bundle) {
          state.supabaseUser = action.payload.bundle.identity;
          state.user = action.payload.bundle.user;
          state.role = action.payload.bundle.user.role;
          state.verificationStatus = action.payload.bundle.user.verificationStatus ?? null;
          state.isAuthenticated = true;
          state.isInitialized = true;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Unable to create your account.';
      })
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.supabaseUser = action.payload.identity;
          state.user = action.payload.user;
          state.role = action.payload.user.role;
          state.verificationStatus = action.payload.user.verificationStatus ?? null;
          state.isAuthenticated = true;
        } else {
          state.supabaseUser = null;
          state.user = null;
          state.role = null;
          state.verificationStatus = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(logoutUser.pending, (state) => {
        state.supabaseUser = null;
        state.user = null;
        state.role = null;
        state.verificationStatus = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.supabaseUser = null;
        state.user = null;
        state.role = null;
        state.verificationStatus = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.supabaseUser = null;
        state.user = null;
        state.role = null;
        state.verificationStatus = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { sessionEnded, setAuthBundle, clearError } = authSlice.actions;
export default authSlice.reducer;
