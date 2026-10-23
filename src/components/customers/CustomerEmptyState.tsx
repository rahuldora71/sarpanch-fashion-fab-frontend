import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  search: string;
  onAddCustomer: () => void;
}

export default function CustomerEmptyState({
  search,
  onAddCustomer,
}: Props) {
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="font-medium text-foreground">
        {hasSearch
          ? "No customers found"
          : "No customers yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasSearch
          ? "Try another name, phone number, or customer code."
          : "Create your first customer to start taking orders."}
      </p>

      {!hasSearch ? (
        <Button
          type="button"
          onClick={onAddCustomer}
          className="mt-4"
        >
          Add Customer
        </Button>
      ) : null}
    </div>
  );
}