import apiClient from "@/config/ApiClient";

import type {
  AddOnRequest,
  AddOnResponse,
  AddOnUpdateRequest,
  AddOnPageResponse,
} from "@/types/addon";

/* =========================================================
   CREATE
   ========================================================= */

export async function createAddOn(
  data: AddOnRequest,
): Promise<AddOnResponse> {
  const response = await apiClient.post<AddOnResponse>(
    "/addons",
    data,
  );

  return response.data;
}

/* =========================================================
   GET ALL
   ========================================================= */

export async function getAddOns(
  page = 0,
  size = 20,
  sort = "name,asc",
): Promise<AddOnPageResponse> {
  const response = await apiClient.get<AddOnPageResponse>(
    "/addons",
    {
      params: {
        page,
        size,
        sort,
      },
    },
  );

  return response.data;
}

/* =========================================================
   GET BY ID
   ========================================================= */

export async function getAddOnById(
  addOnId: number,
): Promise<AddOnResponse> {
  const response = await apiClient.get<AddOnResponse>(
    `/addons/${addOnId}`,
  );

  return response.data;
}

/* =========================================================
   UPDATE
   ========================================================= */

export async function updateAddOn(
  addOnId: number,
  data: AddOnUpdateRequest,
): Promise<AddOnResponse> {
  const response = await apiClient.patch<AddOnResponse>(
    `/addons/${addOnId}`,
    data,
  );

  return response.data;
}

/* =========================================================
   DELETE
   ========================================================= */

export async function deleteAddOn(
  addOnId: number,
): Promise<void> {
  await apiClient.delete(`/addons/${addOnId}`);
}

/* =========================================================
   STATUS
   ========================================================= */

export async function updateAddOnStatus(
  addOnId: number,
  active: boolean,
): Promise<AddOnResponse> {
  const response = await apiClient.patch<AddOnResponse>(
    `/addons/${addOnId}/status`,
    null,
    {
      params: {
        active,
      },
    },
  );

  return response.data;
}

/* =========================================================
   SEARCH
   ========================================================= */

export async function searchAddOns(
  keyword: string,
  page = 0,
  size = 20,
  sort = "name,asc",
): Promise<AddOnPageResponse> {
  const response = await apiClient.get<AddOnPageResponse>(
    "/addons/search",
    {
      params: {
        keyword,
        page,
        size,
        sort,
      },
    },
  );

  return response.data;
}

/* =========================================================
   ACTIVE
   ========================================================= */

export async function getActiveAddOns(
  page = 0,
  size = 20,
  sort = "name,asc",
): Promise<AddOnPageResponse> {
  const response = await apiClient.get<AddOnPageResponse>(
    "/addons/active",
    {
      params: {
        page,
        size,
        sort,
      },
    },
  );

  return response.data;
}

/* =========================================================
   INACTIVE
   ========================================================= */

export async function getInactiveAddOns(
  page = 0,
  size = 20,
  sort = "name,asc",
): Promise<AddOnPageResponse> {
  const response = await apiClient.get<AddOnPageResponse>(
    "/addons/inactive",
    {
      params: {
        page,
        size,
        sort,
      },
    },
  );

  return response.data;
}