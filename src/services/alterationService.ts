import apiClient from "@/config/ApiClient";
import type {
  AlterationBatchPayload,
  AlterationBatchResponse,
  AlterationQueueItem,
  AlterationQueueSummary,
} from "@/types/alteration";
import type { PageResponse } from "@/types/order";

export interface AlterationQueueParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const alterationService = {
  async submitBatchAlterations(payload: AlterationBatchPayload): Promise<AlterationBatchResponse> {
    const response = await apiClient.post<AlterationBatchResponse>("/alterations", payload);
    return response.data;
  },

  async getActiveAlterations(page = 0, size = 20) {
    const response = await apiClient.get("/alterations/active", {
      params: { page, size },
    });
    return response.data;
  },

  async getAlterationQueue(params: AlterationQueueParams = {}): Promise<PageResponse<AlterationQueueItem>> {
    const response = await apiClient.get<PageResponse<AlterationQueueItem>>("/alterations/queue", {
      params,
    });
    return response.data;
  },

  async getAlterationQueueSummary(): Promise<AlterationQueueSummary> {
    const response = await apiClient.get<AlterationQueueSummary>("/alterations/summary");
    return response.data;
  },

  async quickDeliverAlteration(garmentId: number, note?: string) {
    const response = await apiClient.post(`/alterations/${garmentId}/deliver`, null, {
      params: note ? { note } : {},
    });
    return response.data;
  },
};

export default alterationService;
