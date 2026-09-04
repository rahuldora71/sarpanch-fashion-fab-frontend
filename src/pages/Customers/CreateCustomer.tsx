import { ArrowLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import CustomerForm from "@/components/customers/CustomerForm";

export default function CreateCustomerPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-4xl">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex items-center gap-3">

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Add Customer
          </h1>

          <p className="text-sm text-muted-foreground">
            Create a new customer profile.
          </p>
        </div>

      </div>


      {/* =====================================================
          FORM
      ====================================================== */}

      <Card>

        <CardHeader>
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-lg
                bg-primary/10
                text-primary
              "
            >
              <UserPlus className="size-5" />
            </div>

            <div>
              <CardTitle>
                Customer Details
              </CardTitle>

              <CardDescription>
                Add the information needed to
                manage this customer.
              </CardDescription>
            </div>

          </div>
        </CardHeader>


        <CardContent>
          <CustomerForm
            onSuccess={() => {
              navigate("/customers");
            }}
            onCancel={() => {
              navigate("/customers");
            }}
          />
        </CardContent>

      </Card>

    </div>
  );
}