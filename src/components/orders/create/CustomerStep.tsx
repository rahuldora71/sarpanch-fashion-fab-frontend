import type { CustomerResponse, CustomerSummary } from "@/models/Customer";
import { CustomerSearch } from "./CustomerSearch";
import { CustomerList } from "./CustomerList";
import { CreateCustomerDialog } from "./CreateCustomerDialog";
import OrderCustomerPhotoPanel from "./OrderCustomerPhotoPanel";

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
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Select Customer</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select customer for this order, or capture photos for reference.
        </p>
      </div>

      {/* Selected Customer Posture & Fitting Photo Panel */}
      {selectedCustomer && (
        <OrderCustomerPhotoPanel
          key={selectedCustomer.id}
          customer={selectedCustomer}
          compact={false}
        />
      )}

      <div>
        <CustomerSearch value={search} onChange={onSearchChange} />
      </div>

      <div>
        <CustomerList
          customers={customers}
          loading={loading}
          selectedCustomerId={selectedCustomer?.id}
          onSelect={onSelectCustomer}
        />
      </div>

      <div className="border-t pt-4">
        <CreateCustomerDialog onCreated={onCustomerCreated} />
      </div>
    </section>
  );
}
