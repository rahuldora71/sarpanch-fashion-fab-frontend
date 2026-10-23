import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  AuthResponse,
  AuthUser,
} from "@/models/AuthResponse";

interface AuthState {
  user: AuthUser | null;

  /**
   * Short-lived access token.
   *
   * IMPORTANT:
   * This should remain in Redux memory only.
   * Do NOT persist this state to localStorage.
   */
  accessToken: string | null;

  /**
   * Access-token lifetime returned by the backend.
   */
  expiresIn: number | null;

  /**
   * Indicates whether the user currently has
   * an authenticated session.
   */
  isAuthenticated: boolean;

  /**
   * Indicates whether the initial refresh-session
   * check has completed.
   */
  isInitialized: boolean;

  /**
   * Effective permission keys granted dynamically to the current user.
   * Example: ["orders.view", "orders.create", "billing.print"]
   */
  effectivePermissions: string[];

  /**
   * Indicates whether dynamic permissions are currently loading from the backend.
   */
  isPermissionsLoading: boolean;

  /**
   * Indicates whether permissions have been successfully resolved at least once
   * for the current authenticated session.
   */
  permissionsLoaded: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresIn: null,
  isAuthenticated: false,
  isInitialized: false,
  effectivePermissions: [],
  isPermissionsLoading: false,
  permissionsLoaded: false,
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
      action: PayloadAction<AuthResponse>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expiresIn = action.payload.expiresIn;
      if (action.payload.effectivePermissions) {
        state.effectivePermissions = action.payload.effectivePermissions;
        state.permissionsLoaded = true;
      } else if (action.payload.user?.effectivePermissions) {
        state.effectivePermissions = action.payload.user.effectivePermissions;
        state.permissionsLoaded = true;
      }

      state.isAuthenticated = true;
      state.isInitialized = true;
    },

    // -------------------------------------------------------
    // Set user
    // -------------------------------------------------------

    setUser: (
      state,
      action: PayloadAction<AuthUser>,
    ) => {
      state.user = action.payload;
      if (action.payload.effectivePermissions) {
        state.effectivePermissions = action.payload.effectivePermissions;
        state.permissionsLoaded = true;
      }
      state.isAuthenticated = true;
    },

    // -------------------------------------------------------
    // Set permissions loading state
    // -------------------------------------------------------

    setPermissionsLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isPermissionsLoading = action.payload;
    },

    // -------------------------------------------------------
    // Set effective permissions (resolved successfully)
    // -------------------------------------------------------

    setEffectivePermissions: (
      state,
      action: PayloadAction<string[]>,
    ) => {
      state.effectivePermissions = action.payload;
      state.isPermissionsLoading = false;
      state.permissionsLoaded = true;
    },

    // -------------------------------------------------------
    // Permissions load error (fail-closed)
    // -------------------------------------------------------

    setPermissionsError: (state) => {
      state.effectivePermissions = []; // Safe fail-closed: do not grant all permissions
      state.isPermissionsLoading = false;
      state.permissionsLoaded = true;
    },

    // -------------------------------------------------------
    // Update access token
    // -------------------------------------------------------

    setAccessToken: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },

    // -------------------------------------------------------
    // Authentication check completed
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
      state.effectivePermissions = [];
      state.isPermissionsLoading = false;
      state.permissionsLoaded = false;

      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const {
  setCredentials,
  setUser,
  setPermissionsLoading,
  setEffectivePermissions,
  setPermissionsError,
  setAccessToken,
  initializeAuth,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
