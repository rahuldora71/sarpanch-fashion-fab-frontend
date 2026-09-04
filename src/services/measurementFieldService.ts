import apiClient from "@/config/ApiClient";

import type {
  MeasurementField,
  MeasurementFieldCreateRequest,
  MeasurementFieldUpdateRequest,
  MeasurementFieldPageResponse,
} from "@/types/measurementField";


// =========================================================
// GET ALL MEASUREMENT FIELDS
// =========================================================

export const getMeasurementFields = async (
  page: number = 0,
  size: number = 100,
  sort: string = "name,asc",
): Promise<MeasurementFieldPageResponse> => {

  const response =
    await apiClient.get<MeasurementFieldPageResponse>(
      "/fields",
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
// SEARCH MEASUREMENT FIELDS
// =========================================================

export const searchMeasurementFields = async (
  keyword: string,
  page: number = 0,
  size: number = 100,
  sort: string = "name,asc",
): Promise<MeasurementFieldPageResponse> => {

  const response =
    await apiClient.get<MeasurementFieldPageResponse>(
      "/fields/search",
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
// GET FIELD BY ID
// =========================================================

export const getMeasurementFieldById =
  async (
    fieldId: number,
  ): Promise<MeasurementField> => {

    const response =
      await apiClient.get<MeasurementField>(
        `/fields/${fieldId}`,
      );

    return response.data;
  };


// =========================================================
// CREATE FIELD
// =========================================================

export const createMeasurementField =
  async (
    data: MeasurementFieldCreateRequest,
  ): Promise<MeasurementField> => {

    const response =
      await apiClient.post<MeasurementField>(
        "/fields",
        data,
      );

    return response.data;
  };


// =========================================================
// UPDATE FIELD
// =========================================================

export const updateMeasurementField =
  async (
    fieldId: number,
    data: MeasurementFieldUpdateRequest,
  ): Promise<MeasurementField> => {

    const response =
      await apiClient.patch<MeasurementField>(
        `/fields/${fieldId}`,
        data,
      );

    return response.data;
  };


// =========================================================
// DELETE FIELD
// =========================================================

export const deleteMeasurementField =
  async (
    fieldId: number,
  ): Promise<void> => {

    await apiClient.delete(
      `/fields/${fieldId}`,
    );
  };