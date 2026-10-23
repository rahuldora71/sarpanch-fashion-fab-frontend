import ApiClient from "@/config/ApiClient";
import type {
  HistoricalCustomerSummary,
  HistoricalOrderRequest,
  HistoricalOrderResponse,
  NextOrderNumberResponse,
} from "@/types/historicalOrder";

const BASE = "/orders/historical";

export async function getNextOrderNumber(): Promise<number> {
  const { data } = await ApiClient.get<NextOrderNumberResponse>(`${BASE}/next-number`);
  return data?.nextOrderNumber || 1;
}

export async function findCustomersByPhone(phone: string): Promise<HistoricalCustomerSummary[]> {
  if (!phone || phone.trim().length < 3) return [];
  const { data } = await ApiClient.get<HistoricalCustomerSummary[]>(`${BASE}/customers-by-phone`, {
    params: { phone: phone.trim() },
  });
  return data || [];
}

export async function createHistoricalOrder(
  payload: HistoricalOrderRequest
): Promise<HistoricalOrderResponse> {
  const { data } = await ApiClient.post<HistoricalOrderResponse>(BASE, payload);
  return data;
}

export async function getRecentHistoricalOrders(limit = 20): Promise<HistoricalOrderResponse[]> {
  const { data } = await ApiClient.get<HistoricalOrderResponse[]>(`${BASE}/recent`, {
    params: { limit },
  });
  return data || [];
}
