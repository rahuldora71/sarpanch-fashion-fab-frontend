
import type { OrderDraft } from "@/types/order";
import { loadOrderDraft } from "@/utils/orderDraftStorage";
import { useEffect, useState } from "react";

export default function showOrderDraft() { 
    const [draft, setDraft] = useState<OrderDraft | null>(null);

  useEffect(() => {
    setDraft(loadOrderDraft());
  }, []);

  if (!draft) {
    return (
      <div className="p-4 text-muted-foreground">
        No order draft found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* Customer */}
      <div>
        <h2 className="text-lg font-semibold">
          Customer
        </h2>

        <p>
          {draft.customer?.name}
        </p>

        {draft.customer?.customerCode && (
          <p className="text-sm text-muted-foreground">
            {draft.customer.customerCode}
          </p>
        )}
      </div>

      {/* Garments */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Garments
        </h2>

        <div className="space-y-3">
          {draft.garments.map((garment, index) => (
            <div
              key={index}
              className="rounded-lg border p-4"
            >
              <p className="font-medium">
                Garment {index + 1}
              </p>

              <pre className="mt-2 text-sm">
                {JSON.stringify(garment, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}


