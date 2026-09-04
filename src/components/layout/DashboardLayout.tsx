import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import MenuBar from "./MenuBar";
import MobileMenu from "./MobileMenu";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          flex-col
          border-r
          border-sidebar-border
          bg-sidebar
          text-sidebar-foreground
          transition-[width]
          duration-200
          md:flex

          ${collapsed ? "w-16" : "w-56"}
        `}
      >

        {/* =================================================
            LOGO / COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={`
            flex
            h-16
            shrink-0
            items-center
            border-b
            border-sidebar-border
            transition-colors
            hover:bg-sidebar-accent

            ${collapsed
              ? "justify-center px-2"
              : "gap-3 px-4"
            }
          `}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >

          {/* Logo */}

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-md
              bg-primary
              text-sm
              font-bold
              text-primary-foreground
            "
          >
            SF
          </div>


          {/* Application name */}

          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold">
                Sarpanch
              </p>

              <p className="truncate text-[10px] text-sidebar-foreground/60">
                Fashion Fab
              </p>
            </div>
          )}

        </button>


        {/* =================================================
            DESKTOP MENU
        ================================================== */}

        <MenuBar
          collapsed={collapsed}
        />


        {/* =================================================
            SIDEBAR FOOTER
        ================================================== */}

        <div
          className={`
            shrink-0
            border-t
            border-sidebar-border
            p-3

            ${collapsed
              ? "flex justify-center"
              : ""
            }
          `}
        >
          {!collapsed && (
            <p className="text-center text-xs text-sidebar-foreground/40">
              Sarpanch Fashion Fab
            </p>
          )}

          {collapsed && (
            <span className="text-xs text-sidebar-foreground/40">
              SF
            </span>
          )}
        </div>

      </aside>


      {/* =================================================
          MAIN AREA
      ================================================== */}

      <div
        className={`
          min-h-screen
          transition-[padding]
          duration-200

          ${collapsed
            ? "md:pl-16"
            : "md:pl-56"
          }
        `}
      >

        <Navbar />

        <main
          className="
            min-h-[calc(100vh-3.5rem)]
            px-4
            py-5
            pb-24
            sm:px-5
            md:pb-5
            lg:px-6
          "
        >
          <Outlet />
        </main>

      </div>


      {/* =================================================
          MOBILE / TABLET NAVIGATION
      ================================================== */}

      <MobileMenu />

    </div>
  );
}