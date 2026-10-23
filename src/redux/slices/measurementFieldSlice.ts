import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/config/ApiClient";
import type { MeasurementFieldDefinition } from "@/types/measurementField";
import type { RootState } from "@/app/store";

export interface MeasurementFieldState {
  fields: MeasurementFieldDefinition[];
  byId: Record<number, MeasurementFieldDefinition>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
}

const initialState: MeasurementFieldState = {
  fields: [],
  byId: {},
  status: "idle",
  error: null,
  lastFetched: null,
};

export const fetchMeasurementFields = createAsyncThunk<
  MeasurementFieldDefinition[],
  { force?: boolean } | void,
  { state: RootState }
>(
  "measurementFields/fetchMeasurementFields",
  async (arg, { getState, rejectWithValue }) => {
    const state = getState().measurementFields;
    if (!arg?.force && state?.status === "succeeded" && state?.fields?.length > 0) {
      return state.fields;
    }

    try {
      const response = await apiClient.get<any>("/fields", {
        params: {
          page: 0,
          size: 500,
          sort: "name,asc",
        },
      });

      const data = response.data;
      let rawList: any[] = [];

      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && Array.isArray(data.content)) {
        rawList = data.content;
      }

      return rawList.map((f: any) => ({
        id: Number(f.id ?? f.fieldId),
        name: f.name || f.label || `Field #${f.id ?? f.fieldId}`,
        description: f.description ?? null,
        unit: f.unit ?? "INCH",
        type: f.type ?? "number",
        displayOrder: f.displayOrder ?? null,
        active: f.active ?? true,
      }));
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch measurement fields");
    }
  }
);

const measurementFieldSlice = createSlice({
  name: "measurementFields",
  initialState,
  reducers: {
    invalidateMeasurementFields: (state) => {
      state.status = "idle";
    },
    fieldUpserted: (state, action: PayloadAction<MeasurementFieldDefinition>) => {
      const field = action.payload;
      state.byId[field.id] = field;
      const idx = state.fields.findIndex((f) => f.id === field.id);
      if (idx >= 0) {
        state.fields[idx] = field;
      } else {
        state.fields.push(field);
      }
      state.fields.sort((a, b) => a.name.localeCompare(b.name));
    },
    fieldDeleted: (state, action: PayloadAction<number>) => {
      const fieldId = action.payload;
      delete state.byId[fieldId];
      state.fields = state.fields.filter((f) => f.id !== fieldId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeasurementFields.pending, (state) => {
        if (state.status !== "succeeded") {
          state.status = "loading";
        }
        state.error = null;
      })
      .addCase(fetchMeasurementFields.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.fields = action.payload;
        state.byId = {};
        action.payload.forEach((field) => {
          state.byId[field.id] = field;
        });
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchMeasurementFields.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to fetch measurement fields";
      });
  },
});

export const {
  invalidateMeasurementFields,
  fieldUpserted,
  fieldDeleted,
} = measurementFieldSlice.actions;

export default measurementFieldSlice.reducer;
