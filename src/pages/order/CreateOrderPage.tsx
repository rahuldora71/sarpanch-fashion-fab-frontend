import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import type {
  CustomerResponse,
  CustomerSummary,
} from "@/models/Customer";

import {
  getCustomers,
  searchCustomers,
} from "@/services/CustomerService";

import {
  getOrderSubmissionErrorMessage,
  submitOrder,
} from "@/services/orderSubmissionService";

import {
  loadOrderDraft,
  saveOrderDraft,
  clearOrderDraft,
} from "@/utils/orderDraftStorage";

import type {
  GarmentFormValue,
  OrderDraft,
} from "@/types/order";

import type {
  MeasurementDraft,
} from "@/types/measurement";

import { OrderStepper } from "@/components/orders/create/OrderStepper";

import { CustomerStep } from "@/components/orders/create/CustomerStep";

import {
  GarmentsStep,
  createEmptyGarment,
  type OrderGarment,
} from "@/components/orders/create/GarmentsStep";

import { MeasurementsStep } from "@/components/orders/create/MeasurementsStep";

import { BillingStep } from "@/components/orders/create/BillingStep";

import { ConfirmStep } from "@/components/orders/create/ConfirmStep";

import { CreateOrderNavigation } from "@/components/orders/create/CreateOrderNavigation";
import type { BillingDraft } from "@/types/billing";
import type { RootState } from "@/app/store";

const CUSTOMER_PAGE_SIZE = 10;

function today(): string {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

/* =========================================================
   GARMENT NORMALIZATION
   ========================================================= */

function normalizeGarments(
  garments: GarmentFormValue[],
): OrderGarment[] {
  return garments.map((garment, index) => ({
    ...garment,

    localId: crypto.randomUUID(),

    addOns: garment.addOns ?? [],

    sampleNumber: garment.sampleNumber ?? String(index + 1),

    individualDueDateEnabled:
      garment.individualDueDate ?? false,

    dueDate: garment.dueDate ?? "",
  }));
}

/* =========================================================
   GARMENT TOTAL
   ========================================================= */

function garmentTotal(
  garment: OrderGarment,
) {
  return (
    Number(garment.price ?? 0) +
    garment.addOns.reduce(
      (sum, addOn) =>
        sum + Number(addOn.price ?? 0) * Math.max(1, Number(addOn.quantity) || 1),
      0,
    )
  );
}

/* =========================================================
   MEASUREMENT DRAFT NORMALIZATION
   ========================================================= */

/**
 * Older saved drafts may contain:
 *
 * measurements: null
 *
 * or an invalid value.
 *
 * Keep the order creation page safe when restoring them.
 */
function normalizeMeasurements(
  value: unknown,
): Record<string, MeasurementDraft> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<
    string,
    MeasurementDraft
  >;
}

const DEFAULT_BILLING_DRAFT: BillingDraft = {
  discount: 0,
  advanceAmount: 0,
  paymentMethod: "UPI",
  deliveryDate: "",
  additionalCharges: [],
};

function normalizeBilling(value: unknown): BillingDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_BILLING_DRAFT;
  }

  const source = value as Partial<BillingDraft>;

  return {
    discount: Number(source.discount) >= 0 ? Number(source.discount) : 0,
    advanceAmount:
      Number(source.advanceAmount) >= 0
        ? Number(source.advanceAmount)
        : 0,
    paymentMethod:
      source.paymentMethod === "CASH" ||
        source.paymentMethod === "UPI" ||
        source.paymentMethod === "CARD" ||
        source.paymentMethod === "BANK_TRANSFER" ||
        source.paymentMethod === "CHEQUE"
        ? source.paymentMethod
        : "UPI",
    deliveryDate:
      typeof source.deliveryDate === "string"
        ? source.deliveryDate
        : "",
    additionalCharges: Array.isArray(source.additionalCharges)
      ? source.additionalCharges.map((charge) => ({
        id:
          typeof charge?.id === "string"
            ? charge.id
            : crypto.randomUUID(),
        description:
          typeof charge?.description === "string"
            ? charge.description
            : "",
        amount:
          Number(charge?.amount) >= 0
            ? Number(charge.amount)
            : 0,
      }))
      : [],
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  /*
   * Load the draft only once when the page is created.
   */
  const [initialDraft] = useState(() =>
    loadOrderDraft(),
  );

  /* =======================================================
     STEP
  ======================================================= */

  const [step, setStep] = useState(
    initialDraft?.step ?? 1,
  );

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<CustomerSummary | null>(
    initialDraft?.customer ?? null,
  );

  const [customers, setCustomers] =
    useState<CustomerSummary[]>([]);

  const [search, setSearch] =
    useState("");

  /* =======================================================
     GARMENTS
  ======================================================= */

  const [garments, setGarments] =
    useState<OrderGarment[]>(
      initialDraft?.garments?.length
        ? normalizeGarments(
          initialDraft.garments,
        )
        : [createEmptyGarment()],
    );

  const [commonDueDate, setCommonDueDate] =
    useState(
      initialDraft?.commonDueDate ?? "",
    );

  const [orderDate, setOrderDate] = useState(
    initialDraft?.orderDate || today(),
  );

  /* =======================================================
     MEASUREMENTS
  ======================================================= */

  const [
    measurements,
    setMeasurements,
  ] = useState<
    Record<string, MeasurementDraft>
  >(() =>
    normalizeMeasurements(
      initialDraft?.measurements,
    ),
  );

  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(true);

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  /* =======================================================
     BILLING
  ======================================================= */

  const subtotal = useMemo(
    () =>
      garments.reduce(
        (sum, garment) =>
          sum + garmentTotal(garment),
        0,
      ),
    [garments],
  );

  const [billing, setBilling] = useState<BillingDraft>(() =>
    normalizeBilling(initialDraft?.billing),
  );

  const billableTotal = useMemo(() => {
    const additionalCharges = billing.additionalCharges.reduce(
      (sum, charge) => sum + Math.max(0, Number(charge.amount) || 0),
      0,
    );
    return Math.max(0, subtotal + additionalCharges - Math.max(0, Number(billing.discount) || 0));
  }, [subtotal, billing.additionalCharges, billing.discount]);
  /* =======================================================
     SAVE ORDER DRAFT
     ======================================================= */

  useEffect(() => {
    const draft: OrderDraft = {
      version: 2,
      updatedAt:
        new Date().toISOString(),

      step,

      customer: selectedCustomer,

      commonDueDate,

      garments,

      measurements,

      billing: billing,
      orderDate,
    };

    saveOrderDraft(draft);
  }, [
    step,
    selectedCustomer,
    commonDueDate,
    garments,
    measurements,
    billing,
    orderDate,
  ]);

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */
  const loadCustomers = useCallback(
    async (keyword: string) => {
      try {
        if (keyword.trim()) {
          setSearchLoading(true);
        } else {
          setLoadingCustomers(true);
        }

        setError(null);

        const response = keyword.trim()
          ? await searchCustomers(
            keyword.trim(),
            0,
            CUSTOMER_PAGE_SIZE,
          )
          : await getCustomers(
            0,
            CUSTOMER_PAGE_SIZE,
          );

        setCustomers(
          response.content ?? [],
        );
      } catch (err) {
        console.error(
          "Failed to load customers:",
          err,
        );

        setCustomers([]);

        setError(
          "Unable to load customers. Please try again.",
        );
      } finally {
        setLoadingCustomers(false);
        setSearchLoading(false);
      }
    },
    [],
  );

  /* =======================================================
     CUSTOMER SEARCH
  ======================================================= */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () =>
          void loadCustomers(search),
        search.trim() ? 350 : 0,
      );

    return () =>
      window.clearTimeout(timeout);
  }, [
    search,
    loadCustomers,
  ]);

  /* =======================================================
     CUSTOMER SELECT
  ======================================================= */

  const handleSelectCustomer = (
    customer: CustomerSummary,
  ) => {
    setSelectedCustomer(customer);
    setError(null);
  };

  /* =======================================================
     CUSTOMER CREATED
  ======================================================= */

  const handleCustomerCreated = (
    customer: CustomerResponse,
  ) => {
    const summary =
      customer as CustomerSummary;

    setSelectedCustomer(summary);

    setCustomers((previous) => [
      summary,

      ...previous.filter(
        (item) =>
          item.id !== summary.id,
      ),
    ]);

    setSearch("");
    setError(null);
  };

  /* =======================================================
     NEXT
  ======================================================= */

  const handleNext = () => {
    /* -----------------------------------------------------
       CUSTOMER
    ----------------------------------------------------- */

    if (
      step === 1 &&
      !selectedCustomer
    ) {
      setError(
        "Please select a customer.",
      );

      return;
    }

    /* -----------------------------------------------------
       GARMENTS
    ----------------------------------------------------- */

    if (step === 2) {
      const invalid =
        garments.some(
          (garment) =>
            !garment.serviceId,
        );

      if (invalid) {
        setError(
          "Please select a garment type for every garment.",
        );

        return;
      }
    }

    /* -----------------------------------------------------
   MEASUREMENTS
----------------------------------------------------- */

    if (step === 3) {
      /*
       * Measurement validation can be added here later
       * when the backend order-create DTO requires all
       * required measurement fields.
       */
    }

    /*
     * Use the garment due date as the initial
     * delivery date for billing.
     */
    if (step === 3 && commonDueDate) {
      setBilling((previous) => ({
        ...previous,
        deliveryDate: commonDueDate,
      }));
    }

    if (step === 4 && !orderDate) {
      setError("Please select the order date.");
      return;
    }

    setError(null);

    setStep(
      (previous) =>
        Math.min(
          previous + 1,
          5,
        ),
    );
  };

    /* =======================================================
       BACK
    ======================================================= */

    const handleBack = () => {
      if (step === 1) {
        navigate("/orders");
        return;
      }

      setError(null);

      setStep(
        (previous) =>
          Math.max(
            previous - 1,
            1,
          ),
      );
    };

    /* =======================================================
       START OVER
    ======================================================= */

    const handleStartOver = () => {
      clearOrderDraft();

      setStep(1);

      setSelectedCustomer(null);

      setGarments([
        createEmptyGarment(),
      ]);

      setCommonDueDate("");

      setMeasurements({});

      setBilling(DEFAULT_BILLING_DRAFT);

      setOrderDate(today());

      setError(null);
    };
    const billingItems = garments.map(
      (garment, index) => ({
        garmentNumber: index + 1,

        garmentName:
          garment.serviceName ||
          `Garment ${index + 1}`,

        price: Number(garment.price || 0),

          addOns: (garment.addOns ?? []).map(
            (addOn) => ({
              name: addOn.name,
              price: Number(addOn.price || 0),
              quantity: Math.max(1, Number(addOn.quantity) || 1),
          })
        ),

        total:
          Number(garment.price || 0) +
          (garment.addOns ?? []).reduce(
            (sum, addOn) =>
              sum + Number(addOn.price || 0) * Math.max(1, Number(addOn.quantity) || 1),
            0
          ),
      })
    );
    /* =======================================================
       CONFIRM ORDER
    ======================================================= */

    const handleConfirm = async () => {
      if (!selectedCustomer) {
        setError(
          "Please select a customer.",
        );

        return;
      }

      if (!currentUser) {
        setError("Your session has expired. Please sign in again before creating an order.");
        return;
      }

      if (!orderDate) {
        setError("Please select the order date.");
        return;
      }

      if (Number(billing.advanceAmount) > billableTotal) {
        setError(`Advance payment cannot exceed the order total of ₹${billableTotal.toFixed(2)}.`);
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        await submitOrder({
          customerId: selectedCustomer.id,
          orderDate,
          garments,
          measurements,
          billing,
        });

        clearOrderDraft();
        toast.success("Order created successfully.");
        navigate("/orders");
        return;

      } catch (err) {
        console.error(
          "Failed to create order:",
          err,
        );

        const message = getOrderSubmissionErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    };

    /* =======================================================
       RENDER
    ======================================================= */

    return (
      <main className="min-h-full bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 lg:px-8">

          {/* =================================================
            HEADER
        ================================================= */}

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create New Order
              </h1>

              {selectedCustomer && (
                <p className="mt-1 text-sm text-muted-foreground">
                  For{" "}
                  <span className="font-medium text-foreground">
                    {selectedCustomer.name}
                  </span>

                  {selectedCustomer.customerCode &&
                    ` · ${selectedCustomer.customerCode}`}
                </p>
              )}
            </div>

            {step > 1 && (
              <button
                type="button"
                onClick={
                  handleStartOver
                }
                className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Start over
              </button>
            )}
          </div>

          {/* =================================================
            STEPPER
        ================================================= */}

          <div className="mb-6">
            <OrderStepper
              currentStep={step}
            />
          </div>

          {/* =================================================
            ERROR
        ================================================= */}

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* =================================================
            STEP 1 — CUSTOMER
        ================================================= */}

          {step === 1 && (
            <CustomerStep
              customers={customers}
              search={search}
              loading={
                loadingCustomers ||
                searchLoading
              }
              selectedCustomer={
                selectedCustomer
              }
              onSearchChange={
                setSearch
              }
              onSelectCustomer={
                handleSelectCustomer
              }
              onCustomerCreated={
                handleCustomerCreated
              }
            />
          )}

          {/* =================================================
            STEP 2 — GARMENTS
        ================================================= */}

          {step === 2 && (
            <GarmentsStep
              garments={garments}
              commonDueDate={
                commonDueDate
              }
              onChange={
                setGarments
              }
              onCommonDueDateChange={
                setCommonDueDate
              }
            />
          )}

          {/* =================================================
            STEP 3 — MEASUREMENTS
        ================================================= */}

          {step === 3 && (
            <MeasurementsStep
              customerId={
                selectedCustomer?.id ??
                null
              }

              garments={garments}

              measurements={
                measurements
              }

              onChange={
                setMeasurements
              }
            />
          )}

          {/* =================================================
            STEP 4 — BILLING
        ================================================= */}

          {step === 4 && (
            <BillingStep
              items={billingItems}
              billing={billing}
              deliveryDate={commonDueDate}
              onChange={setBilling}
              orderDate={orderDate}
              onOrderDateChange={setOrderDate}
            />
          )}

          {/* =================================================
            STEP 5 — CONFIRM
        ================================================= */}

          {step === 5 && (
            <ConfirmStep
              customer={
                selectedCustomer
              }
              garments={garments}
              commonDueDate={
                commonDueDate
              }
              subtotal={subtotal}
              billing={billing}
              orderDate={orderDate}
              submitting={submitting}
              onBack={handleBack}
              onConfirm={
                handleConfirm
              }
            />
          )}

          {/* =================================================
            NAVIGATION
        ================================================= */}

          {(step === 1 ||
            step === 2) && (
              <div className="mt-5">
                <CreateOrderNavigation
                  onBack={handleBack}
                  onNext={handleNext}
                  nextDisabled={
                    step === 1 &&
                    !selectedCustomer
                  }
                  backLabel={
                    step === 1
                      ? "Cancel"
                      : "Back"
                  }
                />
              </div>
            )}

          {/* =================================================
            MEASUREMENT / BILLING NAVIGATION

            MeasurementsStep itself currently has no
            navigation buttons, so the page should provide
            them here.
        ================================================= */}

          {(step === 3 ||
            step === 4) && (
              <div className="mt-5">
                <CreateOrderNavigation
                  onBack={handleBack}
                  onNext={handleNext}
                  backLabel="Back"
                />
              </div>
            )}

        </div>
      </main>
    );
}
