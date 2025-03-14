// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../../types/auth';
import authService from '../../services/auth-service';
import { getAccessToken, getRefreshToken } from '../../utils/token';
import jwtDecode from 'jwt-decode';

// Initial state
const initialState: AuthState = {
  user: null,
  token: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getAccessToken(),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      return await authService.register(credentials);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getUserProfile();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates: Partial<User>, { rejectWithValue }) => {
    try {
      return await authService.updateUserProfile(updates);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    restoreSession: (state) => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            state.token = token;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.user = {
              id: decoded.userId,
              email: decoded.email,
              name: decoded.name || '',
              role: decoded.role || 'user',
            };
          }
        } catch {
          // Invalid token
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    });

    // Get User Profile
    builder.addCase(getUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(getUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update User Profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, restoreSession } = authSlice.actions;
export default authSlice.reducer;