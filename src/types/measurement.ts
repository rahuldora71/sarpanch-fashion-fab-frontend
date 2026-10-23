export type MeasurementPrimitive = string | number | null;

export type MeasurementFieldValues = Record<string, MeasurementPrimitive>;

export interface MeasurementFieldDefinition {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
  unit?: string | null;
  type?: string | null;
  displayOrder?: number | null;
}

export interface ServiceMeasurementField {
  fieldId: number;
  unit?: string | null;
  required?: boolean;
  type?: string | null;
  displayOrder?: number | null;
}

export interface ServiceMeasurementConfig {
  id: number;
  name: string;
  measurementFields: ServiceMeasurementField[];
}

export interface MeasurementSourceSummary {
  id: number;
  userId?: number;
  customerId?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  garmentId?: number | null;
  orderId?: number | null;
  serviceId: number;
  serviceName: string;
  measurementFields: MeasurementFieldValues;
  takenByUserId?: number | null;
  editable?: boolean;
  note?: string | null;
  alterationNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementResponse extends MeasurementSourceSummary {
  id: number;
}

export interface MeasurementPageResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  content: MeasurementResponse[];
  empty: boolean;
}

export interface MeasurementDraft {
  serviceId: number;
  serviceName: string;

  measurementFields: MeasurementFieldValues;

  note: string;
  alterationNote: string;

  /**
   * ID of the existing measurement this draft was copied from.
   *
   * The ID is intentionally retained even when the user edits
   * measurement fields. The backend decides whether the values
   * still match the existing measurement.
   */
  sourceMeasurementId: number | null;
}

export interface MeasurementUpdateRequest {
  measurementFields: MeasurementFieldValues;
  note?: string;
  alterationNote?: string;
  editable?: boolean;
}

export interface MeasurementRequest {
  userId: number;
  serviceId: number;
  measurementFields: MeasurementFieldValues;
  alteration?: Record<string, unknown>;
  note?: string;
  alterationNote?: string;
  editable?: boolean;
  takenByUserId?: number;
}
