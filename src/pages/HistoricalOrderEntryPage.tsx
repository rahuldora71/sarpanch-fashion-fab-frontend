import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  ZoomIn,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CustomerAvatar from "@/components/customers/CustomerAvatar";
import { uploadImage } from "@/services/imageService";
import {
  getNextOrderNumber,
  findCustomersByPhone,
  createHistoricalOrder,
  getRecentHistoricalOrders,
} from "@/services/historicalOrderService";
import type {
  HistoricalCustomerSummary,
  HistoricalOrderRequest,
  HistoricalOrderResponse,
} from "@/types/historicalOrder";
import type { PaymentMethod } from "@/types/order";

const STORAGE_STICKY_DATE_KEY = "sff_historical_order_date";

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function adjustDateDays(dateStr: string, days: number): string {
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return getTodayString();
  }
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

export default function HistoricalOrderEntryPage() {
  // ----------------------------------------------------
  // Sticky Date & Order Number State
  // ----------------------------------------------------
  const [orderDate, setOrderDate] = useState<string>(() => {
    return localStorage.getItem(STORAGE_STICKY_DATE_KEY) || getTodayString();
  });

  const [orderNumber, setOrderNumber] = useState<number | string>(1);
  const [isLoadingNextNumber, setIsLoadingNextNumber] = useState(false);

  // ----------------------------------------------------
  // Customer Lookup & Selection
  // ----------------------------------------------------
  const [phoneSearch, setPhoneSearch] = useState("");
  const [matchedCustomers, setMatchedCustomers] = useState<HistoricalCustomerSummary[]>([]);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected customer (or new customer draft)
  const [selectedCustomer, setSelectedCustomer] = useState<HistoricalCustomerSummary | null>(null);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAltPhone, setNewCustomerAltPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  // ----------------------------------------------------
  // Order Slip Financials & Delivery
  // ----------------------------------------------------
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [advancePayment, setAdvancePayment] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isDelivered, setIsDelivered] = useState<boolean>(true);
  const [orderNotes, setOrderNotes] = useState<string>("");

  // ----------------------------------------------------
  // Order Slip Image
  // ----------------------------------------------------
  const [billImageUrl, setBillImageUrl] = useState<string>("");
  const [billImagePublicId, setBillImagePublicId] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // File input refs for Direct Camera and Gallery Upload
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // Session History & Submission Status
  // ----------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionOrders, setSessionOrders] = useState<HistoricalOrderResponse[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Save sticky date to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem(STORAGE_STICKY_DATE_KEY, orderDate);
  }, [orderDate]);

  // Fetch initial next order number and recent orders on mount
  useEffect(() => {
    async function init() {
      try {
        setIsLoadingNextNumber(true);
        const nextNum = await getNextOrderNumber();
        setOrderNumber(nextNum);
      } catch (err) {
        console.error("Failed to fetch next order number", err);
      } finally {
        setIsLoadingNextNumber(false);
      }

      try {
        setIsLoadingSession(true);
        const recent = await getRecentHistoricalOrders(20);
        setSessionOrders(recent);
      } catch (err) {
        console.error("Failed to load recent historical orders", err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    init();
  }, []);

  // Debounced search when phone number changes
  useEffect(() => {
    const trimmed = phoneSearch.trim();
    if (trimmed.length < 3) {
      setMatchedCustomers([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingPhone(true);
        const results = await findCustomersByPhone(trimmed);
        setMatchedCustomers(results);
        setHasSearched(true);
        // If no customer exists, prefill new customer phone and show new customer fields
        if (results.length === 0 && !selectedCustomer) {
          setIsCreatingNewCustomer(true);
          setNewCustomerPhone(trimmed);
        }
      } catch (err) {
        console.error("Error searching customers by phone:", err);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phoneSearch, selectedCustomer]);

  // Auto-calculated Balance Due
  const numTotal = parseFloat(totalAmount) || 0;
  const numAdvance = parseFloat(advancePayment) || 0;
  const balanceDue = useMemo(() => {
    const bal = numTotal - numAdvance;
    return bal < 0 ? 0 : bal;
  }, [numTotal, numAdvance]);

  // Helper to step date
  const handleDateStep = (days: number) => {
    setOrderDate((prev) => adjustDateDays(prev, days));
  };

  // Helper to handle image selection and raw upload (no compression)
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadImage(file);
      setBillImageUrl(res.imageUrl || "");
      setBillImagePublicId(res.publicId || "");
      toast.success("Bill photo uploaded in full resolution!");
    } catch (err: any) {
      console.error("Image upload failed", err);
      toast.error(err?.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleSelectCustomer = (customer: HistoricalCustomerSummary) => {
    setSelectedCustomer(customer);
    setIsCreatingNewCustomer(false);
    toast.success(`Selected customer: ${customer.name}`);
    // Focus to amount input for quick typing
    setTimeout(() => amountInputRef.current?.focus(), 150);
  };

  const handleStartNewCustomerWithPhone = (phoneNum: string) => {
    setSelectedCustomer(null);
    setIsCreatingNewCustomer(true);
    setNewCustomerPhone(phoneNum);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const handleResetCustomer = () => {
    setSelectedCustomer(null);
    setIsCreatingNewCustomer(false);
    setNewCustomerName("");
    setNewCustomerPhone(phoneSearch);
    setNewCustomerAltPhone("");
    setNewCustomerAddress("");
    setPhoneSearch("");
    setMatchedCustomers([]);
    setHasSearched(false);
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  // Shortcut Advance Payments
  const handlePresetAdvance = (type: "zero" | "half" | "full") => {
    if (type === "zero") {
      setAdvancePayment("0");
    } else if (type === "half") {
      setAdvancePayment(String(Math.round(numTotal / 2)));
    } else if (type === "full") {
      setAdvancePayment(String(numTotal));
    }
  };

  // Handle Form Submission
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCustomer && !isCreatingNewCustomer) {
      toast.error("Please enter a phone number and select or create a customer.");
      phoneInputRef.current?.focus();
      return;
    }

    if (isCreatingNewCustomer && (!newCustomerName.trim() || !newCustomerPhone.trim())) {
      toast.error("Customer name and phone number are required.");
      nameInputRef.current?.focus();
      return;
    }

    if (!numTotal || numTotal <= 0) {
      toast.error("Please enter a valid Total Order Amount.");
      amountInputRef.current?.focus();
      return;
    }

    const parsedOrderNum = Number(orderNumber);
    if (!parsedOrderNum || parsedOrderNum <= 0) {
      toast.error("Please enter a valid Order Number.");
      return;
    }

    const customerPhone = selectedCustomer ? selectedCustomer.phone : newCustomerPhone.trim();
    const customerName = selectedCustomer ? selectedCustomer.name : newCustomerName.trim();
    const customerId = selectedCustomer ? selectedCustomer.id : undefined;
    const alternatePhone = selectedCustomer
      ? (selectedCustomer.alternatePhone || undefined)
      : (newCustomerAltPhone.trim() || undefined);
    const address = selectedCustomer
      ? (selectedCustomer.address || undefined)
      : (newCustomerAddress.trim() || undefined);

    const payload: HistoricalOrderRequest = {
      orderNumber: parsedOrderNum,
      orderDate,
      totalAmount: numTotal,
      advancePayment: numAdvance,
      paymentMethod,
      isDelivered,
      billImageUrl: billImageUrl || undefined,
      billImagePublicId: billImagePublicId || undefined,
      notes: orderNotes.trim() || undefined,
      customerId,
      name: customerName,
      phone: customerPhone,
      alternatePhone,
      address,
    };

    try {
      setIsSubmitting(true);
      const res = await createHistoricalOrder(payload);
      toast.success(`✓ Order #${res.orderNumber} successfully saved!`, { duration: 3500 });

      // Add to session orders list
      setSessionOrders((prev) => [res, ...prev]);

      // Auto-increment Order Number for the next slip
      setOrderNumber(res.nextSuggestedOrderNumber);

      // Keep STICKY DATE untouched!

      // Reset slip financials & images
      setTotalAmount("");
      setAdvancePayment("0");
      setOrderNotes("");
      setBillImageUrl("");
      setBillImagePublicId("");

      // Reset customer fields for the next slip
      setSelectedCustomer(null);
      setIsCreatingNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerAltPhone("");
      setNewCustomerAddress("");
      setPhoneSearch("");
      setMatchedCustomers([]);
      setHasSearched(false);

      // Focus back to Phone Input for high speed entry
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      console.error("Order creation failed", err);
      toast.error(err?.response?.data?.message || "Failed to save order. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Press Ctrl+Enter or Cmd+Enter anywhere to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmitOrder();
    }
  };

  // Session summary calculations
  const sessionSummary = useMemo(() => {
    let count = sessionOrders.length;
    let totalAmt = 0;
    let totalPaid = 0;
    let totalBal = 0;
    for (const o of sessionOrders) {
      totalAmt += o.totalAmount || 0;
      totalPaid += o.advancePayment || 0;
      totalBal += o.balanceDue || 0;
    }
    return { count, totalAmt, totalPaid, totalBal };
  }, [sessionOrders]);

  return (
    <div
      className="min-h-screen bg-background pb-20 pt-4 px-3 sm:px-6 max-w-6xl mx-auto"
      onKeyDown={handleKeyDown}
    >
      {/* HEADER BAR */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Mass Order Upload (पिछला ऑर्डर इंद्राज)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Digitize ~8,500 handwritten paper slips with sticky date, auto-incrementing order number & camera capture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/50 border-border">
            Session: <span className="font-semibold ml-1 text-primary">{sessionSummary.count}</span> uploaded
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                setIsLoadingNextNumber(true);
                const n = await getNextOrderNumber();
                setOrderNumber(n);
                toast.success(`Order # synced: ${n}`);
              } catch {
                toast.error("Failed to sync order number");
              } finally {
                setIsLoadingNextNumber(false);
              }
            }}
            disabled={isLoadingNextNumber}
            className="text-xs h-8 rounded-xl"
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isLoadingNextNumber ? "animate-spin" : ""}`} />
            Sync #
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* LEFT COLUMN: THE FAST ENTRY FORM (MOBILE / TABLET FIRST) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* 1. ORDER HEADER: ORDER # AND STICKY DATE */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    1
                  </span>
                  Order Slip Identity & Sticky Date
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">Auto-increments every order</span>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ORDER NUMBER */}
                  <div>
                    <Label htmlFor="orderNumber" className="text-xs font-semibold flex items-center justify-between">
                      <span>Order Slip # (ऑर्डर नंबर) *</span>
                      <span className="text-[10px] text-muted-foreground">Unique</span>
                    </Label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-2.5"
                        onClick={() => setOrderNumber((prev) => Math.max(1, Number(prev) - 1))}
                      >
                        -1
                      </Button>
                      <Input
                        id="orderNumber"
                        type="number"
                        min="1"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className="h-10 text-center font-mono font-bold text-lg"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-2.5"
                        onClick={() => setOrderNumber((prev) => Number(prev) + 1)}
                      >
                        +1
                      </Button>
                    </div>
                  </div>

                  {/* STICKY ORDER DATE */}
                  <div>
                    <Label htmlFor="orderDate" className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        Order Date (तारीख) *
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">Sticky (retains across slips)</span>
                    </Label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-2"
                        title="Previous Day"
                        onClick={() => handleDateStep(-1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="h-10 font-mono text-sm"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-2"
                        title="Next Day"
                        onClick={() => handleDateStep(1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. CUSTOMER LOOKUP & MATCH CARDS */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  Customer Phone & Profile (ग्राहक)
                </CardTitle>
                {selectedCustomer && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCustomer}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Change Customer
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* ACTIVE SELECTED CUSTOMER CARD */}
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <CustomerAvatar
                        name={selectedCustomer.name}
                        image={selectedCustomer.image}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm truncate">
                            {selectedCustomer.name}
                          </span>
                          {selectedCustomer.customerCode && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                              {selectedCustomer.customerCode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          📞 {selectedCustomer.phone}
                          {selectedCustomer.alternatePhone ? ` · Alt: ${selectedCustomer.alternatePhone}` : ""}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span>Orders: <strong>{selectedCustomer.totalOrders}</strong></span>
                          <span>Spent: <strong>{formatCurrency(selectedCustomer.totalSpent)}</strong></span>
                          {selectedCustomer.currentBalance > 0 && (
                            <span className="text-orange-600 font-medium">
                              Due: <strong>{formatCurrency(selectedCustomer.currentBalance)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs shrink-0">
                      <UserCheck className="mr-1 h-3.5 w-3.5" />
                      Selected
                    </Badge>
                  </div>
                ) : isCreatingNewCustomer ? (
                  /* NEW CUSTOMER DRAFT FORM */
                  <div className="rounded-lg border border-dashed border-primary/50 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4" />
                        Create New Customer (नया ग्राहक जोड़ें)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetCustomer}
                        className="h-6 text-[11px] text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="newCustName" className="text-xs font-medium">
                          Customer Name (नाम) *
                        </Label>
                        <Input
                          ref={nameInputRef}
                          id="newCustName"
                          placeholder="e.g. Ramesh Patel"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="h-9 mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="newCustPhone" className="text-xs font-medium">
                          Phone Number (फ़ोन नंबर) *
                        </Label>
                        <Input
                          id="newCustPhone"
                          type="tel"
                          placeholder="10-digit number"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                          className="h-9 mt-1 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="newCustAltPhone" className="text-xs font-medium">
                          Alternate Phone (वैकल्पिक नंबर)
                        </Label>
                        <Input
                          id="newCustAltPhone"
                          type="tel"
                          placeholder="Optional"
                          value={newCustomerAltPhone}
                          onChange={(e) => setNewCustomerAltPhone(e.target.value)}
                          className="h-9 mt-1 font-mono"
                        />
                      </div>

                      <div>
                        <Label htmlFor="newCustAddress" className="text-xs font-medium">
                          Address / Village (पता)
                        </Label>
                        <Input
                          id="newCustAddress"
                          placeholder="e.g. Navrangpura, Ahmedabad"
                          value={newCustomerAddress}
                          onChange={(e) => setNewCustomerAddress(e.target.value)}
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SEARCH PHONE NUMBER INPUT */
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="phoneSearch" className="text-xs font-semibold flex items-center justify-between">
                        <span>Enter Phone Number (ग्राहक का फ़ोन नंबर डालें)</span>
                        <span className="text-[10px] text-muted-foreground">Type 3+ digits to search</span>
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          ref={phoneInputRef}
                          id="phoneSearch"
                          type="tel"
                          placeholder="Type customer phone number..."
                          value={phoneSearch}
                          onChange={(e) => setPhoneSearch(e.target.value)}
                          className="h-11 pl-9 pr-8 text-base font-mono"
                          autoFocus
                        />
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        {isSearchingPhone && (
                          <Loader2 className="absolute right-3 top-3 h-5 w-5 text-primary animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* MATCHED CUSTOMERS LIST */}
                    {matchedCustomers.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            Found {matchedCustomers.length} Customer{matchedCustomers.length > 1 ? "s" : ""} with this number:
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-primary"
                            onClick={() => handleStartNewCustomerWithPhone(phoneSearch)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            + New person with this phone
                          </Button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                          {matchedCustomers.map((cust) => (
                            <div
                              key={cust.id}
                              onClick={() => handleSelectCustomer(cust)}
                              className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <CustomerAvatar
                                  name={cust.name}
                                  image={cust.image}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary">
                                      {cust.name}
                                    </span>
                                    {cust.customerCode && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                                        {cust.customerCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                    📞 {cust.phone}
                                    {cust.alternatePhone ? ` · Alt: ${cust.alternatePhone}` : ""}
                                    {cust.address ? ` · 📍 ${cust.address}` : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0 ml-3">
                                <p className="text-xs text-muted-foreground">
                                  {cust.totalOrders} order{cust.totalOrders === 1 ? "" : "s"}
                                </p>
                                {cust.currentBalance > 0 ? (
                                  <span className="text-xs font-medium text-orange-600">
                                    Due: {formatCurrency(cust.currentBalance)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 font-medium">
                                    No Due
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NO MATCHES NOTIFICATION */}
                    {hasSearched && matchedCustomers.length === 0 && (
                      <div className="rounded-md border border-border bg-muted/40 p-3 text-center">
                        <p className="text-xs text-muted-foreground">
                          No existing customer found with phone <strong>{phoneSearch}</strong>.
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartNewCustomerWithPhone(phoneSearch)}
                          className="mt-2 text-xs"
                        >
                          <UserPlus className="mr-1.5 h-3.5 w-3.5 text-primary" />
                          Create New Customer with this number
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. ORDER FINANCIALS & BILL SLIP DETAILS */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  Order Amount, Advance & Delivery
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Delivered?</span>
                  <Switch
                    checked={isDelivered}
                    onCheckedChange={setIsDelivered}
                  />
                  <span className={`text-xs font-medium ${isDelivered ? "text-emerald-600" : "text-amber-600"}`}>
                    {isDelivered ? "Yes (हैंडओवर)" : "Pending"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* TOTAL ORDER AMOUNT */}
                  <div>
                    <Label htmlFor="totalAmount" className="text-xs font-semibold">
                      Total Order Amount (कुल रकम ₹) *
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                      <Input
                        ref={amountInputRef}
                        id="totalAmount"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="h-11 pl-7 text-lg font-bold text-foreground"
                        required
                      />
                    </div>
                  </div>

                  {/* ADVANCE PAYMENT */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="advancePayment" className="text-xs font-semibold">
                        Advance Paid (जमा रकम ₹)
                      </Label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePresetAdvance("zero")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                        >
                          ₹0 None
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetAdvance("half")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                        >
                          Half
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetAdvance("full")}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        >
                          Full Paid
                        </button>
                      </div>
                    </div>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                      <Input
                        id="advancePayment"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(e.target.value)}
                        className="h-11 pl-7 text-lg font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* REAL-TIME BALANCE DISPLAY & PAYMENT METHOD */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Computed Balance:</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        balanceDue > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatCurrency(balanceDue)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-2 font-medium ${
                        balanceDue > 0
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-600"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {balanceDue > 0 ? "Pending Due" : "Full Paid ✓"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="payMethod" className="text-xs text-muted-foreground whitespace-nowrap">
                      Method:
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                    >
                      <SelectTrigger id="payMethod" className="h-8 w-28 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash (नकद)</SelectItem>
                        <SelectItem value="UPI">UPI / GPay</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. BILL SLIP PHOTO (CAMERA & GALLERY - UNCOMPRESSED) */}
            <Card className="border-border shadow-sm">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    4
                  </span>
                  Order Slip Photo (कागज़ की पर्ची का फ़ोटो)
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">Full resolution preserved</span>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* HIDDEN RAW INPUTS FOR DIRECT CAMERA & GALLERY */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFile}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFile}
                />

                {billImageUrl ? (
                  /* UPLOADED SLIP PREVIEW */
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={billImageUrl}
                        alt="Bill Slip"
                        className="h-16 w-16 rounded-md object-cover border border-border cursor-pointer shadow-sm hover:scale-105 transition-transform"
                        onClick={() => setZoomImageUrl(billImageUrl)}
                      />
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Slip Photo Attached
                        </p>
                        <p className="text-[11px] text-muted-foreground">Ready to link with order #{orderNumber}</p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary font-medium mt-0.5"
                          onClick={() => setZoomImageUrl(billImageUrl)}
                        >
                          <ZoomIn className="mr-1 h-3 w-3" />
                          Preview Full Size
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cameraInputRef.current?.click()}
                        className="text-xs h-8"
                      >
                        Retake
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBillImageUrl("");
                          setBillImagePublicId("");
                        }}
                        className="text-xs h-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* BUTTONS TO TAKE OR UPLOAD PHOTO */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="h-14 flex items-center justify-center gap-2.5 border-dashed border-2 border-primary/40 hover:border-primary hover:bg-primary/5 text-sm font-semibold"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <Camera className="h-5 w-5 text-primary" />
                      )}
                      <span>📸 Take Photo (कैमरा खोलें)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="h-14 flex items-center justify-center gap-2.5 border-dashed border-2 border-border hover:border-foreground/40 hover:bg-muted/40 text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                      <span>📁 Upload File (गैलरी से चुनें)</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GIANT SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="w-full h-14 text-base font-bold shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving Order #{orderNumber}...</span>
                  </>
                ) : (
                  <>
                    <span>💾 Save Order #{orderNumber} & Next Slip</span>
                    <span className="hidden sm:inline-block text-xs bg-primary-foreground/20 px-2 py-0.5 rounded font-mono font-normal">
                      (Press Enter)
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE SESSION SUMMARY & DIGITIZED ORDERS TABLE */}
        <div className="lg:col-span-5 space-y-4">
          {/* SESSION METRICS CARD */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Session Summary (वर्तमान सत्र)</span>
                <span className="font-mono text-foreground font-bold">{sessionSummary.count} Digitized</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/40 p-2.5">
                <span className="text-[10px] text-muted-foreground block">Total Amount</span>
                <span className="font-bold text-sm font-mono text-foreground">
                  {formatCurrency(sessionSummary.totalAmt)}
                </span>
              </div>
              <div className="rounded-md bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] block opacity-80">Collected</span>
                <span className="font-bold text-sm font-mono">
                  {formatCurrency(sessionSummary.totalPaid)}
                </span>
              </div>
              <div className="rounded-md bg-orange-500/10 p-2.5 text-orange-600 dark:text-orange-400">
                <span className="text-[10px] block opacity-80">Pending Due</span>
                <span className="font-bold text-sm font-mono">
                  {formatCurrency(sessionSummary.totalBal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* DIGITIZED ORDERS LIST / TABLE */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Orders in this Session
              </CardTitle>
              <span className="text-[11px] text-muted-foreground font-mono">
                {sessionOrders.length} items
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingSession ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs">Loading orders...</span>
                </div>
              ) : sessionOrders.length === 0 ? (
                <div className="text-center py-12 px-4 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-medium">No orders recorded yet in this session.</p>
                  <p className="text-[11px] mt-0.5">Start entering slips on the left to see them appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
                  {sessionOrders.map((ord) => (
                    <div key={ord.orderId} className="p-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                            {ord.customerName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 font-medium ${
                            ord.isDelivered
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {ord.isDelivered ? "Delivered" : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span className="font-mono">📞 {ord.customerPhone}</span>
                        <span>Date: {ord.orderDate}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <span>Tot: <strong>{formatCurrency(ord.totalAmount)}</strong></span>
                          <span>Paid: <strong className="text-emerald-600">{formatCurrency(ord.advancePayment)}</strong></span>
                          {ord.balanceDue > 0 && (
                            <span className="text-orange-600 font-semibold">
                              Due: {formatCurrency(ord.balanceDue)}
                            </span>
                          )}
                        </div>

                        {ord.billImageUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomImageUrl(ord.billImageUrl!)}
                            className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                          >
                            <ZoomIn className="h-3 w-3" />
                            View Slip
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FULL RESOLUTION BILL SLIP LIGHTBOX MODAL */}
      {zoomImageUrl && (
        <Dialog open={!!zoomImageUrl} onOpenChange={() => setZoomImageUrl(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="flex items-center justify-between text-sm sm:text-base">
                <span>Handwritten Order Slip (मूल पर्ची)</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Full Resolution (No Compression)
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[80vh] overflow-auto bg-black/95 p-2 flex items-center justify-center">
              <img
                src={zoomImageUrl}
                alt="Original Bill Slip"
                className="max-h-[75vh] w-auto max-w-full rounded object-contain shadow-2xl"
              />
            </div>
            <div className="p-3 bg-card border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Crisp handwriting legible for tailoring verification</span>
              <a
                href={zoomImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Open high-res in new tab</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
