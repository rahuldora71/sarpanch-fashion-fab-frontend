import { useState } from "react";
import { MoreHorizontal, Download } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { menuItems, type MenuItemConfig } from "@/config/menuItems";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { usePermissions } from "@/hooks/usePermissions";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useWorkerTranslation();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { filterMenuItems, permissionsLoaded, isPermissionsLoading, user } =
    usePermissions();

  const isResolving = Boolean(user && (!permissionsLoaded || isPermissionsLoading));

  const accessibleItems = filterMenuItems(menuItems);
  const bottomItems = accessibleItems.filter((item) => item.bottomNav);

  // Collect all more items plus permitted nested child items for quick mobile access
  const moreItems: MenuItemConfig[] = [];
  accessibleItems.forEach((item) => {
    if (!item.bottomNav) {
      moreItems.push(item);
    }
    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        // avoid duplicating if already in moreItems
        if (!moreItems.some((m) => m.href === child.href)) {
          moreItems.push(child);
        }
      });
    }
  });

  const totalCols = Math.max(bottomItems.length + 1, 1);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* =====================================================
          MOBILE / TABLET BOTTOM NAVIGATION BAR
      ====================================================== */}
      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-border/80
          bg-background/90
          backdrop-blur-xl
          shadow-lg
          md:hidden
        "
      >
        {isResolving ? (
          <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-around px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                <div className="size-6 rounded-lg bg-muted-foreground/15" />
                <div className="h-2 w-8 rounded bg-muted-foreground/15" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="mx-auto grid h-16 w-full max-w-lg items-center px-1"
            style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
          >
            {/* Main Navigation Items */}
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const displayLabel = t(
                item.label === "Dashboard" ? "Home" : item.label
              );

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      `
                      relative
                      flex
                      h-full
                      w-full
                      flex-col
                      items-center
                      justify-center
                      gap-1
                      transition-all
                      duration-150
                      active:scale-95
                      `,
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-xl p-1 transition-colors",
                          isActive && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-5 stroke-[2]" />
                      </div>

                      <span className="text-[10px] tracking-tight leading-none">
                        {displayLabel}
                      </span>

                      {isActive && (
                        <span className="absolute bottom-1 h-1 w-6 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* More Sheet Trigger */}
            <SheetTrigger
              type="button"
              className="
                flex
                h-full
                w-full
                flex-col
                items-center
                justify-center
                gap-1
                text-muted-foreground
                transition-all
                hover:text-foreground
                active:scale-95
                cursor-pointer
              "
              aria-label="Open more modules drawer"
            >
              <div className="flex items-center justify-center rounded-xl p-1">
                <MoreHorizontal className="size-5 stroke-[2]" />
              </div>

              <span className="text-[10px] tracking-tight leading-none">
                {t("More")}
              </span>
            </SheetTrigger>
          </div>
        )}
      </nav>

      {/* =====================================================
          MORE MODULES BOTTOM SHEET
      ====================================================== */}
      <SheetContent
        side="bottom"
        className="
          max-h-[85vh]
          rounded-t-3xl
          border-t
          border-border/80
          bg-background/95
          backdrop-blur-xl
          px-5
          pb-8
          pt-4
          sm:px-6
        "
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />

        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-base font-bold tracking-tight text-foreground flex items-center justify-between">
            <span>{t("All Tailoring Modules")}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {moreItems.length} modules
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* PWA App Installation Prompt for Mobile/Tablet Chrome */}
        {isInstallable && (
          <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Download className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Install SFF App</p>
                <p className="text-[10px] text-muted-foreground">App-like experience with no browser URL bar</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                promptInstall();
                setOpen(false);
              }}
              className="h-8 text-xs font-semibold rounded-xl px-3 shrink-0"
            >
              Install
            </Button>
          </div>
        )}

        {/* More Menu Items Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 max-h-[60vh] overflow-y-auto pr-1">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const displayLabel = t(item.label);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    `
                    flex
                    min-h-[88px]
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    border
                    p-2.5
                    text-center
                    transition-all
                    duration-150
                    active:scale-95
                    `,
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-accent/40 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <Icon className="size-5 stroke-[1.8]" />
                    </div>

                    <span className="text-[11.5px] font-medium leading-tight max-w-[85px] line-clamp-2">
                      {displayLabel}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
