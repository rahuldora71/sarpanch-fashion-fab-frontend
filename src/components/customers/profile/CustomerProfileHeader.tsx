import {
  ArrowLeft,
  Edit3,
  Mail,
  Phone,
  Plus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import CustomerAvatar from "@/components/customers/CustomerAvatar";

import type { CustomerResponse } from "@/models/Customer";

interface Props {
  customer: CustomerResponse;
}

export default function CustomerProfileHeader({
  customer,
}: Props) {
  const navigate = useNavigate();

  return (
    <>
      {/* BACK */}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => navigate("/customers")}
        className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Customers
      </Button>

      {/* HEADER */}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <CustomerAvatar
            name={customer.name}
            image={customer.image}
            size="lg"
          />

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-foreground">
              {customer.name}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {customer.customerCode ? (
                <span className="font-mono text-xs text-orange-600 dark:text-orange-400">
                  {customer.customerCode}
                </span>
              ) : null}

              {customer.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
              ) : null}

              {customer.email ? (
                <span className="inline-flex min-w-0 items-center gap-1 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {customer.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(
                `/customers/${customer.id}/edit`,
              )
            }
          >
            <Edit3 className="mr-1.5 h-4 w-4" />
            Edit
          </Button>

          <Button
            type="button"
            onClick={() =>
              navigate(
                `/orders/new?customerId=${customer.id}`,
              )
            }
            className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>
    </>
  );
}