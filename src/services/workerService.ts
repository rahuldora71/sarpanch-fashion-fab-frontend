import ApiClient from "@/config/ApiClient";
import type {
  Worker,
  WorkerRequest,
  WorkAllocationItem,
  AllocateWorkRequest,
} from "@/types/worker";

const BASE = "/workers";

export async function getAllWorkers(keyword?: string): Promise<Worker[]> {
  const { data } = await ApiClient.get<Worker[]>(BASE, {
    params: keyword && keyword.trim() ? { keyword: keyword.trim() } : undefined,
  });
  return data;
}

export async function getWorkerById(workerId: number): Promise<Worker> {
  const { data } = await ApiClient.get<Worker>(`${BASE}/${workerId}`);
  return data;
}

export async function createWorker(request: WorkerRequest): Promise<Worker> {
  const { data } = await ApiClient.post<Worker>(BASE, request);
  return data;
}

export async function updateWorker(
  workerId: number,
  request: WorkerRequest
): Promise<Worker> {
  const { data } = await ApiClient.put<Worker>(`${BASE}/${workerId}`, request);
  return data;
}

export async function updateWorkerCapacity(
  workerId: number,
  dailyCapacity: number
): Promise<Worker> {
  const { data } = await ApiClient.patch<Worker>(
    `${BASE}/${workerId}/capacity`,
    null,
    { params: { dailyCapacity } }
  );
  return data;
}

export async function updateWorkerStatus(
  workerId: number,
  active: boolean
): Promise<Worker> {
  const { data } = await ApiClient.patch<Worker>(
    `${BASE}/${workerId}/status`,
    null,
    { params: { active } }
  );
  return data;
}

export async function deleteWorker(workerId: number): Promise<void> {
  await ApiClient.delete(`${BASE}/${workerId}`);
}

// ============================================================
// WORK ALLOCATION & READY CHECK
// ============================================================

export interface WorkAllocationQueryParams {
  workerId?: number;
  status?: string;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  stage?: "PENDING_ALLOTMENT" | "READY_QUEUE" | "HISTORY" | string;
}

export async function getWorkAllocations(
  queryOrWorkerId?: number | WorkAllocationQueryParams,
  legacyStatus?: string
): Promise<WorkAllocationItem[]> {
  const params: Record<string, unknown> = {};

  if (typeof queryOrWorkerId === "number") {
    params.workerId = queryOrWorkerId;
    if (legacyStatus && legacyStatus !== "ALL") {
      params.status = legacyStatus;
    }
  } else if (queryOrWorkerId && typeof queryOrWorkerId === "object") {
    if (queryOrWorkerId.workerId) params.workerId = queryOrWorkerId.workerId;
    if (queryOrWorkerId.status && queryOrWorkerId.status !== "ALL") {
      params.status = queryOrWorkerId.status;
    }
    if (queryOrWorkerId.serviceId) params.serviceId = queryOrWorkerId.serviceId;
    if (queryOrWorkerId.startDate) params.startDate = queryOrWorkerId.startDate;
    if (queryOrWorkerId.endDate) params.endDate = queryOrWorkerId.endDate;
    if (queryOrWorkerId.stage && queryOrWorkerId.stage !== "ALL") {
      params.stage = queryOrWorkerId.stage;
    }
  }

  const { data } = await ApiClient.get<WorkAllocationItem[]>(
    `${BASE}/allocations`,
    { params }
  );
  return data;
}

export async function allocateWorkToWorker(
  workerId: number,
  garmentIds: number[],
  note?: string
): Promise<WorkAllocationItem[]> {
  const body: AllocateWorkRequest = { workerId, garmentIds, note };
  const { data } = await ApiClient.post<WorkAllocationItem[]>(
    `${BASE}/allocations/assign`,
    body
  );
  return data;
}

export async function markAllocatedGarmentReady(
  garmentId: number,
  ready: boolean = true
): Promise<WorkAllocationItem> {
  const { data } = await ApiClient.patch<WorkAllocationItem>(
    `${BASE}/allocations/${garmentId}/ready`,
    null,
    { params: { ready } }
  );
  return data;
}
