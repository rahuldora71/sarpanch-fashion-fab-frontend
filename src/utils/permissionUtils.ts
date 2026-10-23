import type { MenuItemConfig } from "../config/menuItems";

export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/dashboard": "dashboard.view",
  "/orders": "orders.view",
  "/orders/new": "orders.create",
  "/orders/historical-entry": "historical_orders.view",
  "/customers": "customers.view",
  "/customers/new": "customers.create",
  "/customers/edit": "customers.edit",
  "/measurements": "measurements.view",
  "/production": "production.view",
  "/capacity": "production.view",
  "/cutting-queue": "cutting.view",
  "/cutting": "cutting.view",
  "/alterations": "alterations.view",
  "/workers": "workers.view",
  "/worker-allotment": "worker_allotment.view",
  "/worker-production": "workers.view",
  "/production-history": "workers.view",
  "/billing": "billing.view",
  "/payments": "payments.view",
  "/fabric-samples": "fabric_samples.view",
  "/reports": "reports.view",
  "/services-pricing": "services_pricing.view",
  "/addons": "addons.view",
  "/expenses": "expenses.view",
  "/staff": "users.view",
  "/users": "users.view",
  "/logs": "logs.view",
  "/roles": "roles_permissions.view",
  "/settings/roles": "roles_permissions.view",
  "/settings": "settings.view",
};

/**
 * Pure evaluation function for permission checking.
 * Evaluates whether a given resource and action are permitted based on effective permission keys.
 */
export function checkPermission(
  effectivePermissions: string[],
  isAdmin: boolean,
  resource: string,
  action: string = "VIEW"
): boolean {
  if (isAdmin) return true;
  if (!effectivePermissions || effectivePermissions.length === 0) return false;
  if (effectivePermissions.includes("*")) return true;

  const normalizedRes = resource.trim().toLowerCase();
  const normalizedAct = action.trim().toLowerCase();

  // If resource already contains a delimiter (e.g. "orders.view" or "orders:view")
  if (normalizedRes.includes(".") || normalizedRes.includes(":")) {
    const parts = normalizedRes.split(/[\.:]/);
    const targetKey1 = `${parts[0]}.${parts[1]}`;
    const targetKey2 = `${parts[0]}:${parts[1]}`;
    const targetWildcard1 = `${parts[0]}.*`;
    const targetWildcard2 = `${parts[0]}:*`;

    return effectivePermissions.some((p) => {
      const lower = p.toLowerCase();
      return (
        lower === targetKey1 ||
        lower === targetKey2 ||
        lower === targetWildcard1 ||
        lower === targetWildcard2
      );
    });
  }

  const targetDot = `${normalizedRes}.${normalizedAct}`;
  const targetColon = `${normalizedRes}:${normalizedAct}`;
  const wildcardDot = `${normalizedRes}.*`;
  const wildcardColon = `${normalizedRes}:*`;

  return effectivePermissions.some((p) => {
    const lower = p.toLowerCase();
    return (
      lower === targetDot ||
      lower === targetColon ||
      lower === wildcardDot ||
      lower === wildcardColon
    );
  });
}

/**
 * Pure function that filters a tree of MenuItemConfig items.
 * Preserves original objects while pruning unauthorized items and children.
 */
export function filterPermittedMenuItems(
  items: MenuItemConfig[],
  effectivePermissions: string[],
  isAdmin: boolean
): MenuItemConfig[] {
  const result: MenuItemConfig[] = [];

  for (const item of items) {
    const requiredAction = item.requiredAction || "VIEW";
    const isParentPermitted = checkPermission(
      effectivePermissions,
      isAdmin,
      item.resourceKey,
      requiredAction
    );

    // Recursively filter children if any
    let permittedChildren: MenuItemConfig[] | undefined = undefined;
    if (item.children && item.children.length > 0) {
      permittedChildren = filterPermittedMenuItems(
        item.children,
        effectivePermissions,
        isAdmin
      );
    }

    const hasPermittedChildren =
      permittedChildren !== undefined && permittedChildren.length > 0;

    // A menu item is shown if:
    // 1. The parent page itself is permitted (it is directly viewable)
    // 2. OR it has no direct page, but has at least one permitted child
    const isGroupOnly = !item.href || item.href === "#" || item.href === "";
    if (isGroupOnly) {
      if (hasPermittedChildren) {
        result.push({
          ...item,
          children: permittedChildren,
        });
      }
    } else {
      if (isParentPermitted) {
        result.push({
          ...item,
          children: hasPermittedChildren ? permittedChildren : undefined,
        });
      }
    }
  }

  return result;
}
