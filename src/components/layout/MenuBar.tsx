import MenuItem from "./MenuItem";
import { menuItems } from "@/config/menuItems";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

interface MenuBarProps {
  mobile?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function MenuBar({
  mobile = false,
  onNavigate,
  collapsed = false,
}: MenuBarProps) {
  const { filterMenuItems, permissionsLoaded, isPermissionsLoading, user } =
    usePermissions();

  const containerClasses = mobile
    ? "flex flex-col gap-1"
    : `
        flex
        flex-1
        flex-col
        gap-1
        overflow-y-auto
        px-3
        py-4
      `;

  // Avoid flash of unauthorized menu content while permissions are resolving
  if (user && (!permissionsLoaded || isPermissionsLoading)) {
    return (
      <nav className={containerClasses}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex h-11 items-center rounded-xl animate-pulse bg-sidebar-accent/25 gap-3",
              collapsed ? "justify-center px-2" : "px-3"
            )}
          >
            <div className="size-5 rounded-lg bg-sidebar-foreground/10 shrink-0" />
            {!collapsed && (
              <div
                className="h-3 rounded-md bg-sidebar-foreground/10"
                style={{ width: `${60 + (i % 4) * 20}px` }}
              />
            )}
          </div>
        ))}
      </nav>
    );
  }

  const visibleItems = filterMenuItems(menuItems);

  return (
    <nav className={containerClasses}>
      {visibleItems.map((item) => (
        <MenuItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          onClick={onNavigate}
          collapsed={collapsed}
          childrenItems={item.children}
        />
      ))}
    </nav>
  );
}
