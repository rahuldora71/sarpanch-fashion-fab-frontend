import apiClient from "@/config/ApiClient";
import type {
  CuttingQueueResponse,
  CuttingWorkspaceResponse,
  GarmentResponse,
  MarkAsCutRequest,
} from "@/types/cutting";

const BASE = "/cutting";

// ============================================================
// GET CUTTING QUEUE
// ============================================================

export async function getCuttingQueue(
  startDate?: string,
  endDate?: string
): Promise<CuttingQueueResponse> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await apiClient.get<CuttingQueueResponse>(`${BASE}/queue`, { params });
  return res.data;
}

// ============================================================
// GET CUTTING WORKSPACE FOR AN ORDER
// ============================================================

export async function getCuttingWorkspace(
  orderId: number
): Promise<CuttingWorkspaceResponse> {
  const res = await apiClient.get<CuttingWorkspaceResponse>(
    `${BASE}/orders/${orderId}`
  );
  return res.data;
}

// ============================================================
// MARK GARMENT AS CUT
// ============================================================

export async function markGarmentAsCut(
  garmentId: number,
  request?: MarkAsCutRequest
): Promise<GarmentResponse> {
  const res = await apiClient.patch<GarmentResponse>(
    `${BASE}/garments/${garmentId}/cut`,
    request ?? {}
  );
  return res.data;
}

// ============================================================
// REVERT CUT (back to FABRIC_CUT)
// ============================================================

export async function revertGarmentCut(garmentId: number): Promise<GarmentResponse> {
  const res = await apiClient.patch<GarmentResponse>(
    `${BASE}/garments/${garmentId}/revert-cut`
  );
  return res.data;
}
