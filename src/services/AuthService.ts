import type { RegisterData } from "@/models/RegisterData";
import type LoginData from "@/models/LoginData";
import type { AuthResponse } from "@/models/AuthResponse";

import apiClient from "@/config/ApiClient";

// ---------------------------------------------------------
// Register
// ---------------------------------------------------------

export const registerUser = async (
  userData: RegisterData
) => {
  const response = await apiClient.post(
    "/auth/register",
    userData
  );

  return response.data;
};

// ---------------------------------------------------------
// Login
// ---------------------------------------------------------

export const loginUser = async (
  loginData: LoginData
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    "/auth/login",
    loginData
  );

  return response.data;
};

// ---------------------------------------------------------
// Refresh Session
// ---------------------------------------------------------

export const refreshSession = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    "/auth/refresh"
  );

  return response.data;
};

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------

export const logoutUser = async () => {
  const response = await apiClient.post(
    "/auth/logout"
  );

  return response.data;
};