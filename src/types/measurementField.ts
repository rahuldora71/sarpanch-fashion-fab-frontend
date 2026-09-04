export interface MeasurementFieldDefinition {
  id: number;
  name: string;
  description?: string | null;

  unit?: string | null;
  type?: string | null;
  displayOrder?: number | null;

  active?: boolean;
}

export interface ServiceMeasurementField {
  fieldId: number;
  unit?: string | null;
  required: boolean;
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
  serviceId: number;
  serviceName?: string;

  measurementFields: Record<
    string,
    string | number | null
  >;

  createdAt?: string;
  updatedAt?: string;
  measuredAt?: string;
}

export interface MeasurementDraft {
  serviceId: number;
  serviceName: string;

  measurementFields: Record<
    string,
    string | number | null
  >;

  note: string;
  alterationNote: string;

  sourceMeasurementId: number | null;
}

export interface MeasurementResponse {
  id: number;
  customerId?: number;
  serviceId: number;
  serviceName?: string;

  measurementFields: Record<
    string,
    string | number | null
  >;

  note?: string;
  alterationNote?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementRequest {
  customerId: number;
  serviceId: number;

  measurementFields: Record<
    string,
    string | number | null
  >;

  note?: string;
  alterationNote?: string;
}

export interface MeasurementUpdateRequest {
  measurementFields: Record<
    string,
    string | number | null
  >;

  note?: string;
  alterationNote?: string;
}

export type MeasurementField = MeasurementFieldDefinition;
export interface MeasurementFieldCreateRequest { name: string; }
export interface MeasurementFieldUpdateRequest { name: string; }
export interface MeasurementFieldPageResponse {
  content: MeasurementField[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
