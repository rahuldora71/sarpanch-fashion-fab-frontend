import MenuItem from "./MenuItem";
import { menuItems } from "@/config/menuItems";

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
  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-1"
          : `
              flex
              flex-1
              flex-col
              gap-1
              overflow-y-auto
              px-3
              py-4
            `
      }
    >
      {menuItems.map((item) => (
        <MenuItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          onClick={onNavigate}
          collapsed={collapsed}
        />
      ))}
    </nav>
  );
}