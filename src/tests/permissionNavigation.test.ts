import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  checkPermission,
  filterPermittedMenuItems,
  ROUTE_PERMISSION_MAP,
} from "../utils/permissionUtils.ts";
import authReducer, {
  setEffectivePermissions,
  setPermissionsLoading,
  setPermissionsError,
  logout,
} from "../redux/slices/authSlice.ts";

describe("Dynamic Permission-Based Navigation Tests", () => {
  // Test Mock Items
  const mockMenu: any[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: null as any,
      resourceKey: "dashboard",
      requiredAction: "VIEW",
    },
    {
      label: "Orders",
      href: "/orders",
      icon: null as any,
      resourceKey: "orders",
      requiredAction: "VIEW",
      children: [
        {
          label: "Mass Order Upload",
          href: "/orders/historical-entry",
          icon: null as any,
          resourceKey: "historical_orders",
          requiredAction: "VIEW",
        },
      ],
    },
    {
      label: "Billing",
      href: "/billing",
      icon: null as any,
      resourceKey: "billing",
      requiredAction: "VIEW",
    },
    {
      label: "Reports Group",
      href: "#", // Pure group item with no page
      icon: null as any,
      resourceKey: "reports_group",
      requiredAction: "VIEW",
      children: [
        {
          label: "Sales Reports",
          href: "/reports/sales",
          icon: null as any,
          resourceKey: "reports",
          requiredAction: "VIEW",
        },
      ],
    },
  ];

  it("Scenario 1: User with orders.view sees Orders in navigation", () => {
    const userPerms = ["orders.view", "dashboard.view"];
    const visible = filterPermittedMenuItems(mockMenu, userPerms, false);

    const hasOrders = visible.some((item) => item.label === "Orders");
    assert.equal(hasOrders, true, "Orders must appear in menu when user has orders.view");
  });

  it("Scenario 2: User without orders.view does not see Orders anywhere in navigation", () => {
    const userPerms = ["dashboard.view", "billing.view"];
    const visible = filterPermittedMenuItems(mockMenu, userPerms, false);

    const hasOrders = visible.some((item) => item.label === "Orders");
    assert.equal(hasOrders, false, "Orders must NOT appear when user lacks orders.view");
  });

  it("Scenario 3: User with orders.view but without orders.create sees Orders page but cannot create", () => {
    const userPerms = ["orders.view"];

    const canView = checkPermission(userPerms, false, "orders", "VIEW");
    const canCreate = checkPermission(userPerms, false, "orders", "CREATE");

    assert.equal(canView, true, "User must have VIEW permission on orders");
    assert.equal(canCreate, false, "User must NOT have CREATE permission on orders");
  });

  it("Scenario 4: Parent menu with only unauthorized children is hidden when parent has no page", () => {
    // User does not have reports permission
    const userPerms = ["dashboard.view"];
    const visible = filterPermittedMenuItems(mockMenu, userPerms, false);

    const hasReportsGroup = visible.some((item) => item.label === "Reports Group");
    assert.equal(hasReportsGroup, false, "Parent group with 0 permitted children must be hidden");
  });

  it("Scenario 4b: Nested child is hidden if unauthorized, while parent page remains visible", () => {
    // User has orders.view but lacks historical_orders.view
    const userPerms = ["orders.view"];
    const visible = filterPermittedMenuItems(mockMenu, userPerms, false);

    const ordersItem = visible.find((item) => item.label === "Orders");
    assert.ok(ordersItem, "Orders parent should be visible");
    assert.equal(
      ordersItem.children,
      undefined,
      "Unauthorized child Mass Order Upload must be hidden"
    );
  });

  it("Scenario 5: Admin role automatically has access to all resources and operations", () => {
    const adminPerms: string[] = []; // empty array, but isAdmin = true
    const visible = filterPermittedMenuItems(mockMenu, adminPerms, true);

    assert.equal(visible.length, mockMenu.length, "Admin must see all menu items");
    const canDoAnything = checkPermission(adminPerms, true, "orders", "DELETE");
    assert.equal(canDoAnything, true, "Admin must have permission for any action");
  });

  it("Scenario 6: Fail-closed behavior on empty permissions or error", () => {
    const emptyPerms: string[] = [];
    const visible = filterPermittedMenuItems(mockMenu, emptyPerms, false);

    assert.equal(
      visible.length,
      0,
      "When permissions are empty, menu must fail-closed and show 0 restricted items"
    );
  });

  it("Scenario 7: Route mapping maps paths to stable resource keys", () => {
    assert.equal(ROUTE_PERMISSION_MAP["/orders"], "orders.view");
    assert.equal(ROUTE_PERMISSION_MAP["/customers"], "customers.view");
    assert.equal(ROUTE_PERMISSION_MAP["/billing"], "billing.view");
    assert.equal(ROUTE_PERMISSION_MAP["/expenses"], "expenses.view");
    assert.equal(ROUTE_PERMISSION_MAP["/reports"], "reports.view");
    assert.equal(ROUTE_PERMISSION_MAP["/roles"], "roles_permissions.view");
    assert.equal(ROUTE_PERMISSION_MAP["/settings"], "settings.view");
  });

  it("Scenario 8: Redux store dynamic update, prompt revocation, and logout cleanup", () => {
    const initialState = {
      user: { id: 1, email: "tailor@sff.com", name: "Tailor", enable: true, roles: [] } as any,
      accessToken: "mock-token",
      expiresIn: 3600,
      isAuthenticated: true,
      isInitialized: true,
      effectivePermissions: [],
      isPermissionsLoading: false,
      permissionsLoaded: false,
    };

    // 1. Loading permissions
    const loadingState = authReducer(initialState, setPermissionsLoading(true));
    assert.equal(loadingState.isPermissionsLoading, true);

    // 2. Set dynamic permissions
    const grantedState = authReducer(
      loadingState,
      setEffectivePermissions(["orders.view", "cutting.view"])
    );
    assert.deepEqual(grantedState.effectivePermissions, ["orders.view", "cutting.view"]);
    assert.equal(grantedState.permissionsLoaded, true);
    assert.equal(grantedState.isPermissionsLoading, false);

    // 3. Prompt Revocation (Admin strips cutting permission)
    const revokedState = authReducer(
      grantedState,
      setEffectivePermissions(["orders.view"])
    );
    assert.deepEqual(revokedState.effectivePermissions, ["orders.view"]);
    assert.equal(
      checkPermission(revokedState.effectivePermissions, false, "cutting", "VIEW"),
      false,
      "Cutting must be promptly revoked"
    );

    // 4. Fail-closed on error
    const errorState = authReducer(grantedState, setPermissionsError());
    assert.deepEqual(errorState.effectivePermissions, []);
    assert.equal(errorState.permissionsLoaded, true);

    // 5. Logout clears all permissions and state
    const loggedOutState = authReducer(grantedState, logout());
    assert.deepEqual(loggedOutState.effectivePermissions, []);
    assert.equal(loggedOutState.permissionsLoaded, false);
    assert.equal(loggedOutState.user, null);
    assert.equal(loggedOutState.isAuthenticated, false);
  });
});
