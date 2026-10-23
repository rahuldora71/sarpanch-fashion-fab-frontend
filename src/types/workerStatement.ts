import type { Worker, WorkAllocationItem } from "./worker";

export type AdvanceType = "DAILY_KHARCHA" | "ADVANCE" | "MATERIAL" | "OTHER";
export type AdvancePaymentMode = "CASH" | "UPI" | "BANK_TRANSFER";

export interface WorkerAdvance {
  id: string | number;
  workerId: number;
  workerName?: string;
  amount: number;
  advanceDate: string; // YYYY-MM-DD
  type: AdvanceType | string;
  note?: string;
  paymentMode: AdvancePaymentMode | string;
  settlementId?: string | number | null;
  createdAt?: string;
}

export interface CreateWorkerAdvanceRequest {
  workerId: number;
  amount: number;
  advanceDate: string;
  type?: string;
  note?: string;
  paymentMode?: string;
}

export interface AddOnWorkSummary {
  name: string;
  count: number;
  rate: number;
  totalAmount: number;
}

export interface GarmentWorkSummary {
  serviceId?: number | null;
  serviceName: string;
  count: number;
  rate: number;
  baseAmount: number;
  addOnsAmount: number;
  totalAmount: number;
  garmentIds: number[];
}

export type SettlementCyclePreset =
  | "CYCLE_1" // 1st - 10th
  | "CYCLE_2" // 11th - 20th
  | "CYCLE_3" // 21st - Month End
  | "FULL_MONTH" // 1st - Month End
  | "PREV_MONTH" // Previous Month
  | "CUSTOM";

export interface WorkerStatementData {
  worker: Worker;
  cyclePreset: SettlementCyclePreset;
  cycleLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  settlementDate: string; // YYYY-MM-DD (typically 11/12, 21/22, or 1/2)
  garmentsSummary: GarmentWorkSummary[];
  addOnsSummary: AddOnWorkSummary[];
  allGarments: WorkAllocationItem[];
  totalGarmentsCount: number;
  baseGarmentsEarnings: number;
  totalAddOnsCommission: number;
  grossEarnings: number;
  advancesList: WorkerAdvance[];
  totalAdvances: number;
  previousBalance: number;
  netPayable: number;
}

export interface WorkerSettlementRecord {
  id: string | number;
  settlementNumber: string;
  workerId: number;
  workerName: string;
  workerPhone: string;
  startDate: string;
  endDate: string;
  settlementDate: string;
  cycleLabel: string;
  totalGarmentsCount: number;
  grossWorkAmount: number;
  previousBalance: number;
  totalAdvancesDeducted: number;
  netPayable: number;
  amountPaid: number;
  closingBalance: number;
  paymentMode: string;
  note?: string;
  garmentBreakdownJson?: string;
  createdAt?: string;
}

export interface CreateWorkerSettlementRequest {
  workerId: number;
  startDate: string;
  endDate: string;
  settlementDate: string;
  cycleLabel: string;
  totalGarmentsCount: number;
  grossWorkAmount: number;
  previousBalance: number;
  totalAdvancesDeducted: number;
  netPayable: number;
  amountPaid: number;
  closingBalance: number;
  paymentMode: string;
  note?: string;
  garmentBreakdownJson?: string;
}
