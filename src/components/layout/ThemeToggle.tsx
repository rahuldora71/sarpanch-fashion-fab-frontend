import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import {
  getCurrentTheme,
  toggleTheme,
} from "@/utils/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<
    "light" | "dark"
  >("light");

  useEffect(() => {
    setThemeState(getCurrentTheme());
  }, []);

  const handleToggle = () => {
    const newTheme = toggleTheme();

    setThemeState(newTheme);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}