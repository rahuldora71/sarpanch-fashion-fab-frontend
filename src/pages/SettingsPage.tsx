import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCog,
  Factory,
  Globe,
  Settings,
  Sliders,
  Zap,
  ArrowLeft,
  Printer,
  Receipt,
  FileText,
  Palette,
  CheckCircle2,
  ChevronRight,
  Type,
} from "lucide-react";
import TypographySettingsSection from "@/components/settings/TypographySettingsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import DateManagementPanel from "@/components/production/DateManagementPanel";
import InvoiceCustomizerDialog from "@/components/settings/InvoiceCustomizerDialog";
import {
  getInvoiceSettings,
  saveInvoiceSettings,
  type InvoiceTemplateSettings,
  type PrintPaperFormat,
} from "@/services/invoiceService";
import { setCapacityOverride } from "@/services/productionCalendarService";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";
import toast from "react-hot-toast";

import { Camera } from "lucide-react";
import {
  getCustomerImageSettings,
  saveCustomerImageSettings,
  type CustomerImageSettings,
} from "@/services/customerSettingsService";

type SettingsTabId = "printing" | "calendar" | "capacity" | "customer_photos" | "typography" | "language";

interface TabItem {
  id: SettingsTabId;
  label: string;
  subLabel: string;
  icon: React.ElementType;
  badge?: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage, changeLanguage } = useWorkerTranslation();

  // Tab State
  const initialTab = (searchParams.get("tab") as SettingsTabId) || "printing";
  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    ["printing", "calendar", "capacity", "customer_photos", "typography", "language"].includes(initialTab)
      ? initialTab
      : "printing"
  );

  const handleSelectTab = (tab: SettingsTabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Customer Image & Camera Settings State
  const [imgSettings, setImgSettings] = useState<CustomerImageSettings>(() =>
    getCustomerImageSettings()
  );
  const [savingImgSettings, setSavingImgSettings] = useState(false);

  const handleSaveImageSettings = () => {
    setSavingImgSettings(true);
    try {
      saveCustomerImageSettings(imgSettings);
      toast.success("Customer photo & camera settings saved successfully!");
    } catch {
      toast.error("Failed to save camera settings.");
    } finally {
      setSavingImgSettings(false);
    }
  };

  // Capacity override form (e.g. Power cut / custom daily max capacity)
  const [capForm, setCapForm] = useState({
    date: "",
    stage: "STITCHING",
    maxCapacity: 15,
    capacityReduced: false,
    reductionReason: "",
  });
  const [savingCap, setSavingCap] = useState(false);

  // Invoice / Bill Template Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceTemplateSettings>(() => getInvoiceSettings());
  const [showInvoiceCustomizer, setShowInvoiceCustomizer] = useState(false);

  const handleQuickFormatChange = (fmt: PrintPaperFormat) => {
    const updated = { ...invoiceSettings, defaultPaperFormat: fmt };
    setInvoiceSettings(updated);
    saveInvoiceSettings(updated);
    toast.success(
      `Default printing machine set to: ${
        fmt === "A4" ? "A4 Paper (Full Sheet)" : "3-Inch Billing Machine (Thermal Roll)"
      }`
    );
  };

  const handleSaveCapacity = async () => {
    if (!capForm.date) {
      toast.error("Please select a date for capacity configuration");
      return;
    }
    setSavingCap(true);
    try {
      await setCapacityOverride({
        date: capForm.date,
        stage: capForm.stage,
        maxCapacity: Number(capForm.maxCapacity) || 15,
        capacityReduced: capForm.capacityReduced,
        reductionReason: capForm.reductionReason || undefined,
      });
      toast.success("Daily production capacity updated");
      setCapForm({
        date: "",
        stage: "STITCHING",
        maxCapacity: 15,
        capacityReduced: false,
        reductionReason: "",
      });
    } catch {
      toast.error("Failed to save capacity configuration");
    } finally {
      setSavingCap(false);
    }
  };

  const tabs: TabItem[] = [
    {
      id: "printing",
      label: "Printing & Invoices",
      subLabel: "A4 / 3\" POS & Bill Designer",
      icon: Printer,
      badge: invoiceSettings.defaultPaperFormat === "A4" ? "A4" : "3\" POS",
    },
    {
      id: "calendar",
      label: "Delivery Dates & Holidays",
      subLabel: "Shop closures & blocked dates",
      icon: CalendarCog,
    },
    {
      id: "capacity",
      label: "Workshop Capacity",
      subLabel: "Daily limits & power-cuts",
      icon: Zap,
      badge: capForm.capacityReduced ? "⚡ Alert" : undefined,
    },
    {
      id: "customer_photos",
      label: "Customer Photos & Camera",
      subLabel: "Photo limits, aspect ratios & webcam",
      icon: Camera,
      badge: `${imgSettings.maxImagesPerCustomer} max`,
    },
    {
      id: "typography",
      label: "Font & Text Appearance",
      subLabel: "Global typeface, font scale & density",
      icon: Type,
    },
    {
      id: "language",
      label: "Language Preferences",
      subLabel: "कारीगर की भाषा चयन",
      icon: Globe,
      badge: currentLanguage.toUpperCase(),
    },
  ];

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* HEADER */}
      <div className="border-b border-border bg-card/70 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Workshop Settings (दुकान सेटिंग्स)
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage your billing printers, delivery calendar, workshop capacity, and language
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/production")}
            className="w-fit gap-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <Factory className="h-4 w-4 text-primary" />
            <span>Back to Production Calendar</span>
          </Button>
        </div>
      </div>

      {/* BODY WITH SIDE MENU TABS */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* SIDEBAR NAVIGATION (Desktop) & SCROLLABLE PILLS (Mobile) */}
          <aside className="w-full md:w-72 lg:w-80 shrink-0 space-y-3">
            {/* Mobile horizontal scrolling pill bar */}
            <div className="flex md:hidden gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={[
                      "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer border shrink-0",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={[
                          "text-[10px] px-1.5 py-0.2 rounded-md font-bold",
                          active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop vertical sidebar card */}
            <div className="hidden md:block rounded-2xl border border-border bg-card p-2 shadow-xs">
              <div className="px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Settings Menu
                </p>
              </div>

              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectTab(tab.id)}
                      className={[
                        "group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all cursor-pointer",
                        active
                          ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/25"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={[
                              "text-sm leading-tight truncate",
                              active ? "text-foreground font-bold" : "text-foreground/90 font-medium",
                            ].join(" ")}
                          >
                            {tab.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {tab.subLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {tab.badge && (
                          <span
                            className={[
                              "text-[10px] px-1.5 py-0.5 rounded-md font-semibold",
                              active
                                ? "bg-primary/20 text-primary font-bold"
                                : "bg-muted text-muted-foreground",
                            ].join(" ")}
                          >
                            {tab.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={[
                            "h-4 w-4 transition-transform",
                            active ? "text-primary translate-x-0.5" : "text-muted-foreground/40",
                          ].join(" ")}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL (Active Tab Content) */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* TAB 1: PRINTING & INVOICES */}
              {activeTab === "printing" && (
                <motion.div
                  key="printing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Printer className="h-5 w-5 text-primary" />
                        <span>Printing Machine & Bill Designer</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Configure your receipt printer type and customize your shop bill appearance and policies
                      </p>
                    </div>

                    <Badge variant="outline" className="text-xs font-semibold shrink-0">
                      Active: {invoiceSettings.defaultPaperFormat === "A4" ? "📄 A4 Full Sheet" : "🧾 3-Inch POS Roll"}
                    </Badge>
                  </div>

                  <Card className="border-border/80 bg-card shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-foreground">
                        Default Paper Format & Billing Machine
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Select the paper format matching your physical printer. You can also customize your shop header, UPI QR code, and terms with live preview.
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* MACHINE SELECTOR CARDS */}
                      <div className="grid gap-3.5 sm:grid-cols-2">
                        {/* OPTION 1: A4 PAPER */}
                        <button
                          type="button"
                          onClick={() => handleQuickFormatChange("A4")}
                          className={[
                            "flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
                            invoiceSettings.defaultPaperFormat === "A4"
                              ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                              : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between w-full mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">
                                  A4 Size Paper (Full Sheet)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  210 × 297 mm • Standard Laser/Inkjet
                                </p>
                              </div>
                            </div>
                            {invoiceSettings.defaultPaperFormat === "A4" && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Standard full-sheet document printing. Features elegant shop header banner, garment itemization table, tailor credits, payment history, and shop return terms.
                          </p>
                        </button>

                        {/* OPTION 2: 3-INCH THERMAL POS ROLL */}
                        <button
                          type="button"
                          onClick={() => handleQuickFormatChange("THERMAL_3INCH")}
                          className={[
                            "flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
                            invoiceSettings.defaultPaperFormat === "THERMAL_3INCH"
                              ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                              : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between w-full mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                <Receipt className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">
                                  3-Inch Billing Machine (80mm)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  80 mm Roll • Thermal POS Printer
                                </p>
                              </div>
                            </div>
                            {invoiceSettings.defaultPaperFormat === "THERMAL_3INCH" && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            POS thermal roll printer (TVS, NGX, Posiflex, Epson). Ultra-fast continuous roll receipt with clean dashed lines, monospace text, UPI QR code, and auto-tear support.
                          </p>
                        </button>
                      </div>

                      {/* CURRENT STYLING & CUSTOMIZER LAUNCHER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-muted/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              Header: {invoiceSettings.shopName}
                            </span>
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-border shadow-2xs"
                              style={{ backgroundColor: invoiceSettings.themeColor || "#0f172a" }}
                              title="Theme Accent Color"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Phone: {invoiceSettings.shopPhone || "Not set"} • GSTIN: {invoiceSettings.shopGstin || "N/A"} • UPI QR: {invoiceSettings.showQrCode ? "Enabled" : "Disabled"}
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() => setShowInvoiceCustomizer(true)}
                          className="gap-2 rounded-xl cursor-pointer font-semibold shadow-xs"
                        >
                          <Palette className="h-4 w-4" />
                          <span>Customize Bill / Invoice Look</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* TAB 2: DELIVERY DATES & HOLIDAYS */}
              {activeTab === "calendar" && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarCog className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Date Management & Shop Holidays
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Block specific delivery dates and manage shop closures and festival holidays
                      </p>
                    </div>
                  </div>

                  <DateManagementPanel />
                </motion.div>
              )}

              {/* TAB 3: WORKSHOP CAPACITY */}
              {activeTab === "capacity" && (
                <motion.div
                  key="capacity"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <Card className="border-border/80 bg-card shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <Zap className="h-4 w-4" />
                        </div>
                        Daily Workshop Capacity & Power-Cut Override
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Adjust daily garment capacity for specific dates (e.g. power cuts, machine maintenance, or peak festival rush).
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Target Date</Label>
                          <DatePicker
                            value={capForm.date}
                            onChange={(d) => setCapForm((f) => ({ ...f, date: d }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label>Daily Garment Capacity</Label>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            value={capForm.maxCapacity}
                            onChange={(e) =>
                              setCapForm((f) => ({
                                ...f,
                                maxCapacity: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Mark as Reduced Capacity / Power Cut (⚡)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Displays a warning indicator on the Production Calendar
                          </p>
                        </div>
                        <Switch
                          checked={capForm.capacityReduced}
                          onCheckedChange={(v) =>
                            setCapForm((f) => ({ ...f, capacityReduced: v }))
                          }
                        />
                      </div>

                      {capForm.capacityReduced && (
                        <div className="space-y-1.5">
                          <Label>Reason / Workshop Note</Label>
                          <Input
                            placeholder="e.g., Power cut 10 AM - 4 PM, 2 tailors on leave..."
                            value={capForm.reductionReason}
                            onChange={(e) =>
                              setCapForm((f) => ({
                                ...f,
                                reductionReason: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}

                      <Button
                        onClick={handleSaveCapacity}
                        disabled={savingCap}
                        className="w-full rounded-xl cursor-pointer"
                      >
                        <Sliders className="mr-2 h-4 w-4" />
                        {savingCap ? "Saving..." : "Apply Capacity Rule"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* TAB 4: WORKSHOP LANGUAGE */}
              {activeTab === "language" && (
                <motion.div
                  key="language"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <Card className="border-border/80 bg-card shadow-xs" data-no-translate>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Globe className="h-4 w-4" />
                        </div>
                        Workshop Language (कारीगर की भाषा)
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Choose the default language for measurement labels, statuses, customer names, and addresses.
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const active = currentLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => changeLanguage(lang.code)}
                            className={[
                              "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                              active
                                ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                                : "border-border/70 bg-muted/25 text-foreground hover:border-primary/40 hover:bg-muted/50",
                            ].join(" ")}
                          >
                            <div>
                              <p className="text-sm font-bold">{lang.nativeName}</p>
                              <p className="text-xs text-muted-foreground">{lang.label}</p>
                            </div>
                            <span
                              className={[
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {active ? "Active" : "Select"}
                            </span>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* TAB 5: CUSTOMER PHOTOS & CAMERA */}
              {activeTab === "customer_photos" && (
                <motion.div
                  key="customer_photos"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  {/* Photo Limits Card */}
                  <Card className="border-border/80 bg-card shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                          <Camera className="h-4 w-4" />
                        </div>
                        Customer Photos & Posture Configuration (फोटो व कैमरा सेटिंग्स)
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Configure allowed posture/fitting photos per customer and default camera stream parameters.
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Limit configuration */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            Max Fitting/Posture Photos per Customer (अधिकतम फोटो संख्या)
                          </Label>
                          <Badge variant="outline" className="font-mono text-sm px-2.5 py-0.5">
                            {imgSettings.maxImagesPerCustomer} Photos
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Controls the maximum number of posture reference photos (Front, Side, Back, Full Body) that can be saved per customer. Profile avatar is stored separately.
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={imgSettings.maxImagesPerCustomer}
                            onChange={(e) => {
                              const val = Math.min(Math.max(Number(e.target.value) || 1, 1), 20);
                              setImgSettings((prev) => ({ ...prev, maxImagesPerCustomer: val }));
                            }}
                            className="w-32"
                          />
                          <span className="text-xs text-muted-foreground">
                            (Allowed range: 1 to 20 photos per customer)
                          </span>
                        </div>
                      </div>

                      {/* Posture Photo Aspect Ratio */}
                      <div className="space-y-2 border-t pt-4">
                        <Label className="text-sm font-semibold">
                          Default Fitting Photo Aspect Ratio (तस्वीर का आकार)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Select the framing ratio used by the camera for body fitting and posture photos.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {[
                            {
                              ratio: "3:4" as const,
                              title: "3:4 Portrait (अनुशंसित)",
                              desc: "Ideal for full body, standing customer posture & vertical silhouette",
                            },
                            {
                              ratio: "16:9" as const,
                              title: "16:9 Wide",
                              desc: "Widescreen landscape camera capture",
                            },
                            {
                              ratio: "1:1" as const,
                              title: "1:1 Square",
                              desc: "Standard square framing (same as profile avatar)",
                            },
                          ].map((item) => {
                            const isSelected = imgSettings.preferredPostureRatio === item.ratio;
                            return (
                              <button
                                key={item.ratio}
                                type="button"
                                onClick={() =>
                                  setImgSettings((prev) => ({
                                    ...prev,
                                    preferredPostureRatio: item.ratio,
                                  }))
                                }
                                className={`rounded-xl border p-3.5 text-left transition ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                                    : "border-border/70 hover:border-orange-500/40 hover:bg-muted/40"
                                }`}
                              >
                                <p className="text-sm font-bold text-foreground">{item.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Camera lens & features */}
                      <div className="space-y-4 border-t pt-4">
                        <Label className="text-sm font-semibold">
                          Webcam & Browser Camera Preferences
                        </Label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Default Lens Facing */}
                          <div className="rounded-xl border p-3 space-y-2">
                            <Label className="text-xs font-semibold">Default Camera Lens</Label>
                            <p className="text-[11px] text-muted-foreground">
                              On mobile / tablets, choose which camera to activate first.
                            </p>
                            <div className="flex gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={imgSettings.defaultCameraFacingMode === "environment" ? "default" : "outline"}
                                onClick={() =>
                                  setImgSettings((prev) => ({
                                    ...prev,
                                    defaultCameraFacingMode: "environment",
                                  }))
                                }
                                className="text-xs gap-1.5 flex-1"
                              >
                                Back Camera (पीछे का लेंस)
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={imgSettings.defaultCameraFacingMode === "user" ? "default" : "outline"}
                                onClick={() =>
                                  setImgSettings((prev) => ({
                                    ...prev,
                                    defaultCameraFacingMode: "user",
                                  }))
                                }
                                className="text-xs gap-1.5 flex-1"
                              >
                                Front Camera (सामने का लेंस)
                              </Button>
                            </div>
                          </div>

                          {/* Countdown Timer */}
                          <div className="rounded-xl border p-3 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-semibold">3-Second Shutter Countdown</Label>
                              <p className="text-[11px] text-muted-foreground">
                                Gives customer 3 seconds to pose before snapshot is taken
                              </p>
                            </div>
                            <Switch
                              checked={imgSettings.enableCountdown}
                              onCheckedChange={(checked) =>
                                setImgSettings((prev) => ({
                                  ...prev,
                                  enableCountdown: checked,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Action */}
                      <div className="pt-2">
                        <Button
                          onClick={handleSaveImageSettings}
                          disabled={savingImgSettings}
                          className="bg-orange-600 text-white font-semibold hover:bg-orange-700 cursor-pointer"
                        >
                          {savingImgSettings ? "Saving Settings..." : "Save Photo & Camera Settings"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* TAB: FONT & TEXT APPEARANCE */}
              {activeTab === "typography" && (
                <motion.div
                  key="typography"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <TypographySettingsSection />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* INVOICE & BILL CUSTOMIZER DIALOG WINDOW */}
      <InvoiceCustomizerDialog
        open={showInvoiceCustomizer}
        onClose={() => setShowInvoiceCustomizer(false)}
        onSaved={(updated) => setInvoiceSettings(updated)}
      />
    </div>
  );
}
