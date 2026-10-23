import apiClient, {
  apiRootClient,
} from "@/config/ApiClient";

import type {
  GarmentStatus,
  OrderDetailsResponse,
  OrderPageParams,
  OrderRequest,
  OrderResponse,
  PageResponse,
  PaymentMethod,
  PaymentType,
  OrderDeliveryRequest,
  OrderDeliveryResponse,
} from "@/types/order";

import type {
  MeasurementRequest,
  MeasurementResponse,
} from "@/types/measurement";

// =========================================================
// PAYMENT
// =========================================================

export interface PaymentRequest {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  receivedById: number;
  paidAt?: string;
  note?: string | null;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paidAt: string;
  note?: string | null;
  receivedByUserId?: number | null;
}

// =========================================================
// ADDITIONAL CHARGE
// =========================================================

export interface AdditionalChargeRequest {
  description: string;
  amount: number;
}

// =========================================================
// GARMENT
// =========================================================

export interface GarmentRequest {
  orderId: number;
  serviceId: number;

  /**
   * Final garment price, including selected add-ons.
   */
  price?: number;

  sampleNumber?: string;
  customerFabric?: boolean;
  tryDate?: string;
  dueDate?: string;
  note?: string;
  alterationNote?: string;
}

export interface GarmentResponse {
  id: number;
  orderId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  dueDate?: string | null;
}

// =========================================================
// GARMENT MEASUREMENT
// =========================================================

export interface GarmentMeasurementResponse {
  id: number;
  garmentId: number;
  orderId: number;
  customerId: number;
  serviceId: number;
  serviceName: string;

  measurementFields: Record<
    string,
    string | number | null
  >;

  takenByUserId?: number | null;
  editable?: boolean;
  note?: string | null;
  alterationNote?: string | null;
}

export interface GarmentMeasurementRequest {
  garmentId: number;

  measurementFields: Record<
    string,
    string | number | null
  >;

  alteration?: Record<string, unknown>;
  note?: string | null;
  alterationNote?: string | null;
  editable?: boolean;

  /**
   * ID of the authenticated user taking this measurement.
   */
  takenByUserId: number;
}

// =========================================================
// GARMENT ADD-ON
// =========================================================

export interface GarmentAddOnRequest {
  garmentId: number;
  addOnId: number;
  quantity: number;
  note?: string;
}

// =========================================================
// AGGREGATE ORDER
// =========================================================

/**
 * Aggregate order contract exposed by POST /api/orders.
 *
 * This belongs to the newer aggregate-order backend
 * and therefore uses apiRootClient.
 */
export interface AggregateOrderRequest {
  customerId: number;
  orderDate: string;
  sampleBookPageNumber?: string;

  garments: Array<{
    serviceId: number;
    sampleNumber: string;
    dueDate: string;
    customerFabric: boolean;
    measurementId: number;

    addOns?: Array<{
      addOnId: number;
      quantity: number;
    }>;

    note?: string;
  }>;

  additionalCharges?: AdditionalChargeRequest[];

  payment: {
    amount: number;
    paymentMethod: PaymentMethod;
    note?: string;
  };
}

export interface AggregateOrderResponse {
  id: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_SIZE = 10;
const DEFAULT_SORT = "orderDate,desc";

// =========================================================
// ORDER SERVICE
// =========================================================

export const orderService = {
  // =======================================================
  // GET ALL ORDERS
  // =======================================================

  async getAllOrders(
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >("/orders", {
        params: {
          page: params.page ?? 0,
          size: params.size ?? DEFAULT_SIZE,
          sort: params.sort ?? DEFAULT_SORT,
        },
      });

    return response.data;
  },

  // =======================================================
  // GET ORDER DETAILS
  // =======================================================

  async getOrderDetails(
    orderId: number,
  ): Promise<OrderDetailsResponse> {
    const response =
      await apiClient.get<OrderDetailsResponse>(
        `/orders/${orderId}/details`,
      );

    return response.data;
  },

  // =======================================================
  // SEARCH ORDERS
  // =======================================================

  async searchOrders(
    keyword: string,
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >("/orders/search", {
        params: {
          keyword: keyword.trim(),
          page: params.page ?? 0,
          size: params.size ?? DEFAULT_SIZE,
          sort: params.sort ?? DEFAULT_SORT,
        },
      });

    return response.data;
  },

  // =======================================================
  // GET ORDERS BY GARMENT STATUS
  // =======================================================

  async getOrdersByStatus(
    status: GarmentStatus,
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >(
        `/orders/status/${encodeURIComponent(status)}`,
        {
          params: {
            page: params.page ?? 0,
            size: params.size ?? DEFAULT_SIZE,
            sort: params.sort ?? DEFAULT_SORT,
          },
        },
      );

    return response.data;
  },

  // =======================================================
  // GET ORDER BY ID
  // =======================================================

  async getOrderById(
    orderId: number,
  ): Promise<OrderResponse> {
    const response =
      await apiClient.get<OrderResponse>(
        `/orders/${orderId}`,
      );

    return response.data;
  },

  // =======================================================
  // CREATE ORDER
  // =======================================================

  async createOrder(
    data: OrderRequest,
  ): Promise<OrderResponse> {
    const response =
      await apiClient.post<OrderResponse>(
        "/orders",
        data,
      );

    return response.data;
  },

  // =======================================================
  // CREATE MEASUREMENT
  // =======================================================

  async createMeasurement(
    data: MeasurementRequest,
  ): Promise<MeasurementResponse> {
    const response =
      await apiClient.post<MeasurementResponse>(
        "/measurements",
        data,
      );

    return response.data;
  },

  // =======================================================
  // ADD ADDITIONAL CHARGE
  // =======================================================

  async addCharge(
    orderId: number,
    data: AdditionalChargeRequest,
  ): Promise<unknown> {
    const response =
      await apiClient.post(
        `/payments/order/${orderId}/charges`,
        data,
      );

    return response.data;
  },

  // =======================================================
  // CREATE PAYMENT
  // =======================================================

  async createPayment(
    data: PaymentRequest,
  ): Promise<PaymentResponse> {
    const response =
      await apiClient.post<PaymentResponse>(
        "/payments",
        data,
      );

    return response.data;
  },

  // =======================================================
  // CREATE GARMENT
  // =======================================================

  async createGarment(
    data: GarmentRequest,
  ): Promise<GarmentResponse> {
    const response =
      await apiClient.post<GarmentResponse>(
        "/garments",
        data,
      );

    return response.data;
  },

  // =======================================================
  // ADD GARMENT ADD-ON
  // =======================================================

  async addGarmentAddOn(
    data: GarmentAddOnRequest,
  ): Promise<unknown> {
    const response =
      await apiClient.post(
        "/garment-addons",
        data,
      );

    return response.data;
  },

  // =======================================================
  // CREATE GARMENT MEASUREMENT
  // =======================================================

  async createGarmentMeasurement(
    data: GarmentMeasurementRequest,
  ): Promise<GarmentMeasurementResponse> {
    const response =
      await apiClient.post<GarmentMeasurementResponse>(
        "/garment-measurements",
        data,
      );

    return response.data;
  },

  // =======================================================
  // UPDATE ORDER
  // =======================================================

  async updateOrder(
    orderId: number,
    data: OrderRequest,
  ): Promise<OrderResponse> {
    const response =
      await apiClient.patch<OrderResponse>(
        `/orders/${orderId}`,
        data,
      );

    return response.data;
  },

  // =======================================================
  // DELETE ORDER
  // =======================================================

  async deleteOrder(
    orderId: number,
  ): Promise<void> {
    await apiClient.delete(
      `/orders/${orderId}`,
    );
  },

  // =======================================================
  // ORDERS BY DATE
  // =======================================================

  async getOrdersByDate(
    orderDate: string,
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >(
        `/orders/date/${encodeURIComponent(orderDate)}`,
        {
          params: {
            page: params.page ?? 0,
            size: params.size ?? DEFAULT_SIZE,
            sort: params.sort ?? DEFAULT_SORT,
          },
        },
      );

    return response.data;
  },

  // =======================================================
  // ORDERS BY DATE RANGE
  // =======================================================

  async getOrdersByDateRange(
    startDate: string,
    endDate: string,
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >("/orders/date-range", {
        params: {
          startDate,
          endDate,
          page: params.page ?? 0,
          size: params.size ?? DEFAULT_SIZE,
          sort: params.sort ?? DEFAULT_SORT,
        },
      });

    return response.data;
  },

  // =======================================================
  // ORDERS BY CUSTOMER
  // =======================================================

  async getOrdersByCustomer(
    customerId: number,
    params: OrderPageParams = {},
  ): Promise<PageResponse<OrderResponse>> {
    const response =
      await apiClient.get<
        PageResponse<OrderResponse>
      >(
        `/orders/customer/${customerId}`,
        {
          params: {
            page: params.page ?? 0,
            size: params.size ?? DEFAULT_SIZE,
            sort: params.sort ?? DEFAULT_SORT,
          },
        },
      );

    return response.data;
  },

  // =======================================================
  // DELIVER ORDER / GARMENTS
  // =======================================================

  async deliverOrderGarments(
    orderId: number,
    payload: OrderDeliveryRequest,
  ): Promise<OrderDeliveryResponse> {
    const response = await apiClient.post<OrderDeliveryResponse>(
      `/orders/${orderId}/deliver`,
      payload,
    );
    return response.data;
  },
};

// =========================================================
// AGGREGATE ORDER SERVICE
// =========================================================

/**
 * Endpoints from the newer aggregate-order backend.
 *
 * These deliberately use apiRootClient because their
 * paths begin with /api rather than /api/v1.
 */
export const aggregateOrderService = {
  // =======================================================
  // CREATE AGGREGATE ORDER
  // =======================================================

  async createOrder(
    data: AggregateOrderRequest,
  ): Promise<AggregateOrderResponse> {
    const response =
      await apiRootClient.post<AggregateOrderResponse>(
        "/api/orders",
        data,
      );

    return response.data;
  },

  // =======================================================
  // CREATE MEASUREMENT PROFILE
  // =======================================================

  async createMeasurementProfile(
    customerId: number,
    serviceId: number,
    name: string,
  ): Promise<number> {
    const response =
      await apiRootClient.post<number>(
        `/api/customers/${customerId}/measurements/profiles`,
        {
          serviceId,
          name,
        },
      );

    return response.data;
  },

  // =======================================================
  // CREATE MEASUREMENT VERSION
  // =======================================================

  async createMeasurementVersion(
    customerId: number,
    profileId: number,
    measurementFields: Record<
      string,
      string | number | null
    >,
    note?: string,
  ): Promise<{ id: number }> {
    const response =
      await apiRootClient.post<{
        id: number;
      }>(
        `/api/customers/${customerId}/measurements/versions`,
        {
          profileId,
          measurementFields,
          note,
        },
      );

    return response.data;
  },

  // =======================================================
  // CREATE MEASUREMENT VERSION FROM EXISTING
  // =======================================================

  async createMeasurementVersionFromExisting(
    customerId: number,
    measurementId: number,
    measurementFields: Record<
      string,
      string | number | null
    >,
    note?: string,
  ): Promise<{ id: number }> {
    const response =
      await apiRootClient.post<{
        id: number;
      }>(
        `/api/customers/${customerId}/measurements/${measurementId}/versions`,
        {
          measurementFields,
          note,
        },
      );

    return response.data;
  },

  // =======================================================
  // DELIVER ORDER / GARMENTS
  // =======================================================

  async deliverOrderGarments(
    orderId: number,
    payload: OrderDeliveryRequest
  ): Promise<OrderDeliveryResponse> {
    const response = await apiClient.post<OrderDeliveryResponse>(
      `/orders/${orderId}/deliver`,
      payload
    );
    return response.data;
  },
};