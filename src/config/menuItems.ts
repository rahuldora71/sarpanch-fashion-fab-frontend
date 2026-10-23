import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  CreditCard,
  Factory,
  LayoutDashboard,
  Package,
  Receipt,
  Ruler,
  Scissors,
  Settings,
  ShoppingBag,
  FileText,
  Tags,
  Users,
  UsersRound,
  WalletCards,
  Shield,
} from "lucide-react";

export interface MenuItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  bottomNav?: boolean;
  resourceKey: string;
  requiredAction?: string;
  children?: MenuItemConfig[];
}

export const menuItems: MenuItemConfig[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    bottomNav: true,
    resourceKey: "dashboard",
    requiredAction: "VIEW",
  },

  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    bottomNav: true,
    resourceKey: "customers",
    requiredAction: "VIEW",
  },

  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingBag,
    bottomNav: true,
    resourceKey: "orders",
    requiredAction: "VIEW",
    children: [
      {
        label: "Mass Order Upload",
        href: "/orders/historical-entry",
        icon: FileText,
        bottomNav: false,
        resourceKey: "historical_orders",
        requiredAction: "VIEW",
      },
    ],
  },

  {
    label: "Measurements",
    href: "/measurements",
    icon: Ruler,
    bottomNav: false,
    resourceKey: "measurements",
    requiredAction: "VIEW",
  },

  {
    label: "Production",
    href: "/production",
    icon: Factory,
    bottomNav: true,
    resourceKey: "production",
    requiredAction: "VIEW",
  },

  {
    label: "Cutting Queue",
    href: "/cutting-queue",
    icon: Scissors,
    bottomNav: false,
    resourceKey: "cutting",
    requiredAction: "VIEW",
  },

  {
    label: "Alterations",
    href: "/alterations",
    icon: ClipboardList,
    bottomNav: false,
    resourceKey: "alterations",
    requiredAction: "VIEW",
  },

  {
    label: "Workers",
    href: "/workers",
    icon: UsersRound,
    bottomNav: false,
    resourceKey: "workers",
    requiredAction: "VIEW",
    children: [
      {
        label: "Worker Production",
        href: "/workers?tab=history",
        icon: BarChart3,
        bottomNav: false,
        resourceKey: "workers",
        requiredAction: "VIEW",
      },
      {
        label: "Work Allotment",
        href: "/worker-allotment",
        icon: Scissors,
        bottomNav: false,
        resourceKey: "worker_allotment",
        requiredAction: "VIEW",
      },
    ],
  },

  {
    label: "Billing",
    href: "/billing",
    icon: WalletCards,
    bottomNav: false,
    resourceKey: "billing",
    requiredAction: "VIEW",
  },

  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    bottomNav: false,
    resourceKey: "payments",
    requiredAction: "VIEW",
  },

  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    bottomNav: false,
    resourceKey: "reports",
    requiredAction: "VIEW",
  },

  {
    label: "Services & Pricing",
    href: "/services-pricing",
    icon: Tags,
    bottomNav: false,
    resourceKey: "services_pricing",
    requiredAction: "VIEW",
  },

  {
    label: "Add-ons",
    href: "/addons",
    icon: Package,
    bottomNav: false,
    resourceKey: "addons",
    requiredAction: "VIEW",
  },

  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    bottomNav: false,
    resourceKey: "expenses",
    requiredAction: "VIEW",
  },

  {
    label: "Staff",
    href: "/staff",
    icon: UsersRound,
    bottomNav: false,
    resourceKey: "users",
    requiredAction: "VIEW",
  },

  {
    label: "Message and Access Logs",
    href: "/logs",
    icon: Activity,
    bottomNav: false,
    resourceKey: "logs",
    requiredAction: "VIEW",
  },

  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    bottomNav: false,
    resourceKey: "settings",
    requiredAction: "VIEW",
    children: [
      {
        label: "Roles & Permissions",
        href: "/roles",
        icon: Shield,
        bottomNav: false,
        resourceKey: "roles_permissions",
        requiredAction: "VIEW",
      },
    ],
  },
];
