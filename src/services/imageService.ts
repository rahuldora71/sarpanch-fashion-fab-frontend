import apiClient from "@/config/ApiClient";

import type {
  ImageUploadResponse,
} from "@/types/image";

export const uploadImage = async (
  file: File,
): Promise<ImageUploadResponse> => {
  const formData = new FormData();

  formData.append(
    "file",
    file,
  );

  const response =
    await apiClient.post<ImageUploadResponse>(
      "/images/upload",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );

  return response.data;
};