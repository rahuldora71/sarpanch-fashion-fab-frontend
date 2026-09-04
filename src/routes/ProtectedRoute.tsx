import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useSelector } from "react-redux";

import type { RootState } from "@/app/store";

export default function ProtectedRoute() {
  const {
    isAuthenticated,
    isInitialized,
  } = useSelector(
    (state: RootState) => state.auth
  );

  /*
   * AuthInitializer handles the loading state.
   * This is an additional safety check.
   */

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}