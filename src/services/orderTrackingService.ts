import axios from "axios";
import type { Invoice } from "@/types/billingModule";

export interface PublicOrderFinancials {
  subtotal: number;
  discount: number;
  additionalCharges: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  isFullyPaid: boolean;
}

export interface PublicTimelineStage {
  stageKey: "BOOKED" | "CUTTING" | "STITCHING" | "READY" | "DELIVERED" | string;
  title: string;
  description: string;
  state: "COMPLETED" | "CURRENT" | "PENDING";
  timestamp?: string;
}

export interface PublicGarment {
  garmentId: number;
  serviceName: string;
  price: number;
  sampleNumber?: string;
  status: string;
  statusLabel: string;
  customerFabric: boolean;
  fabricSourceLabel: string;
  tryDate?: string;
  dueDate?: string;
  addOns: string[];
}

export interface PublicOrderReview {
  id: number;
  rating: number;
  comment?: string;
  customerName?: string;
  createdAt: string;
}

export interface PublicOrderTrackingResponse {
  orderId: number;
  orderNumber: number;
  trackingToken: string;
  orderDate: string;
  estimatedDeliveryDate?: string;
  status: "BOOKED" | "IN_PROGRESS" | "READY" | "DELIVERED" | string;
  statusLabel: string;
  currentStage: string;
  progressPercentage: number;
  isDelivered: boolean;
  deliveryDate?: string;
  customerName: string;
  customerPhoneMasked: string;
  sampleBookPageNumber?: string;
  financials: PublicOrderFinancials;
  timeline: PublicTimelineStage[];
  garments: PublicGarment[];
  review?: PublicOrderReview | null;
  canReview: boolean;
  lastRefreshedAt: string;
}

export interface PublicReviewRequest {
  rating: number;
  comment?: string;
}

function getPublicApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    if (window.location.port === "" || window.location.port === "443" || window.location.port === "80") {
      return `${protocol}//${hostname}/api/v1/public/orders`;
    }
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:8082/api/v1/public/orders`;
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return `${envUrl}/public/orders`;
  }
  return "http://localhost:8082/api/v1/public/orders";
}

/**
 * Public Order Tracking Service - Does not require staff bearer token.
 * Securely authorized by the unguessable tracking token in the URL.
 */
export const orderTrackingService = {
  /**
   * Fetches public customer order tracking information.
   */
  async trackOrder(token: string): Promise<PublicOrderTrackingResponse> {
    const baseUrl = getPublicApiBaseUrl();
    const response = await axios.get<PublicOrderTrackingResponse>(
      `${baseUrl}/track/${encodeURIComponent(token.trim())}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 12000,
      }
    );
    return response.data;
  },

  /**
   * Submits a customer review for an order.
   */
  async submitReview(
    token: string,
    payload: PublicReviewRequest
  ): Promise<PublicOrderReview> {
    const baseUrl = getPublicApiBaseUrl();
    const response = await axios.post<PublicOrderReview>(
      `${baseUrl}/track/${encodeURIComponent(token.trim())}/review`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 12000,
      }
    );
    return response.data;
  },

  /**
   * Fetches the invoice / bill for an order.
   */
  async getInvoice(token: string): Promise<Invoice> {
    const baseUrl = getPublicApiBaseUrl();
    const response = await axios.get<Invoice>(
      `${baseUrl}/track/${encodeURIComponent(token.trim())}/invoice`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 12000,
      }
    );
    return response.data;
  },
};
