export interface ImageUploadResponse {
  success: boolean;
  message?: string;
  imageUrl?: string;
  publicId?: string;
}

export interface UploadedImage {
  imageUrl: string;
  imagePublicId: string;
}