import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/redux/slices/authSlice";
import checkoutReducer from "@/features/checkout/checkoutSlice";
import measurementFieldReducer from "@/redux/slices/measurementFieldSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    checkout: checkoutReducer,
    measurementFields: measurementFieldReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;