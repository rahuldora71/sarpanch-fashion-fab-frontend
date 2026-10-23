import apiClient from "@/config/ApiClient";
import { APP_CONFIG } from "@/config/appConfig";

import type {
  CustomerPageResponse,
  CustomerProfileResponse,
  CustomerResponse,
} from "@/models/Customer";

export type {
  CustomerPageResponse,
  CustomerProfileResponse,
  CustomerResponse,
  CustomerSummary,
} from "@/models/Customer";

import type { CustomerCreateRequest } from "@/models/CustomerCreateRequest";

const DEFAULT_PAGE_SIZE = APP_CONFIG.customers.pageSize;
const DEFAULT_SORT = "createdAt,desc";

export const createCustomer = async (
  customerData: CustomerCreateRequest,
): Promise<CustomerResponse> => {
  const response = await apiClient.post<CustomerResponse>(
    "/customers",
    customerData,
  );
  return response.data;
};

export const getCustomers = async (
  page = 0,
  size = DEFAULT_PAGE_SIZE,
  sort = DEFAULT_SORT,
): Promise<CustomerPageResponse> => {
  const response = await apiClient.get<CustomerPageResponse>("/customers", {
    params: { page, size, sort },
  });
  return response.data;
};

export const searchCustomers = async (
  keyword: string,
  page = 0,
  size = DEFAULT_PAGE_SIZE,
  sort = DEFAULT_SORT,
): Promise<CustomerPageResponse> => {
  const response = await apiClient.get<CustomerPageResponse>(
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

export const getCustomerById = async (
  customerId: number,
): Promise<CustomerResponse> => {
  const response = await apiClient.get<CustomerResponse>(
    `/customers/${customerId}`,
  );
  return response.data;
};

/** Single API call for the complete customer profile page. */
export const getCustomerProfile = async (
  customerId: number,
): Promise<CustomerProfileResponse> => {
  const response = await apiClient.get<CustomerProfileResponse>(
    `/customers/${customerId}/profile`,
  );
  return response.data;
};

export const updateCustomer = async (
  customerId: number,
  customerData: Partial<CustomerCreateRequest>,
): Promise<CustomerResponse> => {
  const response = await apiClient.put<CustomerResponse>(
    `/customers/${customerId}`,
    customerData,
  );
  return response.data;
};

export const deleteCustomer = async (customerId: number): Promise<void> => {
  await apiClient.delete(`/customers/${customerId}`);
};

/** Update customer profile picture */
export const updateCustomerProfilePicture = async (
  customerId: number,
  data: { imageUrl: string; publicId?: string },
): Promise<CustomerResponse> => {
  const response = await apiClient.put<CustomerResponse>(
    `/customers/${customerId}/profile-picture`,
    data,
  );
  return response.data;
};

/** Remove customer profile picture */
export const removeCustomerProfilePicture = async (
  customerId: number,
): Promise<CustomerResponse> => {
  const response = await apiClient.delete<CustomerResponse>(
    `/customers/${customerId}/profile-picture`,
  );
  return response.data;
};

/** Get customer posture / fitting photos */
export const getCustomerImages = async (
  customerId: number,
): Promise<import("@/models/Customer").CustomerUserImage[]> => {
  const response = await apiClient.get<import("@/models/Customer").CustomerUserImage[]>(
    `/customers/${customerId}/images`,
  );
  return response.data;
};

/** Add a new posture / fitting photo */
export const addCustomerImage = async (
  customerId: number,
  data: { imageUrl: string; publicId?: string; purpose?: string },
): Promise<import("@/models/Customer").CustomerUserImage> => {
  const response = await apiClient.post<import("@/models/Customer").CustomerUserImage>(
    `/customers/${customerId}/images`,
    data,
  );
  return response.data;
};

/** Delete a posture photo */
export const deleteCustomerImage = async (
  customerId: number,
  imageId: number,
): Promise<void> => {
  await apiClient.delete(`/customers/${customerId}/images/${imageId}`);
};
