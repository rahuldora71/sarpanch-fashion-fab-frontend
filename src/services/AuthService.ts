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

// ---------------------------------------------------------
// Password Recovery (OTP-based)
// ---------------------------------------------------------

export interface PasswordResetApiResponse {
  success: boolean;
  message: string;
  challengeId?: string;
  resetToken?: string;
  cooldownSeconds?: number;
}

export const requestPasswordResetOtp = async (
  email: string
): Promise<PasswordResetApiResponse> => {
  const response = await apiClient.post<PasswordResetApiResponse>(
    "/auth/forgot-password",
    { email }
  );
  return response.data;
};

export const resendPasswordResetOtp = async (
  challengeId: string
): Promise<PasswordResetApiResponse> => {
  const response = await apiClient.post<PasswordResetApiResponse>(
    "/auth/resend-reset-otp",
    { challengeId }
  );
  return response.data;
};

export const verifyPasswordResetOtp = async (
  challengeId: string,
  otp: string
): Promise<PasswordResetApiResponse> => {
  const response = await apiClient.post<PasswordResetApiResponse>(
    "/auth/verify-reset-otp",
    { challengeId, otp }
  );
  return response.data;
};

export const completePasswordReset = async (
  resetToken: string,
  newPassword: string
): Promise<PasswordResetApiResponse> => {
  const response = await apiClient.post<PasswordResetApiResponse>(
    "/auth/reset-password",
    { resetToken, newPassword }
  );
  return response.data;
};