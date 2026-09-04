import { Loader2, Users } from "lucide-react";
import type { CustomerSummary } from "@/models/Customer";
import { CustomerListItem } from "./CustomerListItem";

interface CustomerListProps {
  customers: CustomerSummary[];
  loading: boolean;
  selectedCustomerId?: number;
  onSelect: (customer: CustomerSummary) => void;
}

export function CustomerList({
  customers,
  loading,
  selectedCustomerId,
  onSelect,
}: CustomerListProps) {
  if (loading) {
    return (
      <div className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex h-[230px] flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No customers found</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Try another name or phone number, or create a new customer.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1 scrollbar-none">
      {customers.map((customer) => (
        <CustomerListItem
          key={customer.id}
          customer={customer}
          selected={selectedCustomerId === customer.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
