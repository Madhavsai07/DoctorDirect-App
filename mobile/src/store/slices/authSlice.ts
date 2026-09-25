import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, AuthUser, UserRole } from '../../types/auth';
import { authService } from '../../services/auth';

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  devBypassActive: false,
};

/**
 * Async thunk for development login.
 */
export const devLogin = createAsyncThunk<AuthUser, 'patient' | 'doctor', { rejectValue: string }>(
  'auth/devLogin',
  async (role, { rejectWithValue }) => {
    try {
      const user = await authService.devLogin(role);
      return user;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk for logout.
 */
export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.error = null;
      state.devBypassActive = true;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // devLogin
      .addCase(devLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(devLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.devBypassActive = true;
        state.error = null;
      })
      .addCase(devLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to log in';
      })
      // logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.devBypassActive = false;
        state.error = null;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
