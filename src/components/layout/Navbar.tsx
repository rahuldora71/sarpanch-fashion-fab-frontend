import {
  ChevronRight,
  LogOut,
  Plus,
  Download,
  User as UserIcon,
  Shield,
  ChevronDown,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import toast from "react-hot-toast";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { RootState } from "@/app/store";

import { logout } from "@/redux/slices/authSlice";

import { logoutUser } from "@/services/AuthService";

import { menuItems } from "@/config/menuItems";

import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { usePermissions } from "@/hooks/usePermissions";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useWorkerTranslation();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { isAdmin, hasPermission } = usePermissions();

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const canCreateOrders = isAdmin || hasPermission("orders", "CREATE");
  const canViewRoles = isAdmin || hasPermission("roles_permissions", "VIEW");

  // =========================================================
  // CURRENT PAGE
  // =========================================================

  const currentMenuItem = menuItems.find(
    (item) => item.href === location.pathname
  );

  const pageName = t(
    currentMenuItem?.label ?? "Dashboard"
  );

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await logoutUser();

      toast.success(
        "Logged out successfully"
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      dispatch(logout());

      navigate("/login", {
        replace: true,
      });
    }
  };

  // =========================================================
  // USER INITIALS
  // =========================================================

  const getInitials = () => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header
      className="
        sticky
        top-0
        z-30
        h-16
        w-full
        border-b
        border-border/80
        bg-background/85
        backdrop-blur-xl
        transition-colors
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          justify-between
          px-3
          sm:px-6
        "
      >

        {/* =================================================
            LEFT: BREADCRUMBS
        ================================================= */}

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            SFF Tailoring
          </span>

          <ChevronRight className="hidden sm:inline size-3 text-muted-foreground/60" />

          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-none">
            {pageName}
          </h1>
        </div>

        {/* =================================================
            RIGHT: ACTIONS & PROFILE
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-1.5
            sm:gap-2.5
          "
        >

          {/* New Order (requires orders.create permission) */}
          {canCreateOrders && (
            <>
              <Button
                type="button"
                className="
                  hidden
                  sm:inline-flex
                  h-10
                  px-4
                  rounded-xl
                  font-semibold
                  shadow-sm
                  shadow-primary/25
                  bg-primary
                  text-primary-foreground
                  hover:bg-primary/90
                  active:scale-98
                  transition
                "
                onClick={() => {
                  navigate("/orders/new");
                }}
              >
                <Plus className="size-4 mr-1" />
                <span>
                  {t("New Order")}
                </span>
              </Button>

              {/* Mobile New Order */}
              <Button
                type="button"
                size="icon"
                className="sm:hidden h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                onClick={() => {
                  navigate("/orders/new");
                }}
                aria-label={t("New Order")}
              >
                <Plus className="size-4" />
              </Button>
            </>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={promptInstall}
              className="gap-1.5 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold h-9 px-3 transition shadow-xs"
              title="Install Sarpanch Fashion Fab on this device"
            >
              <Download className="size-4" />
              <span className="hidden md:inline">Install App</span>
            </Button>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme */}
          <ThemeToggle />

          {/* Divider */}
          <div
            className="
              mx-1
              hidden
              h-6
              w-px
              bg-border/80
              sm:block
            "
          />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="
                flex
                items-center
                gap-2
                rounded-xl
                p-1.5
                pr-2
                transition-colors
                hover:bg-accent/60
                outline-none
                cursor-pointer
              "
              aria-label="User account menu"
            >
              <div className="relative">
                <Avatar className="size-8.5 rounded-lg border border-border/80">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="rounded-lg text-xs font-bold bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>

              <div className="hidden flex-col text-left lg:flex">
                <span className="max-w-28 truncate text-xs font-semibold leading-tight text-foreground">
                  {user?.name ?? "User"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {user?.roles?.[0]?.name?.replace("ROLE_", "") ?? "Staff"}
                </span>
              </div>

              <ChevronDown className="hidden sm:inline size-3.5 text-muted-foreground ml-0.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border border-border">
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground truncate">{user?.name ?? "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                      {user?.roles?.[0]?.name?.replace("ROLE_", "") ?? "Staff"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1.5" />

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer gap-2 py-2 rounded-xl text-xs font-medium"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>

              {canViewRoles && (
                <DropdownMenuItem
                  onClick={() => navigate("/roles")}
                  className="cursor-pointer gap-2 py-2 rounded-xl text-xs font-medium"
                >
                  <Shield className="size-4 text-muted-foreground" />
                  <span>Roles & Permissions</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1.5" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2 py-2 rounded-xl text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>
    </header>
  );
}
