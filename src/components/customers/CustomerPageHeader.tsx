import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  totalCustomers: number;
  onAddCustomer: () => void;
}

export default function CustomerPageHeader({
  totalCustomers,
  onAddCustomer,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-foreground" />

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Customers
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {totalCustomers} total customers
        </p>
      </div>

      <Button
        type="button"
        onClick={onAddCustomer}
        className="shrink-0"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        New Customer
      </Button>
    </div>
  );
}