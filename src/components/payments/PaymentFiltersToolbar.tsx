import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod, PaymentType } from "@/types/order";

export interface PaymentFiltersToolbarProps {
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  onSearchClear: () => void;
  methodFilter: PaymentMethod | "ALL";
  onMethodChange: (val: PaymentMethod | "ALL") => void;
  typeFilter: PaymentType | "ALL";
  onTypeChange: (val: PaymentType | "ALL") => void;
  onResetFilters: () => void;
}

export default function PaymentFiltersToolbar({
  searchKeyword,
  onSearchChange,
  onSearchClear,
  methodFilter,
  onMethodChange,
  typeFilter,
  onTypeChange,
  onResetFilters,
}: PaymentFiltersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer, phone, order ID, note..."
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
        {searchKeyword && (
          <button
            onClick={onSearchClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Method Filter */}
      <div className="w-36">
        <Select
          value={methodFilter}
          onValueChange={(val) => {
            if (val) {
              onMethodChange(val as PaymentMethod | "ALL");
            }
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="CHEQUE">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="w-36">
        <Select
          value={typeFilter}
          onValueChange={(val) => {
            if (val) {
              onTypeChange(val as PaymentType | "ALL");
            }
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Payment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="ADVANCE">Advance</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="FINAL">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Filters */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetFilters}
        className="h-9 text-xs text-muted-foreground hover:text-foreground"
      >
        Reset Filters
      </Button>
    </div>
  );
}
