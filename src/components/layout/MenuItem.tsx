import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";
import type { MenuItemConfig } from "@/config/menuItems";

interface MenuItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  onClick?: () => void;
  collapsed?: boolean;
  childrenItems?: MenuItemConfig[];
}

export default function MenuItem({
  label,
  href,
  icon: Icon,
  onClick,
  collapsed = false,
  childrenItems,
}: MenuItemProps) {
  const { t } = useWorkerTranslation();
  const location = useLocation();
  const displayLabel = t(label);

  const hasChildren = Boolean(childrenItems && childrenItems.length > 0);
  const isChildActive = Boolean(
    childrenItems?.some(
      (c) => location.pathname === c.href || location.pathname.startsWith(`${c.href}/`)
    )
  );

  const [expanded, setExpanded] = useState<boolean>(isChildActive);

  // Auto-expand if a child route becomes active
  useEffect(() => {
    if (isChildActive) {
      setExpanded(true);
    }
  }, [isChildActive]);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center w-full relative">
        <NavLink
          to={href}
          onClick={onClick}
          title={collapsed ? displayLabel : undefined}
          className={({ isActive }) =>
            cn(
              `
              group
              relative
              flex
              h-11
              flex-1
              items-center
              rounded-xl
              text-sm
              font-medium
              transition-all
              duration-150
              outline-none
              focus-visible:ring-2
              focus-visible:ring-sidebar-ring
              `,
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              isActive || isChildActive
                ? `
                  bg-primary/10
                  text-primary
                  font-semibold
                  dark:bg-primary/15
                  dark:text-primary
                `
                : `
                  text-sidebar-foreground/75
                  hover:bg-sidebar-accent/70
                  hover:text-sidebar-accent-foreground
                `
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Active indicator bar */}
              {(isActive || isChildActive) && (
                <span
                  className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-primary transition-all"
                />
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "size-5 shrink-0 stroke-[1.8] transition-transform duration-150 group-hover:scale-105",
                  isActive || isChildActive
                    ? "text-primary"
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                )}
              />

              {/* Label */}
              {!collapsed && (
                <span className="truncate text-[13px] tracking-tight flex-1 text-left">
                  {displayLabel}
                </span>
              )}

              {/* Subtle indicator dot when collapsed and active */}
              {collapsed && (isActive || isChildActive) && (
                <span className="sr-only">(Active)</span>
              )}
            </>
          )}
        </NavLink>

        {/* Expand/Collapse chevron toggle for items with children */}
        {hasChildren && !collapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="size-7 flex items-center justify-center rounded-lg hover:bg-sidebar-accent/70 text-sidebar-foreground/60 hover:text-sidebar-accent-foreground transition-colors mr-1 cursor-pointer"
            aria-label={expanded ? `Collapse ${displayLabel} sub-menu` : `Expand ${displayLabel} sub-menu`}
          >
            {expanded ? (
              <ChevronDown className="size-3.5 stroke-[2.2]" />
            ) : (
              <ChevronRight className="size-3.5 stroke-[2.2]" />
            )}
          </button>
        )}
      </div>

      {/* Render permitted child items */}
      {hasChildren && !collapsed && expanded && (
        <div className="flex flex-col gap-0.5 pl-4 border-l border-sidebar-border/60 ml-5 my-0.5">
          {childrenItems!.map((child) => {
            const ChildIcon = child.icon;
            const childDisplayLabel = t(child.label);

            return (
              <NavLink
                key={child.href}
                to={child.href}
                onClick={onClick}
                className={({ isActive }) =>
                  cn(
                    "flex h-8.5 items-center gap-2 rounded-lg px-2.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <ChildIcon className="size-3.5 shrink-0 stroke-[1.8]" />
                <span className="truncate">{childDisplayLabel}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
