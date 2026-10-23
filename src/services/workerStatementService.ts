import ApiClient from "@/config/ApiClient";
import {
  format,
  startOfMonth,
  endOfMonth,
  setDate,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type { Worker, WorkAllocationItem } from "@/types/worker";
import type {
  WorkerAdvance,
  CreateWorkerAdvanceRequest,
  WorkerSettlementRecord,
  CreateWorkerSettlementRequest,
  SettlementCyclePreset,
  GarmentWorkSummary,
  AddOnWorkSummary,
  WorkerStatementData,
} from "@/types/workerStatement";

const ADVANCES_STORAGE_KEY = "sff_worker_advances_v1";
const SETTLEMENTS_STORAGE_KEY = "sff_worker_settlements_v1";
const WORKER_RATES_KEY = "sff_worker_custom_rates_v1";

// ============================================================
// LOCAL STORAGE RESILIENCE HELPERS
// ============================================================

function getStoredAdvances(): WorkerAdvance[] {
  try {
    const raw = localStorage.getItem(ADVANCES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAdvances(list: WorkerAdvance[]) {
  try {
    localStorage.setItem(ADVANCES_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save advances to localStorage", err);
  }
}

function getStoredSettlements(): WorkerSettlementRecord[] {
  try {
    const raw = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredSettlements(list: WorkerSettlementRecord[]) {
  try {
    localStorage.setItem(SETTLEMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save settlements to localStorage", err);
  }
}

export function getCustomWorkerRates(workerId: number): Record<string, number> {
  try {
    const raw = localStorage.getItem(`${WORKER_RATES_KEY}_${workerId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomWorkerRates(
  workerId: number,
  rates: Record<string, number>
) {
  try {
    localStorage.setItem(`${WORKER_RATES_KEY}_${workerId}`, JSON.stringify(rates));
  } catch (err) {
    console.error("Failed to save custom rates", err);
  }
}

// ============================================================
// CYCLE PRESET CALCULATOR (1-10, 11-20, 21-END)
// ============================================================

export function getCycleRange(
  preset: SettlementCyclePreset,
  referenceDate: Date = new Date()
): {
  startDate: string;
  endDate: string;
  settlementDate: string;
  label: string;
} {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth(); // 0-based

  switch (preset) {
    case "CYCLE_1": {
      // 1st to 10th of reference month. Settlement on 11th or 12th.
      const start = new Date(y, m, 1);
      const end = new Date(y, m, 10);
      const settle = new Date(y, m, 12);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(settle, "yyyy-MM-dd"),
        label: `1st – 10th ${format(referenceDate, "MMM yyyy")} (Cycle 1)`,
      };
    }
    case "CYCLE_2": {
      // 11th to 20th of reference month. Settlement on 21st or 22nd.
      const start = new Date(y, m, 11);
      const end = new Date(y, m, 20);
      const settle = new Date(y, m, 22);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(settle, "yyyy-MM-dd"),
        label: `11th – 20th ${format(referenceDate, "MMM yyyy")} (Cycle 2)`,
      };
    }
    case "CYCLE_3": {
      // 21st to last day of reference month. Settlement on 1st or 2nd of next month.
      const start = new Date(y, m, 21);
      const end = endOfMonth(referenceDate);
      const nextMonthFirst = setDate(startOfMonth(new Date(y, m + 1, 1)), 2);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(nextMonthFirst, "yyyy-MM-dd"),
        label: `21st – ${format(end, "do")} ${format(referenceDate, "MMM yyyy")} (Cycle 3)`,
      };
    }
    case "FULL_MONTH": {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      const nextMonthFirst = setDate(startOfMonth(new Date(y, m + 1, 1)), 2);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(nextMonthFirst, "yyyy-MM-dd"),
        label: `Full Month: ${format(referenceDate, "MMMM yyyy")}`,
      };
    }
    case "PREV_MONTH": {
      const prevDate = subMonths(referenceDate, 1);
      const start = startOfMonth(prevDate);
      const end = endOfMonth(prevDate);
      const settle = new Date(y, m, 2);
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(settle, "yyyy-MM-dd"),
        label: `Previous Month: ${format(prevDate, "MMMM yyyy")}`,
      };
    }
    case "CUSTOM":
    default: {
      const start = startOfMonth(referenceDate);
      const end = new Date();
      return {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        settlementDate: format(new Date(), "yyyy-MM-dd"),
        label: `Custom Period (${format(start, "dd/MM")} – ${format(end, "dd/MM/yyyy")})`,
      };
    }
  }
}

// Auto-detect the current natural cycle based on today's day of month
export function getCurrentCyclePreset(): SettlementCyclePreset {
  const day = new Date().getDate();
  if (day <= 10) return "CYCLE_1";
  if (day <= 20) return "CYCLE_2";
  return "CYCLE_3";
}

// ============================================================
// ADVANCES & DAILY KHARCHA API
// ============================================================

export async function fetchWorkerAdvances(
  workerId: number,
  startDate?: string,
  endDate?: string
): Promise<WorkerAdvance[]> {
  try {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const { data } = await ApiClient.get<WorkerAdvance[]>(
      `/workers/${workerId}/advances`,
      { params }
    );

    // Sync to local storage
    if (Array.isArray(data)) {
      const local = getStoredAdvances().filter((a) => a.workerId !== workerId);
      saveStoredAdvances([...local, ...data]);
      return data;
    }
  } catch (err) {
    console.warn("Backend advances call failed, falling back to local cache:", err);
  }

  // Fallback to local storage filter
  let list = getStoredAdvances().filter((a) => a.workerId === workerId);
  if (startDate) {
    list = list.filter((a) => a.advanceDate >= startDate);
  }
  if (endDate) {
    list = list.filter((a) => a.advanceDate <= endDate);
  }
  return list.sort((a, b) => a.advanceDate.localeCompare(b.advanceDate));
}

export async function saveWorkerAdvance(
  request: CreateWorkerAdvanceRequest
): Promise<WorkerAdvance> {
  const localId = `adv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const localRecord: WorkerAdvance = {
    id: localId,
    workerId: request.workerId,
    amount: request.amount,
    advanceDate: request.advanceDate,
    type: request.type || "DAILY_KHARCHA",
    note: request.note,
    paymentMode: request.paymentMode || "CASH",
    createdAt: new Date().toISOString(),
  };

  try {
    const { data } = await ApiClient.post<WorkerAdvance>(
      `/workers/advances`,
      request
    );
    if (data && data.id) {
      const current = getStoredAdvances().filter((a) => a.id !== localId);
      saveStoredAdvances([data, ...current]);
      return data;
    }
  } catch (err) {
    console.warn("Backend post advance failed, stored locally:", err);
  }

  const current = getStoredAdvances();
  saveStoredAdvances([localRecord, ...current]);
  return localRecord;
}

export async function removeWorkerAdvance(
  advanceId: string | number
): Promise<void> {
  try {
    await ApiClient.delete(`/workers/advances/${advanceId}`);
  } catch (err) {
    console.warn("Backend delete advance failed, removing locally:", err);
  }

  const current = getStoredAdvances().filter(
    (a) => String(a.id) !== String(advanceId)
  );
  saveStoredAdvances(current);
}

// ============================================================
// SETTLEMENTS HISTORY API
// ============================================================

export async function fetchWorkerSettlements(
  workerId: number
): Promise<WorkerSettlementRecord[]> {
  try {
    const { data } = await ApiClient.get<WorkerSettlementRecord[]>(
      `/workers/${workerId}/settlements`
    );
    if (Array.isArray(data)) {
      const local = getStoredSettlements().filter((s) => s.workerId !== workerId);
      saveStoredSettlements([...local, ...data]);
      return data;
    }
  } catch (err) {
    console.warn("Backend settlements call failed, falling back to local cache:", err);
  }

  return getStoredSettlements()
    .filter((s) => s.workerId === workerId)
    .sort((a, b) => b.settlementDate.localeCompare(a.settlementDate));
}

export async function saveWorkerSettlement(
  request: CreateWorkerSettlementRequest
): Promise<WorkerSettlementRecord> {
  const localId = `STMT-${format(new Date(), "yyyyMMdd")}-${Math.floor(
    100 + Math.random() * 900
  )}`;

  const localRecord: WorkerSettlementRecord = {
    id: localId,
    settlementNumber: localId,
    workerId: request.workerId,
    workerName: "",
    workerPhone: "",
    startDate: request.startDate,
    endDate: request.endDate,
    settlementDate: request.settlementDate,
    cycleLabel: request.cycleLabel,
    totalGarmentsCount: request.totalGarmentsCount,
    grossWorkAmount: request.grossWorkAmount,
    previousBalance: request.previousBalance,
    totalAdvancesDeducted: request.totalAdvancesDeducted,
    netPayable: request.netPayable,
    amountPaid: request.amountPaid,
    closingBalance: request.closingBalance,
    paymentMode: request.paymentMode,
    note: request.note,
    garmentBreakdownJson: request.garmentBreakdownJson,
    createdAt: new Date().toISOString(),
  };

  try {
    const { data } = await ApiClient.post<WorkerSettlementRecord>(
      `/workers/settlements`,
      request
    );
    if (data && data.id) {
      const current = getStoredSettlements();
      saveStoredSettlements([data, ...current]);
      return data;
    }
  } catch (err) {
    console.warn("Backend post settlement failed, saved locally:", err);
  }

  const current = getStoredSettlements();
  saveStoredSettlements([localRecord, ...current]);
  return localRecord;
}

// Get opening balance for worker from last settlement
export function getLatestClosingBalance(
  workerId: number,
  settlements: WorkerSettlementRecord[]
): number {
  const workerList = settlements
    .filter((s) => s.workerId === workerId)
    .sort((a, b) => b.settlementDate.localeCompare(a.settlementDate));

  if (workerList.length === 0) return 0;
  return Number(workerList[0].closingBalance ?? 0);
}

// ============================================================
// COMPUTATION ENGINE: STATEMENT, GROUPING, HISAB
// ============================================================

export interface ComputeStatementOptions {
  worker: Worker;
  allAllocations: WorkAllocationItem[];
  advances: WorkerAdvance[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  settlementDate: string; // YYYY-MM-DD
  cyclePreset: SettlementCyclePreset;
  cycleLabel: string;
  previousBalanceOverride?: number;
  customRates?: Record<string, number>;
  includeInProgress?: boolean; // if true, also count STITCHING status
}

export function computeWorkerStatement(
  options: ComputeStatementOptions
): WorkerStatementData {
  const {
    worker,
    allAllocations,
    advances,
    startDate,
    endDate,
    settlementDate,
    cyclePreset,
    cycleLabel,
    previousBalanceOverride,
    customRates = {},
    includeInProgress = false,
  } = options;

  const startIso = parseISO(startDate);
  const endIso = parseISO(endDate);

  // 1. Filter garments made by this worker
  const workerGarments = allAllocations.filter((item) => {
    if (item.madeByWorkerId !== worker.id) return false;

    // Status filter: READY and DELIVERED count as completed work done
    const isCompleted =
      item.status === "READY" ||
      item.status === "DELIVERED" ||
      item.status === "ALTERATION";
    const isEligible = includeInProgress
      ? isCompleted || item.status === "STITCHING"
      : isCompleted;

    if (!isEligible) return false;

    // Date range check: check item's completion date / orderDate / updatedAt
    const dateToCheck = item.dueDate || item.orderDate || item.tryDate;
    if (!dateToCheck) return true; // if no date, include in active period

    try {
      const gDate = parseISO(dateToCheck);
      return isWithinInterval(gDate, { start: startIso, end: endIso });
    } catch {
      return true;
    }
  });

  // 2. Group garments by service name and calculate rates + add-on commissions
  const serviceGroups = new Map<
    string,
    {
      serviceId: number | null;
      count: number;
      defaultRate: number;
      garmentIds: number[];
      addOnsAmount: number;
    }
  >();

  const addOnGroups = new Map<
    string,
    { count: number; rate: number; totalAmount: number }
  >();

  for (const g of workerGarments) {
    const sName = g.serviceName || "Stitched Garment";
    const existing = serviceGroups.get(sName) ?? {
      serviceId: g.serviceId ?? null,
      count: 0,
      defaultRate: Number(g.tailorCommission ?? 0),
      garmentIds: [],
      addOnsAmount: 0,
    };

    existing.count += 1;
    existing.garmentIds.push(g.garmentId);
    if (!existing.defaultRate && g.tailorCommission) {
      existing.defaultRate = Number(g.tailorCommission);
    }

    // Automatically calculate and sum tailor commission from add-ons on this garment
    if (g.addOns && g.addOns.length > 0) {
      for (const addon of g.addOns) {
        const aRate = Number(addon.tailorCommission ?? 0);
        const aQty = Number(addon.quantity ?? 1);
        const aTotal = aQty * aRate;

        existing.addOnsAmount += aTotal;

        if (aTotal > 0 || aRate > 0) {
          const aName = addon.name || "Add-on Work";
          const currentAddon = addOnGroups.get(aName) ?? {
            count: 0,
            rate: aRate,
            totalAmount: 0,
          };
          currentAddon.count += aQty;
          currentAddon.totalAmount += aTotal;
          if (aRate > 0) currentAddon.rate = aRate;
          addOnGroups.set(aName, currentAddon);
        }
      }
    }

    serviceGroups.set(sName, existing);
  }

  // Fallback defaults for typical Indian tailoring items if 0
  const DEFAULT_RATES: Record<string, number> = {
    shirt: 140,
    pant: 160,
    trouser: 160,
    kurta: 150,
    pajama: 100,
    suit: 600,
    safari: 350,
    blazer: 500,
    coat: 600,
    sherwani: 800,
    waistcoat: 250,
  };

  const garmentsSummary: GarmentWorkSummary[] = [];
  let baseGarmentsEarnings = 0;
  let totalAddOnsCommission = 0;

  for (const [serviceName, group] of serviceGroups.entries()) {
    // Determine rate: custom rate override > tailor commission > standard default fallback
    let appliedRate = customRates[serviceName];

    if (appliedRate === undefined || appliedRate === null) {
      if (group.defaultRate > 0) {
        appliedRate = group.defaultRate;
      } else {
        const lowerName = serviceName.toLowerCase();
        const matchedKey = Object.keys(DEFAULT_RATES).find((k) =>
          lowerName.includes(k)
        );
        appliedRate = matchedKey ? DEFAULT_RATES[matchedKey] : 150;
      }
    }

    const baseAmount = group.count * appliedRate;
    const addOnsAmount = group.addOnsAmount;
    const total = baseAmount + addOnsAmount;

    baseGarmentsEarnings += baseAmount;
    totalAddOnsCommission += addOnsAmount;

    garmentsSummary.push({
      serviceId: group.serviceId,
      serviceName,
      count: group.count,
      rate: appliedRate,
      baseAmount,
      addOnsAmount,
      totalAmount: total,
      garmentIds: group.garmentIds,
    });
  }

  // Sort summary by count descending
  garmentsSummary.sort((a, b) => b.count - a.count);

  const addOnsSummary: AddOnWorkSummary[] = Array.from(addOnGroups.entries()).map(
    ([name, info]) => ({
      name,
      count: info.count,
      rate: info.rate,
      totalAmount: info.totalAmount,
    })
  );
  addOnsSummary.sort((a, b) => b.totalAmount - a.totalAmount);

  const grossEarnings = baseGarmentsEarnings + totalAddOnsCommission;

  // 3. Filter advances within date range
  const cycleAdvances = advances.filter((adv) => {
    if (adv.workerId !== worker.id) return false;
    return adv.advanceDate >= startDate && adv.advanceDate <= endDate;
  });

  const totalAdvances = cycleAdvances.reduce(
    (sum, a) => sum + Number(a.amount ?? 0),
    0
  );

  // 4. Calculate Net Payable = Previous Balance + Gross Work Earnings - Total Advances
  const previousBalance = previousBalanceOverride ?? 0;
  const netPayable = Math.round((previousBalance + grossEarnings - totalAdvances) * 100) / 100;

  return {
    worker,
    cyclePreset,
    cycleLabel,
    startDate,
    endDate,
    settlementDate,
    garmentsSummary,
    addOnsSummary,
    allGarments: workerGarments,
    totalGarmentsCount: workerGarments.length,
    baseGarmentsEarnings: Math.round(baseGarmentsEarnings * 100) / 100,
    totalAddOnsCommission: Math.round(totalAddOnsCommission * 100) / 100,
    grossEarnings: Math.round(grossEarnings * 100) / 100,
    advancesList: cycleAdvances,
    totalAdvances: Math.round(totalAdvances * 100) / 100,
    previousBalance: Math.round(previousBalance * 100) / 100,
    netPayable,
  };
}
