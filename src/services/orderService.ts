import apiClient from "@/config/ApiClient";

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
    ): Promise<void> {
        await apiClient.post(
            `/payments/order/${orderId}/charges`,
            data,
        );
    },

    async createPayment(
        data: PaymentRequest,
    ): Promise<void> {
        await apiClient.post("/payments", data);
    },

    async createGarment(data: GarmentRequest): Promise<GarmentResponse> {
        const response = await apiClient.post<GarmentResponse>("/garments", data);
        return response.data;
    },

    async addGarmentAddOn(data: GarmentAddOnRequest): Promise<void> {
        await apiClient.post("/garment-addons", data);
    },

    async createGarmentMeasurement(
        data: GarmentMeasurementRequest,
    ): Promise<void> {
        await apiClient.post("/garment-measurements", data);
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
