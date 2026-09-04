import {
  Bell,
  ChevronRight,
  LogOut,
  Plus,
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

import type { RootState } from "@/app/store";

import { logout } from "@/redux/slices/authSlice";

import { logoutUser } from "@/services/AuthService";

import { menuItems } from "@/config/menuItems";

import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  // =========================================================
  // CURRENT PAGE
  // =========================================================

  const currentMenuItem = menuItems.find(
    (item) => item.href === location.pathname
  );

  const pageName =
    currentMenuItem?.label ?? "Dashboard";

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
        flex
        h-14
        w-full
        items-center
        border-b
        border-border
        bg-background
      "
    >
      <div
        className="
          flex
          h-full
          w-full
          items-center
          justify-between
          px-4
          sm:px-5
          lg:px-6
        "
      >

        {/* =================================================
            LEFT
        ================================================= */}

        <div className="flex min-w-0 items-center">

          {/* Mobile Logo */}

          <div
            className="
              mr-3
              flex
              size-7
              shrink-0
              items-center
              justify-center
              rounded
              bg-primary
              text-[10px]
              font-bold
              text-primary-foreground
              md:hidden
            "
          >
            SF
          </div>


          {/* Desktop Breadcrumb */}

          <div
            className="
              hidden
              items-center
              gap-2
              text-sm
              md:flex
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="
                text-muted-foreground
                transition-colors
                hover:text-foreground
              "
            >
              Sarpanch Fashion Fab
            </button>

            <ChevronRight
              className="
                size-4
                text-muted-foreground/60
              "
            />

            <span className="font-medium">
              {pageName}
            </span>
          </div>


          {/* Mobile Page Name */}

          <span
            className="
              truncate
              text-sm
              font-semibold
              md:hidden
            "
          >
            {pageName}
          </span>

        </div>


        {/* =================================================
            RIGHT
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-1
            sm:gap-2
          "
        >

          {/* New Order */}

          <Button
            type="button"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              toast("New Order clicked");
            }}
          >
            <Plus className="size-4" />

            <span>
              New Order
            </span>
          </Button>


          {/* Mobile New Order */}

          <Button
            type="button"
            size="icon"
            className="sm:hidden"
            onClick={() => {
              toast("New Order clicked");
            }}
            aria-label="New order"
          >
            <Plus className="size-4" />
          </Button>


          {/* Theme */}

          <ThemeToggle />


          {/* Notifications */}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="size-4" />

            <span
              className="
                absolute
                right-2
                top-2
                size-1.5
                rounded-full
                bg-primary
              "
            />
          </Button>


          {/* Divider */}

          <div
            className="
              mx-1
              hidden
              h-6
              w-px
              bg-border
              sm:block
            "
          />


          {/* User */}

          <button
            type="button"
            onClick={() => {
              toast("Profile clicked");
            }}
            className="
              flex
              items-center
              gap-2
              rounded-md
              p-1.5
              outline-none
              transition-colors
              hover:bg-accent
              focus-visible:ring-2
              focus-visible:ring-ring
            "
          >
            <Avatar className="size-8">
              <AvatarImage
                src={
                  user?.image ??
                  undefined
                }
                alt={
                  user?.name ??
                  "User"
                }
              />

              <AvatarFallback>
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <span
              className="
                hidden
                max-w-24
                truncate
                text-sm
                font-medium
                lg:block
              "
            >
              {user?.name ?? "User"}
            </span>
          </button>


          {/* Logout */}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="size-4" />
          </Button>

        </div>

      </div>
    </header>
  );
}