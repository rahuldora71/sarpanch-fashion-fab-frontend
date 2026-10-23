import apiClient from "@/config/ApiClient";

export interface MessageLog {
  id: number;
  orderId?: number;
  orderNumber?: number;
  customerId?: number;
  customerName?: string;
  recipientPhone: string;
  channel: "WHATSAPP" | "SMS" | string;
  messageType: string;
  messageContent: string;
  trackingUrl?: string;
  status: "SENT" | "DELIVERED" | "CLICKED" | "FAILED" | string;
  sentBy?: string;
  sentAt: string;
  clickedAt?: string;
}

export interface OrderAccessLog {
  id: number;
  orderId?: number;
  orderNumber?: number;
  trackingToken?: string;
  customerName?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: "MOBILE" | "TABLET" | "DESKTOP" | string;
  accessedAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  entityName: string;
  entityId: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface CommunicationStats {
  totalMessages: number;
  whatsappCount: number;
  smsCount: number;
  deliveredCount: number;
  clickedCount: number;
  clickThroughRate: number;
  todayMessages: number;
  todayAccesses: number;
  totalCustomerAccesses: number;
}

export interface SendWhatsAppRequest {
  orderId?: number;
  customerId?: number;
  customerName?: string;
  phone: string;
  channel?: "WHATSAPP" | "SMS";
  messageType?: string;
  customMessage?: string;
}

export interface SendWhatsAppResponse {
  logId: number;
  whatsappUrl: string;
  recipientPhone: string;
  messageContent: string;
  trackingUrl: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const communicationService = {
  /**
   * Fetches paginated WhatsApp & SMS communication logs with filters.
   */
  async getMessageLogs(params?: {
    channel?: string;
    messageType?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MessageLog>> {
    const res = await apiClient.get<PageResponse<MessageLog>>("/communication/logs", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        channel: params?.channel,
        messageType: params?.messageType,
        status: params?.status,
        search: params?.search,
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
    });
    return res.data;
  },

  /**
   * Fetches customer tracking link access logs.
   */
  async getAccessLogs(params?: {
    search?: string;
    deviceType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<OrderAccessLog>> {
    const res = await apiClient.get<PageResponse<OrderAccessLog>>("/communication/access-logs", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        search: params?.search,
        deviceType: params?.deviceType,
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
    });
    return res.data;
  },

  /**
   * Fetches staff & system audit logs.
   */
  async getAuditLogs(params?: {
    search?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AuditLog>> {
    const res = await apiClient.get<PageResponse<AuditLog>>("/communication/audit-logs", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        search: params?.search,
        action: params?.action,
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
    });
    return res.data;
  },

  /**
   * Fetches communication and customer engagement KPI statistics.
   */
  async getStats(): Promise<CommunicationStats> {
    const res = await apiClient.get<CommunicationStats>("/communication/stats");
    return res.data;
  },

  /**
   * Prepares and logs a WhatsApp message, returning direct wa.me URL.
   */
  async sendWhatsApp(payload: SendWhatsAppRequest): Promise<SendWhatsAppResponse> {
    const res = await apiClient.post<SendWhatsAppResponse>("/communication/whatsapp", payload);
    return res.data;
  },
};
