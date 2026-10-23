import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import toast from "react-hot-toast";

import type {
  CustomerResponse,
  CustomerSummary,
} from "@/models/Customer";

import {
  getCustomerById,
  getCustomers,
  searchCustomers,
} from "@/services/CustomerService";
import { getActiveServices } from "@/services/serviceService";

import {
  getOrderSubmissionErrorMessage,
  isValidCalendarDate,
  submitOrder,
} from "@/services/orderSubmissionService";

import {
  editOrder,
  getOrderDetails,
} from "@/services/orderEditService";

import {
  loadOrderDraft,
  saveOrderDraft,
  clearOrderDraft,
} from "@/utils/orderDraftStorage";
import { generateUUID } from "@/utils/uuid";

import type {
  GarmentFormValue,
  OrderDetailsResponse,
  OrderDraft,
  OrderPaymentDetails,
} from "@/types/order";

import type {
  EditOrderRequestDto,
} from "@/types/orderEdit";

import type {
  MeasurementDraft,
} from "@/types/measurement";

import { OrderStepper } from "@/components/orders/create/OrderStepper";

import { CustomerStep } from "@/components/orders/create/CustomerStep";
import OrderCustomerPhotoPanel from "@/components/orders/create/OrderCustomerPhotoPanel";

import {
  GarmentsStep,
  createEmptyGarment,
  type OrderGarment,
} from "@/components/orders/create/GarmentsStep";

import { MeasurementsStep } from "@/components/orders/create/MeasurementsStep";

import { BillingStep } from "@/components/orders/create/BillingStep";

import { ConfirmStep } from "@/components/orders/create/ConfirmStep";

import { CreateOrderNavigation } from "@/components/orders/create/CreateOrderNavigation";
import { OrderConfirmationDialog } from "@/components/orders/OrderConfirmationDialog";
import { fromCompleteOrder, type InvoiceData } from "@/services/invoiceService";
import type { BillingDraft, PaymentDraft } from "@/types/billing";
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

    localId: generateUUID(),

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
  advanceAmount: 0,
  paymentMethod: "UPI",
  deliveryDate: "",
  additionalCharges: [],
};

function normalizeBilling(
  paymentValue: unknown,
  additionalChargesValue?: unknown,
): BillingDraft {
  if (!paymentValue || typeof paymentValue !== "object" || Array.isArray(paymentValue)) {
    return DEFAULT_BILLING_DRAFT;
  }

  const source = paymentValue as Partial<BillingDraft>;
  const additionalChargesSource = Array.isArray(additionalChargesValue)
    ? additionalChargesValue
    : source.additionalCharges;

  return {
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
    additionalCharges: Array.isArray(additionalChargesSource)
      ? additionalChargesSource.map((charge) => ({
        id:
          typeof charge?.id === "string"
            ? charge.id
            : generateUUID(),
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

function normalizeOrderDiscount(
  draft: OrderDraft | null,
): number {
  if (Number(draft?.discount) >= 0) {
    return Number(draft?.discount);
  }

  /* Migration for drafts saved before discount became order-level. */
  const legacyPayment = draft?.payment ?? draft?.billing;
  if (legacyPayment && typeof legacyPayment === "object") {
    const discount = (legacyPayment as { discount?: unknown }).discount;
    if (Number(discount) >= 0) return Number(discount);
  }

  return 0;
}

function getInitialLastValidDeliveryDate(
  draft: OrderDraft | null,
): string {
  const savedPayment = draft?.payment ?? draft?.billing;
  const paymentDeliveryDate =
    savedPayment && typeof savedPayment === "object"
      ? (savedPayment as { deliveryDate?: unknown }).deliveryDate
      : undefined;

  const candidates = [
    draft?.lastValidDeliveryDate,
    paymentDeliveryDate,
    draft?.commonDueDate,
  ];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && isValidCalendarDate(value),
  ) ?? "";
}

/* =========================================================
   PAGE
   ========================================================= */

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const isEditMode = Boolean(orderIdParam);
  const numericOrderId = orderIdParam ? Number(orderIdParam) : null;

  const currentUser = useSelector((state: RootState) => state.auth.user);

  /*
   * Load the draft only once when creating a NEW order (never in Edit Mode).
   */
  const [initialDraft] = useState(() =>
    isEditMode ? null : loadOrderDraft(),
  );

  const [loadingOrderDetails, setLoadingOrderDetails] = useState(isEditMode);
  const [existingPayments, setExistingPayments] = useState<OrderPaymentDetails[]>([]);
  const [existingPaidTotal, setExistingPaidTotal] = useState(0);

  /* =======================================================
     STEP
  ======================================================= */

  const [step, setStep] = useState(
    isEditMode ? 2 : (initialDraft?.step ?? 1),
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

  const [sampleBookPageNumber, setSampleBookPageNumber] = useState(
    initialDraft?.sampleBookPageNumber ?? "",
  );

  const [orderDiscount, setOrderDiscount] = useState(() =>
    normalizeOrderDiscount(initialDraft),
  );

  const [lastValidDeliveryDate, setLastValidDeliveryDate] = useState(() =>
    getInitialLastValidDeliveryDate(initialDraft),
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

  const submissionInProgress = useRef(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [confirmedInvoice, setConfirmedInvoice] = useState<InvoiceData | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

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
    normalizeBilling(
      initialDraft?.payment ?? initialDraft?.billing,
      initialDraft?.additionalCharges,
    ),
  );

  /* =======================================================
     HANDLE URL QUERY PARAMS (e.g. from Measurements page)
     ======================================================= */

  const [searchParams] = useSearchParams();
  const queryCustomerId = searchParams.get("customerId");
  const queryServiceId = searchParams.get("serviceId");

  useEffect(() => {
    if (isEditMode || !queryCustomerId) return;
    const cid = Number(queryCustomerId);
    if (!Number.isFinite(cid)) return;

    let cancelled = false;
    const loadQueryCustomer = async () => {
      try {
        const cust = await getCustomerById(cid);
        if (cancelled) return;
        const summary: CustomerSummary = {
          id: cust.id,
          name: cust.name,
          phone: cust.phone,
          customerCode: cust.customerCode,
          totalOrders: 0,
          totalSpent: 0,
          balance: 0,
        };
        setSelectedCustomer(summary);
        setStep(2);

        if (queryServiceId) {
          const sid = Number(queryServiceId);
          if (Number.isFinite(sid)) {
            const activeServices = await getActiveServices(0, 100);
            if (cancelled) return;
            const targetService = activeServices.find((s) => s.id === sid);
            if (targetService) {
              setGarments((prev) => {
                if (prev.length === 0) return [createEmptyGarment()];
                const first = prev[0];
                return [
                  {
                    ...first,
                    serviceId: targetService.id,
                    serviceName: targetService.name,
                    price: targetService.price,
                  },
                  ...prev.slice(1),
                ];
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load customer from URL query:", err);
      }
    };

    void loadQueryCustomer();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, queryCustomerId, queryServiceId]);

  /* =======================================================
     LOAD EXISTING ORDER FOR EDIT MODE
     ======================================================= */

  useEffect(() => {
    if (!isEditMode || !numericOrderId || !Number.isFinite(numericOrderId)) {
      return;
    }

    let cancelled = false;

    async function fetchExistingOrder() {
      try {
        setLoadingOrderDetails(true);
        setError(null);

        const orderData: OrderDetailsResponse = await getOrderDetails(numericOrderId!);

        if (cancelled) return;

        setSelectedCustomer({
          id: orderData.customer.id,
          customerCode: orderData.customer.customerCode,
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email ?? undefined,
          image: orderData.customer.image ?? undefined,
        });

        setOrderDate(orderData.orderDate || today());
        setSampleBookPageNumber(orderData.sampleBookPageNumber ?? "");
        setOrderDiscount(Number(orderData.discount ?? 0));

        const defaultCommonDueDate = orderData.garments[0]?.dueDate ?? "";
        setCommonDueDate(defaultCommonDueDate);
        if (defaultCommonDueDate) {
          setLastValidDeliveryDate(defaultCommonDueDate);
        }

        const nextMeasurements: Record<string, MeasurementDraft> = {};

        const mappedGarments: OrderGarment[] = (orderData.garments ?? []).map(
          (g, idx) => {
            const localId = generateUUID();
            // A garment is locked if cutting has already started (i.e. status !== "FABRIC_CUT")
            const isLocked = Boolean(
              g.garmentId && g.status && g.status !== "FABRIC_CUT",
            );

            if (g.measurement) {
              const fieldsMap: Record<string, string | number | null> = {};
              if (
                g.measurement.measurementFields &&
                typeof g.measurement.measurementFields === "object"
              ) {
                for (const [k, v] of Object.entries(
                  g.measurement.measurementFields,
                )) {
                  fieldsMap[k] =
                    typeof v === "string" || typeof v === "number"
                      ? v
                      : v != null
                      ? String(v)
                      : null;
                }
              }

              nextMeasurements[localId] = {
                serviceId: g.serviceId,
                serviceName: g.serviceName,
                measurementFields: fieldsMap,
                note: g.measurement.note ?? "",
                alterationNote: g.measurement.alterationNote ?? "",
                sourceMeasurementId: g.measurement.measurementId ?? null,
              };
            }

            return {
              localId,
              garmentId: g.garmentId,
              status: g.status,
              isLocked,
              serviceId: g.serviceId,
              serviceName: g.serviceName,
              price: Number(g.price ?? 0),
              sampleNumber: g.sampleNumber ?? String(idx + 1),
              notes: g.note ?? "",
              addOns: (g.addOns ?? []).map((a) => ({
                id: a.addOnId,
                name: a.name,
                price: Number(a.unitPrice ?? 0),
                tailorCommission: 0,
                quantity: Number(a.quantity || 1),
                totalPrice: Number(
                  a.totalPrice ?? Number(a.unitPrice || 0) * Number(a.quantity || 1),
                ),
                beforeCutting: false,
                note: a.note ?? undefined,
              })),
              dueDate: g.dueDate ?? defaultCommonDueDate,
              individualDueDateEnabled: Boolean(
                g.dueDate && g.dueDate !== defaultCommonDueDate,
              ),
            };
          },
        );

        setGarments(
          mappedGarments.length > 0 ? mappedGarments : [createEmptyGarment()],
        );
        setMeasurements(nextMeasurements);

        setBilling({
          advanceAmount: 0,
          paymentMethod: "UPI",
          deliveryDate: defaultCommonDueDate,
          additionalCharges: (orderData.charges ?? []).map((c) => ({
            id: generateUUID(),
            description: c.description ?? "",
            amount: Number(c.amount ?? 0),
          })),
        });

        setExistingPayments(orderData.payments ?? []);
        setExistingPaidTotal(Number(orderData.totalPaid ?? 0));
      } catch (err: any) {
        console.error("Failed to load order for editing:", err);
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load order details for editing.";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) {
          setLoadingOrderDetails(false);
        }
      }
    }

    void fetchExistingOrder();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, numericOrderId]);

  /* =======================================================
     SAVE ORDER DRAFT (Create Mode Only)
     ======================================================= */

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    const draft: OrderDraft = {
      version: 2,
      updatedAt:
        new Date().toISOString(),

      step,

      customer: selectedCustomer,

      commonDueDate,

      garments,

      measurements,

      payment: {
        advanceAmount: billing.advanceAmount,
        paymentMethod: billing.paymentMethod,
        deliveryDate: billing.deliveryDate,
      } satisfies PaymentDraft,
      additionalCharges: billing.additionalCharges,
      sampleBookPageNumber,
      discount: orderDiscount,
      lastValidDeliveryDate,
      orderDate,
    };

    saveOrderDraft(draft);
  }, [
    isEditMode,
    step,
    selectedCustomer,
    commonDueDate,
    garments,
    measurements,
    billing,
    sampleBookPageNumber,
    orderDiscount,
    lastValidDeliveryDate,
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
    if (isEditMode) {
      toast.error("Customer cannot be changed on an existing order.");
      return;
    }
    setSelectedCustomer({ ...customer });
    setError(null);
  };

  /* =======================================================
     CUSTOMER CREATED
  ======================================================= */

  const handleCustomerCreated = (
    customer: CustomerResponse,
  ) => {
    if (isEditMode) {
      return;
    }
    const summary: CustomerSummary = { ...customer };

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

      if (isValidCalendarDate(commonDueDate)) {
        setLastValidDeliveryDate(commonDueDate);
      }
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
      if (step === 1 || (isEditMode && step === 2)) {
        if (isEditMode && numericOrderId) {
          navigate(`/orders/${numericOrderId}`);
          return;
        }
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
      if (isEditMode) {
        if (numericOrderId) {
          navigate(`/orders/${numericOrderId}`);
        }
        return;
      }

      clearOrderDraft();

      setStep(1);

      setSelectedCustomer(null);

      setGarments([
        createEmptyGarment(),
      ]);

      setCommonDueDate("");

      setSampleBookPageNumber("");

      setOrderDiscount(0);

      setLastValidDeliveryDate("");

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
       CONFIRM ORDER / SAVE CHANGES
    ======================================================= */

    const handleBillingChange = (nextBilling: BillingDraft) => {
      if (isValidCalendarDate(nextBilling.deliveryDate)) {
        setLastValidDeliveryDate(nextBilling.deliveryDate);
      }

      setBilling(nextBilling);
    };

    const handleConfirm = async () => {
      if (submissionInProgress.current) return;

      submissionInProgress.current = true;
      setSubmitting(true);

      try {
        if (!selectedCustomer) {
          throw new Error("Please select a customer.");
        }

        if (!currentUser) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        if (!Number.isSafeInteger(currentUser.id) || currentUser.id <= 0) {
          throw new Error("Your authenticated user ID is unavailable. Please sign in again.");
        }

        setError(null);

        // -------------------------------------------------------
        // EDIT MODE SUBMISSION
        // -------------------------------------------------------
        if (isEditMode) {
          if (!numericOrderId) {
            throw new Error("Order ID is missing.");
          }

          const editPayload: EditOrderRequestDto = {
            orderDate,
            sampleBookPageNumber: sampleBookPageNumber.trim() || undefined,
            discount: orderDiscount,
            garments: garments.map((g) => {
              const mDraft = measurements[g.localId];
              const effectiveDueDate =
                g.individualDueDateEnabled && g.dueDate
                  ? g.dueDate
                  : commonDueDate || g.dueDate || today();

              const measurementFields: Record<string, string | number> = {};
              if (mDraft?.measurementFields) {
                for (const [k, v] of Object.entries(mDraft.measurementFields)) {
                  if (typeof v === "number" || typeof v === "string") {
                    measurementFields[k] = v;
                  } else if (v != null) {
                    measurementFields[k] = String(v);
                  }
                }
              }

              return {
                garmentId: g.garmentId ?? null,
                serviceId: g.serviceId!,
                price: Number(g.price ?? 0),
                sampleNumber: g.sampleNumber || undefined,
                dueDate: effectiveDueDate,
                tryDate: undefined,
                note: g.notes || undefined,
                measurement: {
                  measurementId: mDraft?.sourceMeasurementId ?? null,
                  takenByUserId: currentUser.id,
                  measurementFields,
                  note: mDraft?.note || undefined,
                  alterationNote: mDraft?.alterationNote || undefined,
                  editable: true,
                },
                addOns: (g.addOns ?? []).map((a) => ({
                  addOnId: a.id,
                  quantity: a.quantity,
                  note: a.note || undefined,
                })),
              };
            }),
            additionalCharges: billing.additionalCharges
              .filter((c) => c.description.trim())
              .map((c) => ({
                description: c.description.trim(),
                amount: Number(c.amount || 0),
              })),
            payment:
              Number(billing.advanceAmount || 0) > 0
                ? {
                    amount: Number(billing.advanceAmount),
                    paymentMethod: billing.paymentMethod,
                    paymentType: "PARTIAL",
                    receivedById: currentUser.id,
                  }
                : undefined,
          };

          await editOrder(numericOrderId, editPayload);
          toast.success("Order updated successfully.");
          navigate(`/orders/${numericOrderId}`);
          return;
        }

        // -------------------------------------------------------
        // CREATE NEW ORDER SUBMISSION
        // -------------------------------------------------------
        const completedOrder = await submitOrder({
          customerId: selectedCustomer.id,
          authenticatedUserId: currentUser.id,
          orderDate,
          garments,
          measurements,
          additionalCharges: billing.additionalCharges,
          payment: {
            advanceAmount: billing.advanceAmount,
            paymentMethod: billing.paymentMethod,
            deliveryDate: billing.deliveryDate,
          },
          commonDueDate,
          lastValidDeliveryDate,
          sampleBookPageNumber,
          discount: orderDiscount,
        });

        clearOrderDraft();
        toast.success("Order created successfully.");

        // Prepare invoice and show confirmation dialog with print & download options
        const invoiceData = fromCompleteOrder(completedOrder, {
          customerPhone: selectedCustomer.phone || "",
          customerAddress: (selectedCustomer as any).address || "",
          dueDate: commonDueDate || billing.deliveryDate || "",
        });
        setConfirmedInvoice(invoiceData);
        setShowConfirmationDialog(true);
      } catch (err: any) {
        console.error(
          isEditMode ? "Failed to update order:" : "Failed to create order:",
          err,
        );

        const message = getOrderSubmissionErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        submissionInProgress.current = false;
        setSubmitting(false);
      }
    };

    /* =======================================================
       RENDER
    ======================================================= */

    if (loadingOrderDetails) {
      return (
        <main className="flex min-h-[420px] items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Loading order #{orderIdParam} for editing...
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-full bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 lg:px-8">

          {/* =================================================
            HEADER
        ================================================= */}

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isEditMode
                  ? `Edit Order #${orderIdParam}`
                  : "Create New Order"}
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

            {isEditMode ? (
              <button
                type="button"
                onClick={handleStartOver}
                className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel Edit
              </button>
            ) : (
              step > 1 && (
                <button
                  type="button"
                  onClick={
                    handleStartOver
                  }
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Start over
                </button>
              )
            )}
          </div>

          {isEditMode && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
              <Lock className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <strong>Order Edit Mode:</strong> Only garments that have not started cutting (Pending Cutting) can be edited or removed. Garments already in cutting or production are locked. Original order date ({orderDate}) and payment history are preserved.
              </div>
            </div>
          )}

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
              sampleBookPageNumber={sampleBookPageNumber}
              onChange={
                setGarments
              }
              onCommonDueDateChange={
                setCommonDueDate
              }
              onSampleBookPageNumberChange={setSampleBookPageNumber}
            />
          )}

          {/* =================================================
            STEP 3 — MEASUREMENTS
        ================================================= */}

          {step === 3 && selectedCustomer && (
            <div className="mb-4">
              <OrderCustomerPhotoPanel
                key={selectedCustomer.id}
                customer={selectedCustomer}
                compact={true}
              />
            </div>
          )}

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
            STEP 4 — PAYMENT
        ================================================= */}

          {step === 4 && (
            <BillingStep
              items={billingItems}
              billing={billing}
              orderDiscount={orderDiscount}
              deliveryDate={commonDueDate}
              isEditMode={isEditMode}
              existingPayments={existingPayments}
              onChange={handleBillingChange}
              onOrderDiscountChange={setOrderDiscount}
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
              orderDiscount={orderDiscount}
              orderDate={orderDate}
              submitting={submitting}
              isEditMode={isEditMode}
              existingPaidTotal={existingPaidTotal}
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
                    step === 1 || (isEditMode && step === 2)
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

        {/* ORDER CONFIRMATION INVOICE DIALOG */}
        <OrderConfirmationDialog
          open={showConfirmationDialog}
          invoice={confirmedInvoice}
          onClose={() => {
            setShowConfirmationDialog(false);
            if (confirmedInvoice?.orderId) {
              navigate(`/orders/${confirmedInvoice.orderId}`);
            } else {
              navigate("/orders");
            }
          }}
          onNewOrder={() => {
            setShowConfirmationDialog(false);
            clearOrderDraft();
            window.location.href = "/orders/new";
          }}
        />

      </main>
    );
}
