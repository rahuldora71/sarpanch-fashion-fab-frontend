export interface CustomerSummary {
  id: number;
  customerCode: string | null;
  name: string;
  phone: string | null;
  email?: string | null;
  image?: string | null;
}

export interface CustomerResponse
  extends CustomerSummary {
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;

  enable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPageResponse {
  content: CustomerSummary[];

  totalElements: number;
  totalPages: number;

  size: number;
  number: number;

  first: boolean;
  last: boolean;

  numberOfElements: number;
  empty: boolean;
}