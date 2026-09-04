import apiClient from "@/config/ApiClient";
import { apiRootClient } from "@/config/ApiClient";

import type {
    GarmentStatus,
    OrderPageParams,
    OrderRequest,
    OrderResponse,
    PageResponse,
} from "@/types/order";
import type {
    MeasurementRequest,
    MeasurementResponse,
} from "@/types/measurement";
import type { BillingPaymentMethod } from "@/types/billing";

export interface AdditionalChargeRequest {
    description: string;
    amount: number;
}

export interface PaymentRequest {
    orderId: number;
    amount: number;
    paymentMethod: BillingPaymentMethod;
    paymentType: "ADVANCE" | "PARTIAL" | "FINAL";
    paidAt?: string;
    note?: string;
}

export interface GarmentRequest {
    orderId: number;
    serviceId: number;
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

export interface GarmentAddOnRequest {
    garmentId: number;
    addOnId: number;
    quantity: number;
    note?: string;
}

export interface GarmentMeasurementRequest {
    garmentId: number;
    measurementFields: Record<string, string | number | null>;
    alteration: Record<string, unknown>;
    note?: string;
    alterationNote?: string;
    editable?: boolean;
}

// Aggregate order contract exposed by POST /api/orders.
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
        addOns?: Array<{ addOnId: number; quantity: number }>;
        note?: string;
    }>;
    additionalCharges?: AdditionalChargeRequest[];
    payment: {
        amount: number;
        paymentMethod: BillingPaymentMethod;
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
            >(
                "/orders",
                {
                    params: {
                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
                    },
                },
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
            >(
                "/orders/search",
                {
                    params: {
                        keyword:
                            keyword.trim(),

                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
                    },
                },
            );

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
                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
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

    async createMeasurement(
        data: MeasurementRequest,
    ): Promise<MeasurementResponse> {
        const response = await apiClient.post<MeasurementResponse>(
            "/measurements",
            data,
        );
        return response.data;
    },

    async addCharge(
        orderId: number,
        data: AdditionalChargeRequest,
    ): Promise<unknown> {
        const response = await apiClient.post(
            `/payments/order/${orderId}/charges`,
            data,
        );
        return response.data;
    },

    async createPayment(
        data: PaymentRequest,
    ): Promise<unknown> {
        const response = await apiClient.post("/payments", data);
        return response.data;
    },

    async createGarment(data: GarmentRequest): Promise<GarmentResponse> {
        const response = await apiClient.post<GarmentResponse>("/garments", data);
        return response.data;
    },

    async addGarmentAddOn(data: GarmentAddOnRequest): Promise<unknown> {
        const response = await apiClient.post("/garment-addons", data);
        return response.data;
    },

    async createGarmentMeasurement(
        data: GarmentMeasurementRequest,
    ): Promise<unknown> {
        const response = await apiClient.post("/garment-measurements", data);
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
                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
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
            >(
                "/orders/date-range",
                {
                    params: {
                        startDate,

                        endDate,

                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
                    },
                },
            );

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
                        page:
                            params.page ?? 0,

                        size:
                            params.size ??
                            DEFAULT_SIZE,

                        sort:
                            params.sort ??
                            DEFAULT_SORT,
                    },
                },
            );

        return response.data;
    },

};

/**
 * Endpoints from the newer aggregate-order backend. They deliberately use the
 * root API client because their paths begin with /api, not /api/v1.
 */
export const aggregateOrderService = {
    async createOrder(data: AggregateOrderRequest): Promise<AggregateOrderResponse> {
        const response = await apiRootClient.post<AggregateOrderResponse>("/api/orders", data);
        return response.data;
    },

    async createMeasurementProfile(customerId: number, serviceId: number, name: string): Promise<number> {
        const response = await apiRootClient.post<number>(
            `/api/customers/${customerId}/measurements/profiles`,
            { serviceId, name },
        );
        return response.data;
    },

    async createMeasurementVersion(customerId: number, profileId: number, measurementFields: Record<string, string | number | null>, note?: string): Promise<{ id: number }> {
        const response = await apiRootClient.post<{ id: number }>(
            `/api/customers/${customerId}/measurements/versions`,
            { profileId, measurementFields, note },
        );
        return response.data;
    },

    async createMeasurementVersionFromExisting(customerId: number, measurementId: number, measurementFields: Record<string, string | number | null>, note?: string): Promise<{ id: number }> {
        const response = await apiRootClient.post<{ id: number }>(
            `/api/customers/${customerId}/measurements/${measurementId}/versions`,
            { measurementFields, note },
        );
        return response.data;
    },
};
