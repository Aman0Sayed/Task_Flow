import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean | null;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  user: User;
  token: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const initializeAuth = createAsyncThunk<
  { user: User; token: string } | null,
  void,
  { rejectValue: string }
>('auth/initializeAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null; // No token, user is not authenticated
    }

    // Verify token with backend
    const res = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      user: res.data.data,
      token,
    };
  } catch (error: any) {
    // Token is invalid, remove it
    localStorage.removeItem('token');
    return rejectWithValue('Invalid token');
  }
});

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false, // No auto-check on startup
  error: null,
  isAuthenticated: false, // Start as not authenticated
};

// For local development, use localhost. For production use the Vercel backend URL.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterPayload,
  { rejectValue: string }
>('auth/registerUser', async (body, { rejectWithValue }) => {
  try {
    const res = await axios.post<RegisterResponse>(
      `${BASE_URL}/api/auth/register`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'An error occurred');
  }
});

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const res = await axios.post<LoginResponse>(
      `${BASE_URL}/api/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error: any) {
    if (!error.response) {
      return rejectWithValue('Network error. Please try again.');
    }
    return rejectWithValue(error.response.data.message || 'Login failed.');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to register user.';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to login.';
      })
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for initialization failure
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;