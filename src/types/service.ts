export interface ServiceMeasurementField {
  fieldId: number;
  unit: string;
  required: boolean;
  type: string;
  displayOrder: number;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  active: boolean;
  tailorCommission: number;
  measurementFields: ServiceMeasurementField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCreateRequest {
  name: string;
  category: string;
  price: number;
  active: boolean;
  tailorCommission: number;
  measurementFields: ServiceMeasurementField[];
}

export interface ServiceUpdateRequest {
  name?: string;
  category?: string;
  price?: number;
  active?: boolean;
  tailorCommission?: number;
  measurementFields?: ServiceMeasurementField[];
}

export interface ServicePageResponse {
  content: Service[];

  totalPages: number;
  totalElements: number;

  size: number;
  number: number;

  first: boolean;
  last: boolean;

  numberOfElements: number;
  empty: boolean;
}

/** Legacy editor shape retained for the standalone field editor. */
export interface MeasurementField {
  key: string;
  label: string;
  unit: string;
  type: string;
  required: boolean;
  displayOrder: number;
}
