import type { CustomerResponse, CustomerSummary } from "@/models/Customer";
import { CustomerSearch } from "./CustomerSearch";
import { CustomerList } from "./CustomerList";
import { CreateCustomerDialog } from "./CreateCustomerDialog";

interface CustomerStepProps {
  customers: CustomerSummary[];
  search: string;
  loading: boolean;
  selectedCustomer: CustomerSummary | null;
  onSearchChange: (value: string) => void;
  onSelectCustomer: (customer: CustomerSummary) => void;
  onCustomerCreated: (customer: CustomerResponse) => void;
}

export function CustomerStep({
  customers,
  search,
  loading,
  selectedCustomer,
  onSearchChange,
  onSelectCustomer,
  onCustomerCreated,
}: CustomerStepProps) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-base font-semibold">Select Customer</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select the customer for this order.
        </p>
      </div>

      <div className="mt-4">
        <CustomerSearch value={search} onChange={onSearchChange} />
      </div>

      <div className="mt-3">
        <CustomerList
          customers={customers}
          loading={loading}
          selectedCustomerId={selectedCustomer?.id}
          onSelect={onSelectCustomer}
        />
      </div>

      <div className="mt-4 border-t pt-4">
        <CreateCustomerDialog onCreated={onCustomerCreated} />
      </div>
    </section>
  );
}
