export interface CustomerCreateRequest {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}