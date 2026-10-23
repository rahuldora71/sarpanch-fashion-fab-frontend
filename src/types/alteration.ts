export type AdjustmentType = "TIGHTEN" | "LOOSEN" | "SET";

export interface FieldAlterationConfig {
  fieldId: number;
  fieldName: string;
  unit: string;
  originalValue: number | string;
  adjustmentType: AdjustmentType;
  delta: number; // e.g. 0.5 for tighten (-0.5) or loosen (+0.5)
  customValue?: number | string; // for direct SET
  finalValue: number | string;
  applied: boolean;
}

export interface GarmentAlterationItem {
  garmentId: number;
  serviceId: number;
  serviceName: string;
  sampleNumber?: string | null;
  currentStatus: string;
  selected: boolean;
  fields: Record<number, FieldAlterationConfig>;
  alterationNote: string;
  alterationDeliveryDate?: string;
}

export interface AlterationBatchPayload {
  orderId: number;
  customerId: number;
  deliveryDate?: string;
  overallNote?: string;
  updateCustomerDefaultMeasurements: boolean;
  garmentAlterations: {
    garmentId: number;
    serviceId: number;
    alterationNote?: string;
    alterationDeliveryDate?: string;
    updatedMeasurementFields: Record<string, any>;
    alterationDeltas: Record<string, any>;
  }[];
}

export interface AlterationBatchResponse {
  orderId: number;
  customerId: number;
  alteredGarmentsCount: number;
  customerDefaultUpdated: boolean;
  alteredGarmentIds: number[];
  message: string;
}

export interface AlterationQueueItem {
  garmentId: number;
  orderId: number;
  orderNumber: string;
  orderDate: string;
  sampleBookPageNumber?: string | null;

  customerId: number;
  customerName: string;
  customerPhone?: string | null;
  customerCode?: string | null;

  serviceId: number;
  serviceName: string;
  sampleNumber?: string | null;
  status: string;

  alterationDeliveryDate?: string | null;
  alterationNote?: string | null;
  alterationDeltas?: Record<string, any> | null;
  measurementFields?: Record<string, any> | null;

  price: number;
  garmentMeasurementId?: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface AlterationQueueSummary {
  totalActive: number;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  upcoming: number;
  delivered: number;
}
