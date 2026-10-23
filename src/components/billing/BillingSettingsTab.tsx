import React, { useState, useEffect } from "react";
import type { BillingConfig, TaxRule } from "@/types/billingModule";
import {
  getBillingConfig,
  updateBillingConfig,
  getAllTaxRules,
  saveTaxRule,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  ShieldCheck,
  Plus,
  RefreshCw,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";

export const BillingSettingsTab: React.FC = () => {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Tax Rules
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);

  // Add / Edit Tax Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [taxName, setTaxName] = useState<string>("");
  const [taxType, setTaxType] = useState<string>("GST");
  const [gstRate, setGstRate] = useState<number>(5.0);
  const [hsnSacCode, setHsnSacCode] = useState<string>("9988");
  const [category, setCategory] = useState<string>("STITCHING");
  const [isDefaultRule, setIsDefaultRule] = useState<boolean>(false);
  const [ruleActive, setRuleActive] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await getBillingConfig();
      setConfig(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load config");
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchRules = async () => {
    try {
      setLoadingRules(true);
      const res = await getAllTaxRules();
      setTaxRules(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load tax rules");
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRules();
  }, []);

  const handleUpdateConfigSwitch = (field: keyof BillingConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setIsSavingConfig(true);
      const updated = await updateBillingConfig(config);
      setConfig(updated);
      toast.success("Billing settings saved successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update configuration");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Rule Handlers
  const handleOpenAddRule = () => {
    setEditingRule(null);
    setTaxName("Tailoring GST 5%");
    setTaxType("GST");
    setGstRate(5.0);
    setHsnSacCode("9988");
    setCategory("STITCHING");
    setIsDefaultRule(false);
    setRuleActive(true);
    setDescription("");
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (r: TaxRule) => {
    setEditingRule(r);
    setTaxName(r.taxName);
    setTaxType(r.taxType);
    setGstRate(r.gstRate);
    setHsnSacCode(r.hsnSacCode);
    setCategory(r.category);
    setIsDefaultRule(r.isDefault);
    setRuleActive(r.active);
    setDescription(r.description || "");
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingRule(true);
      const payload: TaxRule = {
        id: editingRule?.id,
        taxName: taxName.trim(),
        taxType,
        gstRate,
        cgstRate: gstRate / 2,
        sgstRate: gstRate / 2,
        igstRate: gstRate,
        hsnSacCode: hsnSacCode.trim(),
        category,
        active: ruleActive,
        isDefault: isDefaultRule,
        description: description.trim() || undefined,
      };

      await saveTaxRule(payload);
      toast.success("Tax rule saved successfully!");
      setIsRuleModalOpen(false);
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save tax rule");
    } finally {
      setIsSavingRule(false);
    }
  };

  if (loadingConfig || !config) {
    return (
      <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        Loading billing settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Billing Switches & Tax Rules Configuration
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Control billing behavior, shop registration details, and CA-approved GST rates.
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Billing Behavior Switches */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground">
              Billing Behavior Switches & Toggles
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Customize which orders and sales qualify for bill generation
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">
                  Include Stitching-Only Orders in Billing
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, orders with customer fabric appear in bill generation.
                </p>
              </div>
              <Switch
                checked={config.includeStitchingOnly}
                onCheckedChange={(val) => handleUpdateConfigSwitch("includeStitchingOnly", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Allow Mixed Orders</Label>
                <p className="text-[11px] text-muted-foreground">
                  Orders containing both shop fabrics and customer fabric stitching.
                </p>
              </div>
              <Switch
                checked={config.allowMixedOrders}
                onCheckedChange={(val) => handleUpdateConfigSwitch("allowMixedOrders", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Allow Fabric-Only Sales</Label>
                <p className="text-[11px] text-muted-foreground">
                  Enable counter sale of loose unstitched fabrics.
                </p>
              </div>
              <Switch
                checked={config.allowFabricOnly}
                onCheckedChange={(val) => handleUpdateConfigSwitch("allowFabricOnly", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Allow Manual / Custom Invoices</Label>
                <p className="text-[11px] text-muted-foreground">
                  Create arbitrary bills without requiring existing workshop orders.
                </p>
              </div>
              <Switch
                checked={config.allowManualInvoices}
                onCheckedChange={(val) => handleUpdateConfigSwitch("allowManualInvoices", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Allow Custom Line Items</Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow adding extra items (e.g. Buttons, Trims) during bill generation.
                </p>
              </div>
              <Switch
                checked={config.allowCustomLineItems}
                onCheckedChange={(val) => handleUpdateConfigSwitch("allowCustomLineItems", val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Enforce Sequential Numbering</Label>
                <p className="text-[11px] text-muted-foreground">
                  Lock atomic sequential numbers (e.g. SFF/2026-27/0001).
                </p>
              </div>
              <Switch
                checked={config.enforceSequentialNumbering}
                onCheckedChange={(val) => handleUpdateConfigSwitch("enforceSequentialNumbering", val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shop Details & Bank Profile */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground">
              Shop Identity & Tax Registration
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Business Name *</Label>
                <Input
                  required
                  value={config.shopName}
                  onChange={(e) => handleUpdateConfigSwitch("shopName", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Tagline / Subtitle</Label>
                <Input
                  value={config.tagline}
                  onChange={(e) => handleUpdateConfigSwitch("tagline", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Shop GSTIN *</Label>
                <Input
                  required
                  value={config.gstin}
                  onChange={(e) => handleUpdateConfigSwitch("gstin", e.target.value.toUpperCase())}
                  className="bg-background border-input text-xs font-mono uppercase mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">State *</Label>
                <Input
                  value={config.state}
                  onChange={(e) => handleUpdateConfigSwitch("state", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">GST State Code *</Label>
                <Input
                  value={config.stateCode}
                  onChange={(e) => handleUpdateConfigSwitch("stateCode", e.target.value)}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Invoice Prefix</Label>
                <Input
                  value={config.invoicePrefix}
                  onChange={(e) => handleUpdateConfigSwitch("invoicePrefix", e.target.value.toUpperCase())}
                  className="bg-background border-input text-xs font-mono uppercase mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Financial Year</Label>
                <Input
                  value={config.financialYear}
                  onChange={(e) => handleUpdateConfigSwitch("financialYear", e.target.value)}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Shop Address</Label>
                <Input
                  value={config.address}
                  onChange={(e) => handleUpdateConfigSwitch("address", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Contact Phone</Label>
                <Input
                  value={config.phone}
                  onChange={(e) => handleUpdateConfigSwitch("phone", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-border/50 pt-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Bank Name</Label>
                <Input
                  value={config.bankName || ""}
                  onChange={(e) => handleUpdateConfigSwitch("bankName", e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Account Number</Label>
                <Input
                  value={config.accountNumber || ""}
                  onChange={(e) => handleUpdateConfigSwitch("accountNumber", e.target.value)}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">IFSC Code</Label>
                <Input
                  value={config.ifscCode || ""}
                  onChange={(e) => handleUpdateConfigSwitch("ifscCode", e.target.value.toUpperCase())}
                  className="bg-background border-input text-xs font-mono uppercase mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">UPI ID / QR</Label>
                <Input
                  value={config.upiId || ""}
                  onChange={(e) => handleUpdateConfigSwitch("upiId", e.target.value)}
                  className="bg-background border-input text-xs font-mono text-primary mt-1"
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-3">
              <Label className="text-xs text-muted-foreground font-semibold">Default Invoice Terms & Conditions</Label>
              <Textarea
                rows={3}
                value={config.termsAndConditions}
                onChange={(e) => handleUpdateConfigSwitch("termsAndConditions", e.target.value)}
                className="bg-background border-input text-xs mt-1 text-foreground"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSavingConfig}
                className="font-bold text-xs"
              >
                {isSavingConfig ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Tax Rules Section */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Configured Tax Rules (HSN / SAC & GST Rates)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Tax rules are configurable and reviewable by your shop's CA / tax professional.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAddRule}
            className="font-semibold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tax Rule
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">HSN / SAC</th>
                  <th className="py-3 px-3 text-center">GST Rate</th>
                  <th className="py-3 px-3 text-center">CGST</th>
                  <th className="py-3 px-3 text-center">SGST</th>
                  <th className="py-3 px-3 text-center">IGST</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loadingRules ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                      Loading configured tax rules...
                    </td>
                  </tr>
                ) : taxRules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-muted-foreground">
                      No tax rules configured yet.
                    </td>
                  </tr>
                ) : (
                  taxRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {rule.taxName}
                      {rule.isDefault && (
                        <Badge variant="outline" className="ml-2 text-primary border-primary/30 text-[9px]">
                          Default
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{rule.category}</td>
                    <td className="py-3 px-3 text-center font-mono text-primary font-bold">
                      {rule.hsnSacCode}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-500">
                      {rule.gstRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                      {rule.cgstRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                      {rule.sgstRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                      {rule.igstRate}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rule.active ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditRule(rule)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rule Modal */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {editingRule ? "Edit Tax Rule" : "Configure New Tax Rule"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRule} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Rule Name *</Label>
              <Input
                required
                placeholder="e.g. Tailoring SAC 9988 - 5%"
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                className="bg-background border-input text-xs mt-1 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val || "STITCHING")}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="STITCHING">Stitching / Service</SelectItem>
                    <SelectItem value="FABRIC">Fabric</SelectItem>
                    <SelectItem value="GENERAL">General Apparel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">HSN / SAC Code *</Label>
                <Input
                  required
                  placeholder="9988 / 5208"
                  value={hsnSacCode}
                  onChange={(e) => setHsnSacCode(e.target.value)}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">GST Rate (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Tax Type</Label>
                <Select value={taxType} onValueChange={(val) => setTaxType(val || "GST")}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="GST">GST (Standard)</SelectItem>
                    <SelectItem value="EXEMPT">Exempt / Nil Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded border border-border">
              <Label className="text-xs text-foreground">Set as Default Rule for Category</Label>
              <Switch checked={isDefaultRule} onCheckedChange={setIsDefaultRule} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Description / CA Reference</Label>
              <Input
                placeholder="Reference section or note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-input text-xs mt-1 text-foreground"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRuleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingRule}
              >
                {isSavingRule ? "Saving..." : "Save Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
