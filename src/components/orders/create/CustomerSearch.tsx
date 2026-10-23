import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    };

    vv.addEventListener("resize", handleViewportChange);
    return () => vv.removeEventListener("resize", handleViewportChange);
  }, []);

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 150);
  };

  return (
    <div className="relative scroll-mt-24">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={handleFocus}
        placeholder="Search by name or phone..."
        className="h-10 pl-9 pr-10"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
