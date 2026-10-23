export interface CustomerSummary {
  id: number;
  customerCode: string | null;
  name: string;
  phone: string | null;
  email?: string | null;
  image?: string | null;

  // Optional until these aggregates are added to CustomerSummaryResponse.
  totalOrders?: number;
  totalSpent?: number;
  balance?: number;
  lastOrderDate?: string | null;
}

export interface CustomerResponse extends CustomerSummary {
  imagePublicId?: string | null;
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

export interface CustomerProfileSummary {
  totalOrders: number;
  totalSpent: number;
  currentBalance: number;
  lastOrderDate: string | null;
}

export interface CustomerProfileGarment {
  id: number;
  serviceId: number;
  serviceName: string;
  status: string | null;
}

export interface CustomerProfileOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string | null;
  status: string | null;
  total: number;
  balanceDue: number;
  garments: CustomerProfileGarment[];
  billImageUrl?: string | null;
}

export interface CustomerProfileMeasurement {
  measurementId: number;
  garmentId: number;
  orderId: number;
  serviceId: number;
  serviceName: string;
  measurementFields: Record<string, unknown>;
  measuredAt: string;
}

export interface CustomerProfilePayment {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  paidAt: string;
}

export interface CustomerProfileAlteration {
  id: number;
  alterationNumber: string;
  description: string;
  status: string;
  orderId: number;
  createdAt: string;
}

export interface CustomerUserImage {
  id: number;
  imageUrl: string;
  publicId?: string | null;
  purpose: string;
  createdAt: string;
}

export interface CustomerProfileResponse {
  customer: CustomerResponse;
  summary: CustomerProfileSummary;
  orders: CustomerProfileOrder[];
  measurements: CustomerProfileMeasurement[];
  payments: CustomerProfilePayment[];
  alterations: CustomerProfileAlteration[];
  images?: CustomerUserImage[];
}
