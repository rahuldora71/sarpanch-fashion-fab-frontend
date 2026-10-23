import ApiClient from "@/config/ApiClient";
import type {
  BillingConfig,
  TaxRule,
  EligibleOrder,
  GenerateInvoicePayload,
  CreateManualInvoicePayload,
  Invoice,
  RecordPaymentPayload,
  CancelInvoicePayload,
  DashboardSummary,
  Fabric,
  FabricStockAdjustment,
  FabricStockTransaction,
  FabricConsumptionRule,
  FabricEstimatePayload,
  FabricEstimateResponse,
  MonthlyReport,
  CaExport,
  MonthEndClosingPayload,
  PageResponse,
} from "@/types/billingModule";

const BASE = "/billing";

// Configuration
export async function getBillingConfig(): Promise<BillingConfig> {
  const { data } = await ApiClient.get<BillingConfig>(`${BASE}/config`);
  return data;
}

export async function updateBillingConfig(config: BillingConfig): Promise<BillingConfig> {
  const { data } = await ApiClient.put<BillingConfig>(`${BASE}/config`, config);
  return data;
}

// Tax Rules
export async function getAllTaxRules(): Promise<TaxRule[]> {
  const { data } = await ApiClient.get<TaxRule[]>(`${BASE}/tax-rules`);
  return data;
}

export async function getActiveTaxRules(): Promise<TaxRule[]> {
  const { data } = await ApiClient.get<TaxRule[]>(`${BASE}/tax-rules/active`);
  return data;
}

export async function saveTaxRule(rule: TaxRule): Promise<TaxRule> {
  if (rule.id) {
    const { data } = await ApiClient.put<TaxRule>(`${BASE}/tax-rules/${rule.id}`, rule);
    return data;
  }
  const { data } = await ApiClient.post<TaxRule>(`${BASE}/tax-rules`, rule);
  return data;
}

// Eligible Orders
export async function getEligibleOrders(params: {
  search?: string;
  customer?: string;
  orderNumber?: string;
  billingStatus?: string;
  paymentStatus?: string;
  classification?: string;
  startDate?: string;
  endDate?: string;
}): Promise<EligibleOrder[]> {
  const queryParams: Record<string, any> = {};
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.customer?.trim()) queryParams.customer = params.customer.trim();
  if (params.orderNumber?.trim()) queryParams.orderNumber = params.orderNumber.trim();
  if (params.billingStatus && params.billingStatus !== "ALL") queryParams.billingStatus = params.billingStatus;
  if (params.paymentStatus && params.paymentStatus !== "ALL") queryParams.paymentStatus = params.paymentStatus;
  if (params.classification && params.classification !== "ALL") queryParams.classification = params.classification;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  const { data } = await ApiClient.get<EligibleOrder[]>(`${BASE}/orders/eligible`, {
    params: queryParams,
  });
  return data;
}

export async function updateGarmentFabricSource(garmentId: number, customerFabric: boolean): Promise<void> {
  await ApiClient.put(`${BASE}/garments/${garmentId}/fabric-source`, null, {
    params: { customerFabric },
  });
}

// Invoices
export async function generateInvoice(payload: GenerateInvoicePayload): Promise<Invoice> {
  const { data } = await ApiClient.post<Invoice>(`${BASE}/invoices/generate`, payload);
  return data;
}

export async function createManualInvoice(payload: CreateManualInvoicePayload): Promise<Invoice> {
  const { data } = await ApiClient.post<Invoice>(`${BASE}/invoices/manual`, payload);
  return data;
}

export async function getInvoices(params: {
  search?: string;
  status?: string;
  classification?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  isCancelled?: boolean;
  page?: number;
  size?: number;
}): Promise<PageResponse<Invoice>> {
  const queryParams: Record<string, any> = {};
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (params.status && params.status !== "ALL") queryParams.status = params.status;
  if (params.classification && params.classification !== "ALL") queryParams.classification = params.classification;
  if (params.paymentStatus && params.paymentStatus !== "ALL") queryParams.paymentStatus = params.paymentStatus;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (typeof params.isCancelled === "boolean") queryParams.isCancelled = params.isCancelled;
  if (typeof params.page === "number") queryParams.page = params.page;
  if (typeof params.size === "number") queryParams.size = params.size;

  const { data } = await ApiClient.get<PageResponse<Invoice>>(`${BASE}/invoices`, {
    params: queryParams,
  });
  return data;
}

export async function getInvoiceById(id: number): Promise<Invoice> {
  const { data } = await ApiClient.get<Invoice>(`${BASE}/invoices/${id}`);
  return data;
}

export async function recordInvoicePayment(id: number, payload: RecordPaymentPayload): Promise<Invoice> {
  const { data } = await ApiClient.post<Invoice>(`${BASE}/invoices/${id}/payments`, payload);
  return data;
}

export async function cancelInvoice(id: number, payload: CancelInvoicePayload): Promise<Invoice> {
  const { data } = await ApiClient.post<Invoice>(`${BASE}/invoices/${id}/cancel`, payload);
  return data;
}

// Dashboard & Reports
export async function getBillingDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await ApiClient.get<DashboardSummary>(`${BASE}/dashboard/summary`);
  return data;
}

export async function getMonthlyBillingReport(month: number, year: number): Promise<MonthlyReport> {
  const { data } = await ApiClient.get<MonthlyReport>(`${BASE}/reports/monthly`, {
    params: { month, year },
  });
  return data;
}

export async function getCaExportReport(startDate: string, endDate: string): Promise<CaExport> {
  const { data } = await ApiClient.get<CaExport>(`${BASE}/reports/ca-export`, {
    params: { startDate, endDate },
  });
  return data;
}

export async function closeBillingMonth(payload: MonthEndClosingPayload): Promise<any> {
  const { data } = await ApiClient.post(`${BASE}/reports/close-month`, payload);
  return data;
}

// Fabric Master & Stock
export async function getFabrics(params: {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
}): Promise<PageResponse<Fabric>> {
  const queryParams: Record<string, any> = {};
  if (params.search?.trim()) queryParams.search = params.search.trim();
  if (typeof params.active === "boolean") queryParams.active = params.active;
  if (typeof params.page === "number") queryParams.page = params.page;
  if (typeof params.size === "number") queryParams.size = params.size;

  const { data } = await ApiClient.get<PageResponse<Fabric>>(`${BASE}/fabrics`, {
    params: queryParams,
  });
  return data;
}

export async function getActiveFabrics(): Promise<Fabric[]> {
  const { data } = await ApiClient.get<Fabric[]>(`${BASE}/fabrics/active`);
  return data;
}

export async function getLowStockFabrics(): Promise<Fabric[]> {
  const { data } = await ApiClient.get<Fabric[]>(`${BASE}/fabrics/low-stock`);
  return data;
}

export async function getFabricById(id: number): Promise<Fabric> {
  const { data } = await ApiClient.get<Fabric>(`${BASE}/fabrics/${id}`);
  return data;
}

export async function createFabric(payload: Fabric): Promise<Fabric> {
  const { data } = await ApiClient.post<Fabric>(`${BASE}/fabrics`, payload);
  return data;
}

export async function updateFabric(id: number, payload: Fabric): Promise<Fabric> {
  const { data } = await ApiClient.put<Fabric>(`${BASE}/fabrics/${id}`, payload);
  return data;
}

export async function adjustFabricStock(payload: FabricStockAdjustment): Promise<Fabric> {
  const { data } = await ApiClient.post<Fabric>(`${BASE}/fabrics/adjust-stock`, payload);
  return data;
}

export async function getFabricStockTransactions(
  fabricId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FabricStockTransaction>> {
  const { data } = await ApiClient.get<PageResponse<FabricStockTransaction>>(
    `${BASE}/fabrics/${fabricId}/transactions`,
    { params: { page, size } }
  );
  return data;
}

// Fabric Consumption
export async function getFabricConsumptionRules(): Promise<FabricConsumptionRule[]> {
  const { data } = await ApiClient.get<FabricConsumptionRule[]>(`${BASE}/fabric-consumption/rules`);
  return data;
}

export async function saveFabricConsumptionRule(rule: FabricConsumptionRule): Promise<FabricConsumptionRule> {
  const { data } = await ApiClient.post<FabricConsumptionRule>(`${BASE}/fabric-consumption/rules`, rule);
  return data;
}

export async function estimateFabricConsumption(payload: FabricEstimatePayload): Promise<FabricEstimateResponse> {
  const { data } = await ApiClient.post<FabricEstimateResponse>(`${BASE}/fabric-consumption/estimate`, payload);
  return data;
}
