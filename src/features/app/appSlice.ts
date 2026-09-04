import { createSlice } from "@reduxjs/toolkit";

// Replace this example state with truly global UI/app state only.
// Keep form inputs and one-page UI state inside their components.
const appSlice = createSlice({
  name: "app",
  initialState: { count: 0 },
  reducers: {
    increment: (state) => { state.count += 1; },
    reset: (state) => { state.count = 0; },
  },
});

// Export actions here, then dispatch them with useAppDispatch() in components.
export const { increment, reset } = appSlice.actions;
export default appSlice.reducer;
