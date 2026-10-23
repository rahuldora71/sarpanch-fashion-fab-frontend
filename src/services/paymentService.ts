import ApiClient from "@/config/ApiClient";
import type {
  PaymentTransaction,
  PaymentAnalytics,
  DeliveredUnpaidOrder,
  CreatePaymentPayload,
  PageResponse,
} from "@/types/payment";
import type { PaymentMethod, PaymentType } from "@/types/order";

const BASE = "/payments";

export interface TransactionFilterParams {
  startDate?: string;
  endDate?: string;
  method?: PaymentMethod | "ALL";
  type?: PaymentType | "ALL";
  keyword?: string;
  page?: number;
  size?: number;
}

export async function getPaymentTransactions(
  params: TransactionFilterParams = {}
): Promise<PageResponse<PaymentTransaction>> {
  const queryParams: Record<string, any> = {};

  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (params.method && params.method !== "ALL") queryParams.method = params.method;
  if (params.type && params.type !== "ALL") queryParams.type = params.type;
  if (params.keyword && params.keyword.trim()) queryParams.keyword = params.keyword.trim();
  if (typeof params.page === "number") queryParams.page = params.page;
  if (typeof params.size === "number") queryParams.size = params.size;

  const { data } = await ApiClient.get<PageResponse<any>>(BASE, {
    params: queryParams,
  });

  if (data && Array.isArray(data.content)) {
    data.content = data.content.map((item: any) => ({
      ...item,
      amount: Number(item.amount ?? 0),
      receivedById: item.receivedById ?? item.receivedByUserId ?? null,
      receivedByName: item.receivedByName ?? item.receivedByUserName ?? null,
    }));
  }

  return data;
}

export interface AnalyticsFilterParams {
  startDate?: string;
  endDate?: string;
  method?: PaymentMethod | "ALL";
  type?: PaymentType | "ALL";
  keyword?: string;
}

export async function getPaymentAnalytics(
  paramsOrStartDate?: AnalyticsFilterParams | string,
  maybeEndDate?: string
): Promise<PaymentAnalytics> {
  const queryParams: Record<string, any> = {};

  if (typeof paramsOrStartDate === "object" && paramsOrStartDate !== null) {
    const p = paramsOrStartDate;
    if (p.startDate) queryParams.startDate = p.startDate;
    if (p.endDate) queryParams.endDate = p.endDate;
    if (p.method && p.method !== "ALL") queryParams.method = p.method;
    if (p.type && p.type !== "ALL") queryParams.type = p.type;
    if (p.keyword && p.keyword.trim()) queryParams.keyword = p.keyword.trim();
  } else {
    if (paramsOrStartDate) queryParams.startDate = paramsOrStartDate;
    if (maybeEndDate) queryParams.endDate = maybeEndDate;
  }

  const { data } = await ApiClient.get<any>(`${BASE}/analytics`, {
    params: queryParams,
  });

  const rangeTotal = Number(data?.rangeTotal ?? data?.rangeTotalAmount ?? 0);
  const rangePaymentCount = Number(data?.rangePaymentCount ?? data?.rangeCount ?? 0);
  const todayTotal = Number(data?.todayTotal ?? data?.todayTotalAmount ?? 0);
  const todayCount = Number(data?.todayCount ?? data?.todayPaymentCount ?? 0);

  const rawBreakdown =
    data?.paymentMethodBreakdown ||
    data?.methodBreakdown ||
    {};

  const methodBreakdown: Record<string, number> = {
    CASH: Number(rawBreakdown.CASH ?? 0),
    UPI: Number(rawBreakdown.UPI ?? 0),
    CARD: Number(rawBreakdown.CARD ?? 0),
    BANK_TRANSFER: Number(rawBreakdown.BANK_TRANSFER ?? 0),
    CHEQUE: Number(rawBreakdown.CHEQUE ?? 0),
  };

  const deliveredUnpaidCount = Number(data?.deliveredUnpaidCount ?? 0);
  const deliveredUnpaidTotalBalance = Number(
    data?.deliveredUnpaidTotalBalance ?? data?.deliveredUnpaidBalance ?? 0
  );

  return {
    rangeTotal,
    rangeTotalAmount: rangeTotal,
    rangeCount: rangePaymentCount,
    rangePaymentCount,
    todayTotal,
    todayTotalAmount: todayTotal,
    todayCount,
    todayPaymentCount: todayCount,
    methodBreakdown,
    paymentMethodBreakdown: methodBreakdown,
    deliveredUnpaidCount,
    deliveredUnpaidTotalBalance,
  };
}

export async function getDeliveredUnpaidOrders(
  keyword?: string,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<DeliveredUnpaidOrder>> {
  const queryParams: Record<string, any> = { page, size };
  if (keyword && keyword.trim()) {
    queryParams.keyword = keyword.trim();
  }

  const { data } = await ApiClient.get<PageResponse<DeliveredUnpaidOrder>>(
    `${BASE}/delivered-unpaid`,
    { params: queryParams }
  );
  return data;
}

export async function recordPayment(payload: CreatePaymentPayload) {
  const { data } = await ApiClient.post(BASE, payload);
  return data;
}
