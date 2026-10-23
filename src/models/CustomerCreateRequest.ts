export interface CustomerImagePayload {
  imageUrl: string;
  publicId?: string;
  purpose?: string;
}

export interface CustomerCreateRequest {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  image?: string;
  imagePublicId?: string;
  images?: CustomerImagePayload[];
}