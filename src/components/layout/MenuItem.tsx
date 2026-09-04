import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface MenuItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  onClick?: () => void;
  collapsed?: boolean;
}

export default function MenuItem({
  label,
  href,
  icon: Icon,
  onClick,
  collapsed = false,
}: MenuItemProps) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          `
          group
          relative
          flex
          min-h-10
          items-center
          rounded-md
          text-sm
          font-medium
          transition-colors
          outline-none
          focus-visible:ring-2
          focus-visible:ring-sidebar-ring
          `,
          
          collapsed
            ? "justify-center px-2"
            : "gap-3 px-3",

          isActive
            ? `
              bg-sidebar-accent
              text-sidebar-accent-foreground
            `
            : `
              text-sidebar-foreground/70
              hover:bg-sidebar-accent/60
              hover:text-sidebar-accent-foreground
            `
        )
      }
    >
      {({ isActive }) => (
        <>

          {/* Icon */}

          <Icon
            className={cn(
              "size-[18px] shrink-0",

              isActive
                ? "text-sidebar-accent-foreground"
                : `
                    text-sidebar-foreground/60
                    group-hover:text-sidebar-accent-foreground
                  `
            )}
          />


          {/* Label */}

          {!collapsed && (
            <span className="truncate">
              {label}
            </span>
          )}


          {/* Active indicator */}

          {isActive && (
            <span
              className={`
                absolute
                size-1.5
                rounded-full
                bg-primary

                ${collapsed
                  ? "right-1.5"
                  : "right-3"
                }
              `}
            />
          )}

        </>
      )}
    </NavLink>
  );
}