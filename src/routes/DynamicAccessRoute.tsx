import React from "react";
import { Navigate, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert, ArrowLeft, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicAccessRouteProps {
  requiredPermission?: string;
  children?: React.ReactNode;
}

export const DynamicAccessRoute: React.FC<DynamicAccessRouteProps> = ({
  requiredPermission,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    hasPermission,
    canAccessRoute,
    isAdmin,
    permissionsLoaded,
    isPermissionsLoading,
  } = usePermissions();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent protected page content from rendering while authorization is unresolved
  if (!permissionsLoaded || isPermissionsLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Verifying security privileges...
        </p>
      </div>
    );
  }

  // Admins always bypass route locks
  if (isAdmin) {
    return children ? <>{children}</> : <Outlet />;
  }

  const hasAccess = requiredPermission
    ? hasPermission(requiredPermission)
    : canAccessRoute(location.pathname);

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-card rounded-2xl border border-border shadow-lg">
          <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Access Restricted
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account does not have permission to view this page or perform this operation.
              If you believe this is a mistake, contact your administrator to adjust your role permissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 rounded-xl"
            >
              <ArrowLeft className="size-4" />
              <span>Go Back</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              <Home className="size-4" />
              <span>Dashboard</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default DynamicAccessRoute;
