export type MeasurementPrimitive = string | number | null;

export type MeasurementFieldValues = Record<string, MeasurementPrimitive>;

export interface MeasurementFieldDefinition {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
  unit?: string | null;
  type?: string | null;
  displayOrder?: number;
}

export interface ServiceMeasurementField {
  fieldId: number;
  unit?: string | null;
  required?: boolean;
  type?: string | null;
  displayOrder?: number;
}

export interface ServiceMeasurementConfig {
  id: number;
  name: string;
  measurementFields: ServiceMeasurementField[];
}

export interface MeasurementSourceSummary {
  id: number;
  userId?: number;
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
  content: MeasurementSourceSummary[];
  empty: boolean;
}

export interface MeasurementDraft {
  serviceId: number;
  serviceName: string;
  measurementFields: MeasurementFieldValues;
  note: string;
  alterationNote: string;
  sourceMeasurementId?: number | null;
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
  note?: string;
  alterationNote?: string;
  editable?: boolean;
}
