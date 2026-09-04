import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  Factory,
  LayoutDashboard,
  Package,
  Ruler,
  Scissors,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    bottomNav: true,
  },

  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    bottomNav: true,
  },

  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingBag,
    bottomNav: true,
  },

  {
    label: "Measurements",
    href: "/measurements",
    icon: Ruler,
    bottomNav: false,
  },

  {
    label: "Production",
    href: "/production",
    icon: Factory,
    bottomNav: true,
  },

  {
    label: "Cutting Queue",
    href: "/cutting-queue",
    icon: Scissors,
    bottomNav: false,
  },

  {
    label: "Alterations",
    href: "/alterations",
    icon: ClipboardList,
    bottomNav: false,
  },

  {
    label: "Workers",
    href: "/workers",
    icon: UsersRound,
    bottomNav: false,
  },

  {
    label: "Billing",
    href: "/billing",
    icon: WalletCards,
    bottomNav: false,
  },

  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    bottomNav: false,
  },

  {
    label: "Fabric Samples",
    href: "/fabric-samples",
    icon: BookOpen,
    bottomNav: false,
  },

  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    bottomNav: false,
  },

  {
    label: "Services & Pricing",
    href: "/services-pricing",
    icon: Tags,
    bottomNav: false,
  },
  {
    label: "Add-ons",
    href: "/addons",
    icon: Package,
    bottomNav: false,
  },

  {
    label: "Expenses",
    href: "/expenses",
    icon: Package,
    bottomNav: false,
  },

  {
    label: "Staff",
    href: "/staff",
    icon: UsersRound,
    bottomNav: false,
  },

  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    bottomNav: false,
  },
];