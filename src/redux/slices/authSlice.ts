import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  AuthResponse,
  AuthUser,
} from "@/models/AuthResponse";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  expiresIn: number | null;
  isAuthenticated: boolean;

  // Used to know whether we have finished
  // checking the refresh-token session.
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresIn: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // -------------------------------------------------------
    // Login / refresh successful
    // -------------------------------------------------------

    setCredentials: (
      state,
      action: PayloadAction<AuthResponse>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expiresIn = action.payload.expiresIn;

      state.isAuthenticated = true;
      state.isInitialized = true;
    },

    // -------------------------------------------------------
    // Set user
    // -------------------------------------------------------

    setUser: (
      state,
      action: PayloadAction<AuthUser>
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    // -------------------------------------------------------
    // Update access token
    // -------------------------------------------------------

    setAccessToken: (
      state,
      action: PayloadAction<string>
    ) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },

    // -------------------------------------------------------
    // Authentication check completed
    //
    // Used when /auth/refresh fails because there
    // is no valid refresh-token session.
    // -------------------------------------------------------

    initializeAuth: (state) => {
      state.isInitialized = true;
    },

    // -------------------------------------------------------
    // Logout
    // -------------------------------------------------------

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.expiresIn = null;

      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const {
  setCredentials,
  setUser,
  setAccessToken,
  initializeAuth,
  logout,
} = authSlice.actions;

export default authSlice.reducer;