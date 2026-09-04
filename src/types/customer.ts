export interface CustomerSummary {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;
}

export interface CustomerResponse extends CustomerSummary {
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerCreateRequest {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface PageCustomerSummaryResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;

  first: boolean;
  last: boolean;
  empty: boolean;

  content: CustomerSummary[];
}