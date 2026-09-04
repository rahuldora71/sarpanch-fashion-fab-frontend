import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useSelector } from "react-redux";

import type { RootState } from "@/app/store";

export default function GuestRoute() {
  const {
    isAuthenticated,
    isInitialized,
  } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}