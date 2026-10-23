import apiClient from "@/config/ApiClient";
import type {
  ProductionCalendarResponse,
  DayDetailResponse,
  BlockedDateEntity,
  HolidayEntity,
  BlockDateRequest,
  HolidayRequest,
  WorkerAttendanceRequest,
  CapacityConfigRequest,
} from "@/types/productionCalendar";

const BASE = "/production";

// ============================================================
// CALENDAR
// ============================================================

export async function getMonthlyCalendar(
  year?: number,
  month?: number
): Promise<ProductionCalendarResponse> {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const res = await apiClient.get<ProductionCalendarResponse>(`${BASE}/calendar`, { params });
  return res.data;
}

export async function getDayDetails(date: string): Promise<DayDetailResponse> {
  const res = await apiClient.get<DayDetailResponse>(`${BASE}/calendar/${date}`);
  return res.data;
}

export async function isDeliveryAllowed(date: string): Promise<boolean> {
  const res = await apiClient.get<boolean>(`${BASE}/delivery-allowed/${date}`);
  return res.data;
}

// ============================================================
// BLOCKED DATES
// ============================================================

export async function getBlockedDates(): Promise<BlockedDateEntity[]> {
  const res = await apiClient.get<BlockedDateEntity[]>(`${BASE}/blocked-dates`);
  return res.data;
}

export async function blockDate(request: BlockDateRequest): Promise<BlockedDateEntity> {
  const res = await apiClient.post<BlockedDateEntity>(`${BASE}/blocked-dates`, request);
  return res.data;
}

export async function unblockDate(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/blocked-dates/${id}`);
}

// ============================================================
// HOLIDAYS
// ============================================================

export async function getHolidays(): Promise<HolidayEntity[]> {
  const res = await apiClient.get<HolidayEntity[]>(`${BASE}/holidays`);
  return res.data;
}

export async function createHoliday(request: HolidayRequest): Promise<HolidayEntity> {
  const res = await apiClient.post<HolidayEntity>(`${BASE}/holidays`, request);
  return res.data;
}

export async function updateHoliday(id: number, request: HolidayRequest): Promise<HolidayEntity> {
  const res = await apiClient.put<HolidayEntity>(`${BASE}/holidays/${id}`, request);
  return res.data;
}

export async function deleteHoliday(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/holidays/${id}`);
}

// ============================================================
// WORKER ATTENDANCE
// ============================================================

export async function recordAttendance(request: WorkerAttendanceRequest) {
  const res = await apiClient.post(`${BASE}/attendance`, request);
  return res.data;
}

export async function getAttendanceForDate(date: string) {
  const res = await apiClient.get(`${BASE}/attendance/${date}`);
  return res.data;
}

// ============================================================
// CAPACITY OVERRIDE (POWER CUT, etc.)
// ============================================================

export async function setCapacityOverride(request: CapacityConfigRequest) {
  const res = await apiClient.post(`${BASE}/capacity-override`, request);
  return res.data;
}

// ============================================================
// QUICK GARMENT STAGE UPDATE FROM PRODUCTION CALENDAR
// ============================================================

export async function updateGarmentStageStatus(
  garmentId: number,
  status: string,
) {
  const res = await apiClient.patch(`/garments/${garmentId}/status`, null, {
    params: { status },
  });
  return res.data;
}

