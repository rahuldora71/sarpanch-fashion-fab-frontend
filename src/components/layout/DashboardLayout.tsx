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
          border-sidebar-border/80
          bg-sidebar/95
          backdrop-blur-md
          text-sidebar-foreground
          transition-[width]
          duration-200
          md:flex

          ${collapsed ? "w-[72px]" : "w-60"}
        `}
      >

        {/* =================================================
            LOGO / COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={`
            group
            flex
            h-16
            shrink-0
            items-center
            border-b
            border-sidebar-border/80
            transition-colors
            hover:bg-sidebar-accent/50

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

          {/* Logo Monogram */}
          <div
            className="
              flex
              size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              overflow-hidden
              border border-primary/20
              shadow-sm
              shadow-primary/30
              transition-transform
              group-hover:scale-105
            "
          >
            <img
              src="/icons/icon-192.png"
              alt="Sarpanch Fashion Fab"
              className="size-full object-cover"
            />
          </div>

          {/* Application name */}
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold tracking-tight text-foreground">
                Sarpanch
              </p>
              <p className="truncate text-[10.5px] font-medium tracking-wider text-muted-foreground uppercase">
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
            border-sidebar-border/80
            p-3

            ${collapsed
              ? "flex justify-center"
              : ""
            }
          `}
        >
          {!collapsed && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 px-1">
              <span>Bespoke Atelier</span>
              <span className="font-mono text-[10px] opacity-60">v2.4</span>
            </div>
          )}

          {collapsed && (
            <span className="text-[10px] font-mono text-muted-foreground/60">
              v2.4
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
            ? "md:pl-[72px]"
            : "md:pl-60"
          }
        `}
      >

        <Navbar />

        <main
          className="
            min-h-[calc(100vh-4rem)]
            px-4
            py-6
            pb-24
            sm:px-6
            md:pb-8
            lg:px-8
            max-w-[1600px]
            mx-auto
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