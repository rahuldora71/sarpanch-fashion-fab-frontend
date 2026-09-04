import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "@/app/store";

interface RoleRouteProps {
  allowedRoles: string[];
}

export default function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  // User isn't logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user?.roles ?? [];

  const hasRequiredRole = userRoles.some((role) =>
    allowedRoles.includes(role.name)
  );

  // Logged in but doesn't have required role
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}