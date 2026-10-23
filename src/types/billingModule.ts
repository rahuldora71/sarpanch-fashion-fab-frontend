export interface BillingConfig {
  id?: number;
  shopName: string;
  tagline: string;
  gstin: string;
  panNumber: string;
  state: string;
  stateCode: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  invoicePrefix: string;
  financialYear: string;
  defaultTaxInclusive: boolean;
  includeStitchingOnly: boolean;
  allowMixedOrders: boolean;
  allowFabricOnly: boolean;
  allowManualInvoices: boolean;
  allowCustomLineItems: boolean;
  allowPartialBilling: boolean;
  enforceSequentialNumbering: boolean;
  termsAndConditions: string;
  footerNote: string;
  defaultInvoiceTemplate: string;
}

export interface TaxRule {
  id?: number;
  taxName: string;
  taxType: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  hsnSacCode: string;
  category: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  active: boolean;
  isDefault: boolean;
  description?: string;
}

export interface EligibleGarmentItem {
  garmentId: number;
  serviceName: string;
  price: number;
  customerFabric: boolean;
  sampleNumber?: string;
  addOnsCount: number;
  addOnsTotal: number;
  serviceBasePrice?: number;
  stitchingAmount?: number;
  fabricAmount?: number;
  hasShopFabric?: boolean;
}

export interface EligibleOrder {
  orderId: number;
  orderNumber: string;
  sampleBookPageNumber?: string;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  orderDate: string;
  garmentsCount: number;
  servicesSummary: string;
  fabricSummary: string;
  stitchingAmount: number;
  fabricAmount: number;
  totalOrderAmount: number;
  paidAmount: number;
  balanceAmount: number;
  classification: "STITCHING_ONLY" | "FABRIC_ONLY" | "FABRIC_AND_STITCHING" | "SERVICE_ONLY" | "MIXED";
  billingStatus: "UNBILLED" | "PARTIALLY_BILLED" | "BILLED";
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  garments: EligibleGarmentItem[];
}

export interface InvoiceItemDraft {
  itemType: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstRate: number;
  garmentId?: number;
  orderId?: number;
  fabricId?: number;
}

export interface GenerateInvoicePayload {
  orderIds: number[];
  selectedGarmentIds?: number[];
  invoiceType?: string;
  invoiceDate?: string;
  dueDate?: string;
  isTaxInclusive?: boolean;
  placeOfSupply?: string;
  customerGstin?: string;
  customerStateCode?: string;
  discount?: number;
  roundOff?: number;
  notes?: string;
  termsAndConditions?: string;
  paymentMethod?: string;
  advancePaidAmount?: number;
  billingMode?: "FABRIC_CONVERTED" | "GARMENT_CONSOLIDATED" | "DETAILED_ITEMIZED";
  overrideItems?: InvoiceItemDraft[];
  customItems?: InvoiceItemDraft[];
  garmentCustomerFabricOverrides?: Record<number, boolean>;
}

export interface CreateManualInvoicePayload {
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerStateCode?: string;
  invoiceType?: string;
  classification?: string;
  invoiceDate?: string;
  dueDate?: string;
  isTaxInclusive?: boolean;
  placeOfSupply?: string;
  items: InvoiceItemDraft[];
  discount?: number;
  roundOff?: number;
  notes?: string;
  termsAndConditions?: string;
  paymentMethod?: string;
  paidAmount?: number;
}

export interface InvoiceItem {
  id: number;
  itemOrder: number;
  itemType: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  rate: number;
  grossAmount: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  garmentId?: number;
  orderId?: number;
  fabricId?: number;
}

export interface InvoicePayment {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
}

export interface InvoiceOrder {
  id: number;
  orderId: number;
  billedAmount: number;
  isPartial: boolean;
  sampleBookPageNumber?: string;
  orderDate?: string;
}

export interface InvoiceAuditLog {
  id: number;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  invoiceType: string;
  classification: string;
  status: string;
  isTaxInclusive: boolean;
  placeOfSupply: string;
  isInterState: boolean;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerStateCode?: string;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string;
  termsAndConditions?: string;
  isCancelled: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  invoiceOrders: InvoiceOrder[];
  payments: InvoicePayment[];
  auditLogs: InvoiceAuditLog[];
}

export interface RecordPaymentPayload {
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
  receivedBy?: string;
}

export interface CancelInvoicePayload {
  reason: string;
  cancelledBy?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface PaymentDistribution {
  method: string;
  count: number;
  totalAmount: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayTaxable: number;
  todayGst: number;
  todayInvoicesCount: number;
  monthTurnover: number;
  monthTaxable: number;
  monthGst: number;
  monthInvoicesCount: number;
  monthCancelledCount: number;
  fabricSales: number;
  stitchingSales: number;
  mixedSales: number;
  totalOutstanding: number;
  totalPaid: number;
  pendingAmount: number;
  dailySalesChart: ChartDataPoint[];
  monthlySalesChart: ChartDataPoint[];
  paymentDistribution: PaymentDistribution[];
}

export interface Fabric {
  id?: number;
  name: string;
  fabricCode: string;
  fabricType?: string;
  color?: string;
  widthInches: number;
  stockMeters: number;
  costPricePerMeter: number;
  sellingPricePerMeter: number;
  hsnCode: string;
  taxRuleId?: number;
  taxRuleName?: string;
  minStockAlert: number;
  supplier?: string;
  notes?: string;
  active: boolean;
  isLowStock?: boolean;
}

export interface FabricStockAdjustment {
  fabricId: number;
  transactionType: string;
  quantityMeters: number;
  referenceNo?: string;
  referenceType?: string;
  notes?: string;
  performedBy?: string;
}

export interface FabricStockTransaction {
  id: number;
  fabricId: number;
  fabricName: string;
  fabricCode: string;
  transactionType: string;
  quantityMeters: number;
  previousStock: number;
  newStock: number;
  referenceNo?: string;
  referenceType?: string;
  notes?: string;
  performedBy?: string;
  transactionDate: string;
}

export interface FabricConsumptionRule {
  id?: number;
  garmentType: string;
  widthInches: number;
  baseConsumptionMeters: number;
  wastagePercent: number;
  description?: string;
}

export interface FabricEstimatePayload {
  garmentType: string;
  widthInches: number;
  quantity: number;
  chestSizeInches?: number;
  lengthInches?: number;
}

export interface FabricEstimateResponse {
  garmentType: string;
  widthInches: number;
  quantity: number;
  baseMeters: number;
  wastageMeters: number;
  totalEstimatedMeters: number;
  notes: string;
}

export interface HsnSummaryItem {
  hsnSacCode: string;
  totalQuantity: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  invoiceCount: number;
  cancelledCount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalTurnover: number;
  hsnSummary: HsnSummaryItem[];
  invoices: Invoice[];
}

export interface CaExport {
  period: string;
  gstin: string;
  shopName: string;
  b2bInvoicesCount: number;
  b2bTaxable: number;
  b2bTax: number;
  b2cInvoicesCount: number;
  b2cTaxable: number;
  b2cTax: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalTurnover: number;
  hsnSummary: HsnSummaryItem[];
  b2bInvoices: Invoice[];
  b2cInvoices: Invoice[];
  cancelledInvoices: Invoice[];
}

export interface MonthEndClosingPayload {
  month: number;
  year: number;
  closedBy?: string;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
