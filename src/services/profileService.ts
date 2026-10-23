import apiClient from "@/config/ApiClient";

export interface UserProfileResponse {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  image: string | null;
  workerSpecialty: string | null;
  dailyCapacity: number | null;
  roles: string[];
  effectivePermissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  image?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const getProfile = async (): Promise<UserProfileResponse> => {
  const response = await apiClient.get<UserProfileResponse>("/profile/me");
  return response.data;
};

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UserProfileResponse> => {
  const response = await apiClient.put<UserProfileResponse>("/profile/me", data);
  return response.data;
};

export const changePassword = async (
  data: ChangePasswordRequest
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    "/profile/change-password",
    data
  );
  return response.data;
};

export const getEffectivePermissions = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/profile/permissions");
  return response.data;
};
