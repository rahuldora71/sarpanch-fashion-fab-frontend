import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  setEffectivePermissions,
  setPermissionsLoading,
  setPermissionsError,
} from "@/redux/slices/authSlice";
import { getEffectivePermissions } from "@/services/profileService";
import type { MenuItemConfig } from "@/config/menuItems";
import {
  ROUTE_PERMISSION_MAP,
  checkPermission,
  filterPermittedMenuItems,
} from "@/utils/permissionUtils";

export { ROUTE_PERMISSION_MAP, checkPermission, filterPermittedMenuItems };

export function usePermissions() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const effectivePermissions = useSelector(
    (state: RootState) => state.auth.effectivePermissions || []
  );
  const isPermissionsLoading = useSelector(
    (state: RootState) => state.auth.isPermissionsLoading
  );
  const permissionsLoaded = useSelector(
    (state: RootState) => state.auth.permissionsLoaded
  );

  const isAdmin = Boolean(
    user?.roles?.some(
      (r) =>
        r.name === "ROLE_OWNER" ||
        r.name === "ROLE_ADMIN" ||
        r.name === "OWNER" ||
        r.name === "ADMIN"
    )
  );

  /**
   * Checks whether the current user has permission for a resource and action.
   * Can be called as:
   *   hasPermission("orders", "VIEW")
   *   hasPermission("orders", "CREATE")
   *   hasPermission("orders.view")
   */
  const hasPermission = useCallback(
    (resource: string, action: string = "VIEW"): boolean => {
      if (!user) return false;
      return checkPermission(effectivePermissions, isAdmin, resource, action);
    },
    [user, isAdmin, effectivePermissions]
  );

  /**
   * Checks if current user can access a given route URL path.
   */
  const canAccessRoute = useCallback(
    (href: string): boolean => {
      if (!user) return false;
      if (isAdmin) return true;

      // Profile is always accessible to any authenticated user
      if (href === "/profile" || href.startsWith("/profile/")) {
        return true;
      }

      // Normalize href: remove query params and trailing slash
      const cleanPath = href.split("?")[0].replace(/\/+$/, "") || "/";

      // Exact match check
      const requiredPerm = ROUTE_PERMISSION_MAP[cleanPath];
      if (requiredPerm) {
        return hasPermission(requiredPerm);
      }

      // Longest prefix match check for sub-routes
      const matchingEntries = Object.entries(ROUTE_PERMISSION_MAP)
        .filter(([routePath]) => cleanPath.startsWith(routePath))
        .sort((a, b) => b[0].length - a[0].length);

      if (matchingEntries.length > 0) {
        return hasPermission(matchingEntries[0][1]);
      }

      // Default safe check
      return true;
    },
    [user, isAdmin, hasPermission]
  );

  /**
   * Dynamically filters a list of MenuItemConfig based on current permissions.
   */
  const filterMenuItems = useCallback(
    (items: MenuItemConfig[]): MenuItemConfig[] => {
      if (!user) return [];
      return filterPermittedMenuItems(items, effectivePermissions, isAdmin);
    },
    [user, effectivePermissions, isAdmin]
  );

  /**
   * Re-fetches effective permissions from backend and updates Redux store.
   */
  const refreshPermissions = useCallback(async (): Promise<string[]> => {
    try {
      dispatch(setPermissionsLoading(true));
      const perms = await getEffectivePermissions();
      dispatch(setEffectivePermissions(perms));
      return perms;
    } catch (err) {
      console.error("Failed to refresh user permissions:", err);
      dispatch(setPermissionsError());
      return [];
    }
  }, [dispatch]);

  return {
    user,
    isAdmin,
    effectivePermissions,
    isPermissionsLoading,
    permissionsLoaded,
    hasPermission,
    canAccessRoute,
    filterMenuItems,
    refreshPermissions,
  };
}
