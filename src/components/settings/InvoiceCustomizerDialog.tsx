import { useState, useMemo, useEffect } from "react";
import {
  Printer,
  Receipt,
  FileText,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Palette,
  X,
  Eye,
  Download,
  Building2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  type InvoiceTemplateSettings,
  type PrintPaperFormat,
  DEFAULT_INVOICE_SETTINGS,
  getInvoiceSettings,
  saveInvoiceSettings,
  getSampleInvoiceData,
  generateInvoiceHtml,
  printInvoice,
  downloadInvoicePdf,
} from "@/services/invoiceService";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (settings: InvoiceTemplateSettings) => void;
}

const THEME_COLORS = [
  { label: "Classic Navy", value: "#0f172a", bgClass: "bg-slate-900" },
  { label: "Emerald Green", value: "#047857", bgClass: "bg-emerald-700" },
  { label: "Royal Indigo", value: "#4338ca", bgClass: "bg-indigo-700" },
  { label: "Ocean Blue", value: "#0284c7", bgClass: "bg-sky-600" },
  { label: "Ruby Crimson", value: "#b91c1c", bgClass: "bg-red-700" },
  { label: "Warm Amber", value: "#d97706", bgClass: "bg-amber-600" },
];

export default function InvoiceCustomizerDialog({
  open,
  onClose,
  onSaved,
}: Props) {
  const [settings, setSettings] = useState<InvoiceTemplateSettings>(() => getInvoiceSettings());
  const [previewFormat, setPreviewFormat] = useState<PrintPaperFormat>(() => settings.defaultPaperFormat || "A4");
  const [activeTab, setActiveTab] = useState<"GENERAL" | "TOGGLES" | "TERMS">("GENERAL");

  useEffect(() => {
    if (open) {
      const current = getInvoiceSettings();
      setSettings(current);
      setPreviewFormat(current.defaultPaperFormat || "A4");
    }
  }, [open]);

  const sampleData = useMemo(() => getSampleInvoiceData(), []);

  // Compute live preview HTML
  const previewHtml = useMemo(() => {
    return generateInvoiceHtml(sampleData, settings, previewFormat);
  }, [sampleData, settings, previewFormat]);

  if (!open) return null;

  const handleSave = () => {
    saveInvoiceSettings(settings);
    toast.success("Invoice & billing format saved successfully!");
    onSaved?.(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_INVOICE_SETTINGS);
    setPreviewFormat(DEFAULT_INVOICE_SETTINGS.defaultPaperFormat);
    toast.success("Reset to factory defaults");
  };

  const handleTestPrint = async () => {
    await printInvoice(sampleData, { format: previewFormat, settings });
  };

  const handleTestDownload = async () => {
    await downloadInvoicePdf(sampleData, { format: previewFormat, settings });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[900px] flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>Invoice & Billing Customizer (बिल डिज़ाइनर)</span>
                <Badge variant="outline" className="text-xs font-semibold">
                  Live Studio
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure A4 and 3-inch POS Thermal Machine settings, branding, content toggles, and live preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* BODY SPLIT VIEW */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT COLUMN: SETTINGS FORM (7 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col border-r border-border overflow-y-auto p-5 space-y-5">
            {/* PRINTER MACHINE FORMAT SWITCHER */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Default Printing Machine & Paper Size
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* A4 CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSettings((s) => ({ ...s, defaultPaperFormat: "A4" }));
                    setPreviewFormat("A4");
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    settings.defaultPaperFormat === "A4"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {settings.defaultPaperFormat === "A4" && (
                      <Badge className="text-[10px] bg-primary text-primary-foreground font-bold">Default</Badge>
                    )}
                  </div>
                  <p className="font-bold text-sm text-foreground">A4 Full Sheet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Standard laser/inkjet printer (210×297mm)
                  </p>
                </button>

                {/* THERMAL 3-INCH CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSettings((s) => ({ ...s, defaultPaperFormat: "THERMAL_3INCH" }));
                    setPreviewFormat("THERMAL_3INCH");
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    settings.defaultPaperFormat === "THERMAL_3INCH"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {settings.defaultPaperFormat === "THERMAL_3INCH" && (
                      <Badge className="text-[10px] bg-primary text-primary-foreground font-bold">Default</Badge>
                    )}
                  </div>
                  <p className="font-bold text-sm text-foreground">3-Inch POS Roll</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Thermal billing machine roll (80mm width)
                  </p>
                </button>
              </div>
            </div>

            {/* TABS SWITCHER */}
            <div className="flex border-b border-border gap-1">
              {[
                { id: "GENERAL", label: "Branding & Shop", icon: Building2 },
                { id: "TOGGLES", label: "Fields & Toggles", icon: Eye },
                { id: "TERMS", label: "Policies & Terms", icon: FileCheck2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT 1: BRANDING & SHOP */}
            {activeTab === "GENERAL" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Shop / Studio Name</Label>
                  <Input
                    value={settings.shopName}
                    onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
                    placeholder="e.g. Sarpanch Fashion Fab"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tagline / Business Header</Label>
                  <Input
                    value={settings.shopTagline}
                    onChange={(e) => setSettings((s) => ({ ...s, shopTagline: e.target.value }))}
                    placeholder="e.g. Custom Tailoring, Designer Wear & Alterations"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Phone Number(s)</Label>
                    <Input
                      value={settings.shopPhone}
                      onChange={(e) => setSettings((s) => ({ ...s, shopPhone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">GSTIN / Tax ID (Optional)</Label>
                    <Input
                      value={settings.shopGstin || ""}
                      onChange={(e) => setSettings((s) => ({ ...s, shopGstin: e.target.value }))}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Shop Address</Label>
                  <Input
                    value={settings.shopAddress}
                    onChange={(e) => setSettings((s) => ({ ...s, shopAddress: e.target.value }))}
                    placeholder="e.g. Main Market, Near Clock Tower"
                  />
                </div>

                {/* THEME COLOR SELECTOR FOR A4 */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    A4 Header Accent Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {THEME_COLORS.map((col) => {
                      const selected = settings.themeColor === col.value;
                      return (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, themeColor: col.value }))}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            selected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                              : "border-border bg-card hover:bg-muted/40"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${col.bgClass}`} />
                          <span>{col.label}</span>
                          {selected && <Check className="w-3 h-3 text-primary ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* THERMAL FONT SIZE */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Thermal Machine Font Size (3-Inch Roll)
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["compact", "normal", "large"] as const).map((size) => {
                      const active = settings.thermalFontSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, thermalFontSize: size }))}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-muted/30 border-border hover:bg-accent text-muted-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: FIELD VISIBILITY TOGGLES */}
            {activeTab === "TOGGLES" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Turn specific sections on or off to make the bill as detailed or concise as you wish:
                </p>

                {[
                  {
                    key: "showCustomerPhone",
                    label: "Customer Phone Number",
                    desc: "Display phone on bill header",
                  },
                  {
                    key: "showCustomerCode",
                    label: "Customer ID / Code",
                    desc: "Show customer identification code",
                  },
                  {
                    key: "showSampleBookPage",
                    label: "Sample Book Page Number",
                    desc: "Show reference page number on invoice",
                  },
                  {
                    key: "showGarmentDueDate",
                    label: "Delivery Due Dates per Garment",
                    desc: "Display promise delivery date for each item",
                  },
                  {
                    key: "showTailorWorkerName",
                    label: "Tailor Maker Name ('Made by')",
                    desc: "Display tailor master who crafted the garment",
                  },
                  {
                    key: "showAddOns",
                    label: "Custom Design Add-ons Breakdown",
                    desc: "Show custom buttons, collars, embroidery extras",
                  },
                  {
                    key: "showPaymentHistory",
                    label: "Payment History & Advance Records",
                    desc: "Show previous advances, cash/UPI payment history",
                  },
                  {
                    key: "showBalanceBadge",
                    label: "Prominent Balance Due Callout",
                    desc: "Highlight pending balance vs settled status",
                  },
                  {
                    key: "showQrCode",
                    label: "UPI Payment QR Code",
                    desc: "Print QR code for customer to scan and pay via phone",
                  },
                  {
                    key: "showTerms",
                    label: "Terms & Conditions Section",
                    desc: "Print shop policies at the bottom of the bill",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={(settings as any)[item.key]}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 3: TERMS & POLICIES */}
            {activeTab === "TERMS" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Terms & Conditions Policy</Label>
                  <textarea
                    rows={6}
                    value={settings.termsAndConditions}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, termsAndConditions: e.target.value }))
                    }
                    placeholder="Enter store policies..."
                    className="w-full text-xs rounded-xl border border-border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Each new line will be printed as a numbered or bulleted rule on the bill.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Footer Greeting / Thank You Note</Label>
                  <Input
                    value={settings.footerMessage}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, footerMessage: e.target.value }))
                    }
                    placeholder="e.g. Thank you for choosing Sarpanch Fashion Fab! Visit again."
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW (6 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col bg-muted/40 h-full overflow-hidden">
            {/* PREVIEW TOOLBAR */}
            <div className="px-4 py-2.5 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground">Preview Format:</span>
                <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewFormat("A4")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewFormat === "A4"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>A4 Sheet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFormat("THERMAL_3INCH")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      previewFormat === "THERMAL_3INCH"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>3-Inch Thermal Roll</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestPrint}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Test Print</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestDownload}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Test PDF</span>
                </Button>
              </div>
            </div>

            {/* PREVIEW STAGE CONTAINER */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex items-start justify-center">
              <div
                className={`transition-all bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300 ${
                  previewFormat === "THERMAL_3INCH"
                    ? "w-[320px] max-w-[320px]"
                    : "w-full max-w-[620px]"
                }`}
              >
                {/* PREVIEW IFRAME */}
                <iframe
                  title="Live Invoice Preview"
                  srcDoc={previewHtml}
                  className={`w-full border-none pointer-events-auto ${
                    previewFormat === "THERMAL_3INCH" ? "h-[720px]" : "h-[800px]"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3.5 border-t border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Changes will apply to all orders printed or downloaded across the system.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
