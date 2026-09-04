import apiClient from "@/config/ApiClient";
import { APP_CONFIG } from "@/config/appConfig";

import type {
  CustomerResponse,
  CustomerPageResponse,
} from "@/models/Customer";

export type {
  CustomerPageResponse,
  CustomerSummary,
} from "@/models/Customer";

import type {
  CustomerCreateRequest,
} from "@/models/CustomerCreateRequest";

// =========================================================
// DEFAULT PAGINATION
// =========================================================

const DEFAULT_PAGE_SIZE =
  APP_CONFIG.customers.pageSize;

const DEFAULT_SORT = "createdAt,desc";

// =========================================================
// CREATE CUSTOMER
// POST /customers
// =========================================================

export const createCustomer = async (
  customerData: CustomerCreateRequest,
): Promise<CustomerResponse> => {
  const response =
    await apiClient.post<CustomerResponse>(
      "/customers",
      customerData,
    );

  return response.data;
};

// =========================================================
// GET CUSTOMERS
// GET /customers
// =========================================================

export const getCustomers = async (
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<CustomerPageResponse> => {
  const response =
    await apiClient.get<CustomerPageResponse>(
      "/customers",
      {
        params: {
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
};

// =========================================================
// SEARCH CUSTOMERS
// GET /customers/search
// =========================================================

export const searchCustomers = async (
  keyword: string,
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
  sort: string = DEFAULT_SORT,
): Promise<CustomerPageResponse> => {
  const response =
    await apiClient.get<CustomerPageResponse>(
      "/customers/search",
      {
        params: {
          keyword: keyword.trim(),
          page,
          size,
          sort,
        },
      },
    );

  return response.data;
};

// =========================================================
// GET CUSTOMER BY ID
// GET /customers/{customerId}
// =========================================================

export const getCustomerById = async (
  customerId: number,
): Promise<CustomerResponse> => {
  const response =
    await apiClient.get<CustomerResponse>(
      `/customers/${customerId}`,
    );

  return response.data;
};

// =========================================================
// UPDATE CUSTOMER
// PUT /customers/{customerId}
// =========================================================

export const updateCustomer = async (
  customerId: number,
  customerData: Partial<CustomerCreateRequest>,
): Promise<CustomerResponse> => {
  const response =
    await apiClient.put<CustomerResponse>(
      `/customers/${customerId}`,
      customerData,
    );

  return response.data;
};

// =========================================================
// DELETE CUSTOMER
// DELETE /customers/{customerId}
// =========================================================

export const deleteCustomer = async (
  customerId: number,
): Promise<void> => {
  await apiClient.delete(
    `/customers/${customerId}`,
  );
};
