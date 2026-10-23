import { useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchMeasurementFields,
  invalidateMeasurementFields,
  fieldUpserted,
  fieldDeleted,
} from "@/redux/slices/measurementFieldSlice";
import type { MeasurementFieldDefinition } from "@/types/measurementField";

export function useMeasurementFields() {
  const dispatch = useAppDispatch();
  const { fields, byId, status, error } = useAppSelector(
    (state) => state.measurementFields
  );

  const loading = status === "loading";

  // Eagerly fetch on first hook mount if not already loaded or loading
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMeasurementFields());
    }
  }, [dispatch, status]);

  // Map of string field ID -> field Name for convenient lookups
  const fieldNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    fields.forEach((f) => {
      map[String(f.id)] = f.name;
    });
    return map;
  }, [fields]);

  // Robust field resolver handling numeric IDs, string IDs, or field objects
  const getField = useCallback(
    (idOrField: any): MeasurementFieldDefinition | undefined => {
      if (!idOrField && idOrField !== 0) return undefined;

      let numericId: number | null = null;
      if (typeof idOrField === "number") {
        numericId = idOrField;
      } else if (typeof idOrField === "string") {
        const parsed = Number(idOrField);
        if (!isNaN(parsed)) numericId = parsed;
      } else if (typeof idOrField === "object") {
        const rawId = idOrField.fieldId ?? idOrField.id;
        const parsed = Number(rawId);
        if (!isNaN(parsed)) numericId = parsed;
      }

      if (numericId === null) return undefined;
      return byId[numericId];
    },
    [byId]
  );

  // Safe field name getter with fallback
  const getFieldName = useCallback(
    (idOrField: any, fallback?: string): string => {
      if (typeof idOrField === "object" && idOrField !== null) {
        if (typeof idOrField.name === "string" && idOrField.name.trim()) return idOrField.name.trim();
        if (typeof idOrField.label === "string" && idOrField.label.trim()) return idOrField.label.trim();
      }

      const field = getField(idOrField);
      if (field?.name) return field.name;

      if (fallback) return fallback;

      // Extract raw ID for clean default label
      let rawId: any = idOrField;
      if (typeof idOrField === "object" && idOrField !== null) {
        rawId = idOrField.fieldId ?? idOrField.id;
      }

      return rawId !== undefined && rawId !== null ? `Field #${rawId}` : "Unknown measurement";
    },
    [getField]
  );

  // Safe field unit getter with fallback
  const getFieldUnit = useCallback(
    (idOrField: any, fallback = "in"): string => {
      if (typeof idOrField === "object" && idOrField !== null) {
        if (typeof idOrField.unit === "string" && idOrField.unit.trim()) return idOrField.unit.trim();
      }
      const field = getField(idOrField);
      return field?.unit || fallback;
    },
    [getField]
  );

  // Direct state mutation actions
  const upsertField = useCallback(
    (field: MeasurementFieldDefinition) => {
      dispatch(fieldUpserted(field));
    },
    [dispatch]
  );

  const deleteField = useCallback(
    (fieldId: number) => {
      dispatch(fieldDeleted(fieldId));
    },
    [dispatch]
  );

  // Force refetch method
  const refetch = useCallback(
    (force = true) => {
      return dispatch(fetchMeasurementFields({ force }));
    },
    [dispatch]
  );

  const invalidate = useCallback(() => {
    dispatch(invalidateMeasurementFields());
  }, [dispatch]);

  return {
    fields,
    fieldMap: byId,
    fieldNameMap,
    getField,
    getFieldName,
    getFieldUnit,
    upsertField,
    deleteField,
    loading,
    status,
    error,
    refetch,
    invalidate,
  };
}

export default useMeasurementFields;
