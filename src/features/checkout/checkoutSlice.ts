import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type {
  MultiCustomerCheckoutState,
  CustomerOrderDraft,
  CheckoutGarmentDraft,
  CompleteOrderResponse,
} from "@/types/orderEdit";
import apiClient from "@/config/ApiClient";

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: MultiCustomerCheckoutState = {
  sessions: [],
  activeSessionId: null,
  confirmedOrders: [],
  isSubmitting: false,
};

// ============================================================
// THUNKS
// ============================================================

/** Submit all pending order sessions to the backend */
export const submitAllOrders = createAsyncThunk(
  "checkout/submitAllOrders",
  async (sessions: CustomerOrderDraft[], { rejectWithValue }) => {
    const results: CompleteOrderResponse[] = [];
    const errors: string[] = [];

    for (const session of sessions) {
      try {
        const payload = {
          customerId: session.customerId,
          orderDate: session.orderDate,
          sampleBookPageNumber: session.sampleBookPageNumber,
          discount: session.discount,
          garments: session.garments.map((g) => ({
            serviceId: g.serviceId,
            price: g.price,
            sampleNumber: g.sampleNumber,
            dueDate: g.dueDate,
            tryDate: g.tryDate,
            note: g.note,
            measurement: g.measurement,
            addOns: g.addOns,
          })),
          additionalCharges: session.additionalCharges.map((c) => ({
            description: c.description,
            amount: c.amount,
          })),
          payment:
            session.paymentAmount > 0
              ? {
                  amount: session.paymentAmount,
                  paymentMethod: session.paymentMethod,
                  paymentType: session.paymentType,
                  receivedById: session.receivedById,
                  note: session.paymentNote,
                }
              : undefined,
        };

        const res = await apiClient.post<CompleteOrderResponse>(
          "/orders/complete",
          payload
        );
        results.push(res.data);
      } catch {
        errors.push(`Failed to submit order for ${session.customerName}`);
      }
    }

    if (errors.length > 0) {
      return rejectWithValue(errors.join("; "));
    }
    return results;
  }
);

// ============================================================
// SLICE
// ============================================================

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    /** Start a fresh checkout session for a customer */
    addSession(state, action: PayloadAction<Omit<CustomerOrderDraft, "sessionId">>) {
      const session: CustomerOrderDraft = {
        ...action.payload,
        sessionId: uuidv4(),
      };
      state.sessions.push(session);
      state.activeSessionId = session.sessionId;
    },

    /** Set which session is currently being edited */
    setActiveSession(state, action: PayloadAction<string>) {
      state.activeSessionId = action.payload;
    },

    /** Remove a session (before confirmation only) */
    removeSession(state, action: PayloadAction<string>) {
      state.sessions = state.sessions.filter(
        (s) => s.sessionId !== action.payload
      );
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.sessionId ?? null;
      }
    },

    /** Update order-level fields for the active/specified session */
    updateSession(
      state,
      action: PayloadAction<{ sessionId: string; patch: Partial<CustomerOrderDraft> }>
    ) {
      const session = state.sessions.find(
        (s) => s.sessionId === action.payload.sessionId
      );
      if (session) {
        Object.assign(session, action.payload.patch);
        // Recalculate totals
        session.subtotal = session.garments.reduce(
          (sum, g) =>
            sum +
            g.price +
            g.addOns.reduce((aSum) => aSum, 0),
          0
        );
        const chargesTotal = session.additionalCharges.reduce(
          (s, c) => s + c.amount,
          0
        );
        session.grandTotal = Math.max(
          0,
          session.subtotal + chargesTotal - session.discount
        );
      }
    },

    /** Add a garment to the active session */
    addGarmentToSession(
      state,
      action: PayloadAction<{ sessionId: string; garment: Omit<CheckoutGarmentDraft, "tempId"> }>
    ) {
      const session = state.sessions.find(
        (s) => s.sessionId === action.payload.sessionId
      );
      if (session) {
        session.garments.push({ ...action.payload.garment, tempId: uuidv4() });
      }
    },

    /** Update a garment within a session */
    updateGarmentInSession(
      state,
      action: PayloadAction<{
        sessionId: string;
        tempId: string;
        patch: Partial<CheckoutGarmentDraft>;
      }>
    ) {
      const session = state.sessions.find(
        (s) => s.sessionId === action.payload.sessionId
      );
      if (session) {
        const garment = session.garments.find(
          (g) => g.tempId === action.payload.tempId
        );
        if (garment) {
          Object.assign(garment, action.payload.patch);
        }
      }
    },

    /** Remove a garment from a session */
    removeGarmentFromSession(
      state,
      action: PayloadAction<{ sessionId: string; tempId: string }>
    ) {
      const session = state.sessions.find(
        (s) => s.sessionId === action.payload.sessionId
      );
      if (session) {
        session.garments = session.garments.filter(
          (g) => g.tempId !== action.payload.tempId
        );
      }
    },

    /** Update sample book page number for a session */
    setSampleBookNumber(
      state,
      action: PayloadAction<{ sessionId: string; value: string }>
    ) {
      const session = state.sessions.find(
        (s) => s.sessionId === action.payload.sessionId
      );
      if (session) {
        session.sampleBookPageNumber = action.payload.value;
      }
    },

    /** Clear the entire checkout (after success) */
    resetCheckout(state) {
      state.sessions = [];
      state.activeSessionId = null;
      state.confirmedOrders = [];
      state.isSubmitting = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitAllOrders.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(submitAllOrders.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.confirmedOrders = action.payload;
        state.sessions = [];
        state.activeSessionId = null;
      })
      .addCase(submitAllOrders.rejected, (state) => {
        state.isSubmitting = false;
      });
  },
});

export const {
  addSession,
  setActiveSession,
  removeSession,
  updateSession,
  addGarmentToSession,
  updateGarmentInSession,
  removeGarmentFromSession,
  setSampleBookNumber,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
