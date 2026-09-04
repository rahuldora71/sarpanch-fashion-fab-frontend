import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OrderSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function OrderSearch({
  value,
  onChange,
  placeholder = "Search by order ID, customer name or phone...",
}: OrderSearchProps) {
  return (
    <div className="relative w-full">
      <Search
        className="
          pointer-events-none
          absolute
          left-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 pr-10"
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="
            absolute
            right-1
            top-1/2
            h-7
            w-7
            -translate-y-1/2
          "
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}