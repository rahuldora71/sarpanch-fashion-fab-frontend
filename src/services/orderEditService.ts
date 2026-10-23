import apiClient from "@/config/ApiClient";
import type { CompleteOrderResponse, EditOrderRequestDto } from "@/types/orderEdit";

// ============================================================
// SAMPLE BOOK PAGE NUMBER
// ============================================================

export async function getNextSampleBookPageNumber(): Promise<string> {
  const res = await apiClient.get<{ nextPageNumber: string }>(
    "/orders/sample-book/next-number"
  );
  return res.data.nextPageNumber;
}

// ============================================================
// EDIT ORDER
// ============================================================

export async function editOrder(
  orderId: number,
  request: EditOrderRequestDto
): Promise<CompleteOrderResponse> {
  const res = await apiClient.put<CompleteOrderResponse>(
    `/orders/${orderId}/edit`,
    request
  );
  return res.data;
}

// ============================================================
// GET ORDER DETAILS (reuse existing endpoint)
// ============================================================

export async function getOrderDetails(orderId: number) {
  const res = await apiClient.get(`/orders/${orderId}/details`);
  return res.data;
}
