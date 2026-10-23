import React, { useState, useEffect } from "react";
import type {
  Fabric,
  FabricStockAdjustment,
  FabricStockTransaction,
  FabricEstimateResponse,
  PageResponse,
  TaxRule,
} from "@/types/billingModule";
import {
  getFabrics,
  createFabric,
  updateFabric,
  adjustFabricStock,
  getFabricStockTransactions,
  estimateFabricConsumption,
  getActiveTaxRules,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  RefreshCw,
  Search,
  ArrowUpDown,
  History,
  Scissors,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";

export const FabricMasterTab: React.FC = () => {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);

  // Add / Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [name, setName] = useState<string>("");
  const [fabricCode, setFabricCode] = useState<string>("");
  const [fabricType, setFabricType] = useState<string>("Cotton");
  const [color, setColor] = useState<string>("");
  const [widthInches, setWidthInches] = useState<number>(44);
  const [stockMeters, setStockMeters] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [hsnCode, setHsnCode] = useState<string>("5208");
  const [taxRuleId, setTaxRuleId] = useState<number | undefined>(undefined);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [supplier, setSupplier] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Stock Adjustment Modal
  const [adjustmentFabric, setAdjustmentFabric] = useState<Fabric | null>(null);
  const [adjType, setAdjType] = useState<string>("PURCHASE");
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjRef, setAdjRef] = useState<string>("");
  const [adjNotes, setAdjNotes] = useState<string>("");
  const [isSubmittingAdj, setIsSubmittingAdj] = useState<boolean>(false);

  // Stock History Modal
  const [historyFabric, setHistoryFabric] = useState<Fabric | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<FabricStockTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Fabric Consumption Quick Estimator Modal
  const [isEstimatorOpen, setIsEstimatorOpen] = useState<boolean>(false);
  const [estGarment, setEstGarment] = useState<string>("SHIRT");
  const [estWidth, setEstWidth] = useState<number>(44);
  const [estQty, setEstQty] = useState<number>(1);
  const [estResult, setEstResult] = useState<FabricEstimateResponse | null>(null);
  const [isCalculatingEst, setIsCalculatingEst] = useState<boolean>(false);

  const fetchFabrics = async () => {
    try {
      setLoading(true);
      const res: PageResponse<Fabric> = await getFabrics({
        search: search.trim() || undefined,
        size: 50,
      });
      setFabrics(res.content || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load fabrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFabrics();
    getActiveTaxRules().then((rules) => {
      setTaxRules(rules);
    }).catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingFabric(null);
    setName("");
    setFabricCode("FAB-" + Math.floor(1000 + Math.random() * 9000));
    setFabricType("Cotton");
    setColor("");
    setWidthInches(44);
    setStockMeters(0);
    setCostPrice(0);
    setSellingPrice(0);
    setHsnCode("5208");
    setTaxRuleId(taxRules.find((r) => r.category === "FABRIC")?.id);
    setMinStockAlert(10);
    setSupplier("");
    setNotes("");
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (f: Fabric) => {
    setEditingFabric(f);
    setName(f.name);
    setFabricCode(f.fabricCode);
    setFabricType(f.fabricType || "Cotton");
    setColor(f.color || "");
    setWidthInches(f.widthInches || 44);
    setStockMeters(f.stockMeters || 0);
    setCostPrice(f.costPricePerMeter || 0);
    setSellingPrice(f.sellingPricePerMeter || 0);
    setHsnCode(f.hsnCode || "5208");
    setTaxRuleId(f.taxRuleId);
    setMinStockAlert(f.minStockAlert || 10);
    setSupplier(f.supplier || "");
    setNotes(f.notes || "");
    setIsEditModalOpen(true);
  };

  const handleSaveFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter fabric name.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Fabric = {
        id: editingFabric?.id,
        name: name.trim(),
        fabricCode: fabricCode.trim().toUpperCase(),
        fabricType,
        color: color.trim() || undefined,
        widthInches,
        stockMeters,
        costPricePerMeter: costPrice,
        sellingPricePerMeter: sellingPrice,
        hsnCode,
        taxRuleId,
        minStockAlert,
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        active: true,
      };

      if (editingFabric?.id) {
        await updateFabric(editingFabric.id, payload);
        toast.success("Fabric updated successfully!");
      } else {
        await createFabric(payload);
        toast.success("Fabric added to inventory!");
      }

      setIsEditModalOpen(false);
      fetchFabrics();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save fabric");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Adjustment
  const handleOpenAdjustment = (f: Fabric) => {
    setAdjustmentFabric(f);
    setAdjType("PURCHASE");
    setAdjQty(10);
    setAdjRef("");
    setAdjNotes("");
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentFabric) return;

    if (adjQty <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    try {
      setIsSubmittingAdj(true);
      const payload: FabricStockAdjustment = {
        fabricId: adjustmentFabric.id!,
        transactionType: adjType,
        quantityMeters: adjQty,
        referenceNo: adjRef.trim() || undefined,
        referenceType: "MANUAL",
        notes: adjNotes.trim() || undefined,
      };

      await adjustFabricStock(payload);
      toast.success("Stock updated successfully!");
      setAdjustmentFabric(null);
      fetchFabrics();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  // Open History
  const handleOpenHistory = async (f: Fabric) => {
    setHistoryFabric(f);
    try {
      setLoadingHistory(true);
      const res = await getFabricStockTransactions(f.id!, 0, 50);
      setHistoryTransactions(res.content || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load stock history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Estimate Consumption
  const handleRunEstimation = async () => {
    try {
      setIsCalculatingEst(true);
      const res = await estimateFabricConsumption({
        garmentType: estGarment,
        widthInches: estWidth,
        quantity: estQty,
      });
      setEstResult(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Estimation failed");
    } finally {
      setIsCalculatingEst(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Fabric Master & Stock Ledger
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Track fabric inventory in meters, width specifications, HSN tax linkage, and movements.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEstimatorOpen(true);
                  handleRunEstimation();
                }}
                className="text-xs flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5 text-primary" />
                Consumption Estimator
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Fabric
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search Fabric Name, Code, Type, Color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchFabrics()}
                className="pl-8 bg-background border-input text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchFabrics}
              className="text-xs"
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fabric Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Fabric Code</th>
                  <th className="py-3 px-3">Fabric Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Width</th>
                  <th className="py-3 px-3 text-right">Available Stock</th>
                  <th className="py-3 px-3 text-right">Selling Rate</th>
                  <th className="py-3 px-3 text-center">HSN</th>
                  <th className="py-3 px-3 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        Loading fabric inventory...
                      </div>
                    </td>
                  </tr>
                ) : fabrics.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No fabrics in inventory. Click "Add New Fabric" above.
                    </td>
                  </tr>
                ) : (
                  fabrics.map((f) => {
                    const isLow = f.stockMeters <= f.minStockAlert;

                    return (
                      <tr key={f.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {f.fabricCode}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-foreground">{f.name}</p>
                          {f.color && <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">({f.color})</span>}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {f.fabricType || "Textile"}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono">
                          {f.widthInches}"
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                          {f.stockMeters.toFixed(2)} Mtr
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          ₹{f.sellingPricePerMeter.toFixed(2)}/M
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                          {f.hsnCode}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                              Low Stock (&lt;{f.minStockAlert}m)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                              In Stock
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAdjustment(f)}
                              className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-muted"
                              title="Adjust Stock"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                              Adjust
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenHistory(f)}
                              className="h-7 px-2 text-xs text-blue-500 hover:bg-muted"
                              title="Stock Ledger"
                            >
                              <History className="w-3.5 h-3.5 mr-1" />
                              Ledger
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEdit(f)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Fabric Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingFabric ? "Edit Fabric Details" : "Add New Fabric to Inventory"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveFabric} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Fabric Name *</Label>
                <Input
                  required
                  placeholder="e.g. Raymond Royal Wool"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Fabric Code *</Label>
                <Input
                  required
                  placeholder="e.g. FAB-RAY-01"
                  value={fabricCode}
                  onChange={(e) => setFabricCode(e.target.value.toUpperCase())}
                  className="bg-background border-input text-xs font-mono uppercase mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Fabric Type</Label>
                <Input
                  placeholder="Cotton, Linen, Wool..."
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Color / Shade</Label>
                <Input
                  placeholder="e.g. Navy Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Width (Inches)</Label>
                <Select value={String(widthInches)} onValueChange={(v) => setWidthInches(Number(v))}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="36">36" (Narrow)</SelectItem>
                    <SelectItem value="44">44" (Standard)</SelectItem>
                    <SelectItem value="58">58" (Double Width)</SelectItem>
                    <SelectItem value="60">60" (Wide)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Current Stock (Mtr)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stockMeters}
                  onChange={(e) => setStockMeters(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Cost Price/M (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Selling Price/M (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">HSN Code</Label>
                <Input
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Tax Rule</Label>
                <Select
                  value={taxRuleId ? String(taxRuleId) : "DEFAULT"}
                  onValueChange={(v) => setTaxRuleId(v === "DEFAULT" ? undefined : Number(v))}
                >
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue placeholder="Standard 5%" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="DEFAULT">Default Fabric (5%)</SelectItem>
                    {taxRules.map((tr) => (
                      <SelectItem key={tr.id} value={String(tr.id)}>
                        {tr.taxName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Min Stock Alert (Mtr)</Label>
                <Input
                  type="number"
                  step="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Fabric"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Movement / Adjustment Modal */}
      <Dialog open={!!adjustmentFabric} onOpenChange={() => setAdjustmentFabric(null)}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary" />
              Stock Movement & Adjustment
            </DialogTitle>
          </DialogHeader>

          {adjustmentFabric && (
            <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-2">
              <div className="p-3 bg-muted/40 rounded border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fabric:</span>
                  <span className="font-semibold text-foreground">{adjustmentFabric.name} ({adjustmentFabric.fabricCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-mono font-bold text-primary">{adjustmentFabric.stockMeters.toFixed(2)} Mtr</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Movement Type *</Label>
                <Select value={adjType} onValueChange={(val) => setAdjType(val || "PURCHASE")}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="PURCHASE">Purchase (+ Add to Stock)</SelectItem>
                    <SelectItem value="RETURN">Customer Return (+ Add to Stock)</SelectItem>
                    <SelectItem value="SALE">Direct Sale (- Deduct Stock)</SelectItem>
                    <SelectItem value="ORDER_CONSUMPTION">Order Cutting (- Deduct Stock)</SelectItem>
                    <SelectItem value="WASTAGE">Damage / Wastage (- Deduct Stock)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Audit Count Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Quantity (Meters) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="bg-background border-input font-mono text-sm mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Reference Document No (Optional)</Label>
                <Input
                  placeholder="e.g. Supplier Invoice / PO #"
                  value={adjRef}
                  onChange={(e) => setAdjRef(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Notes / Reason</Label>
                <Input
                  placeholder="Reason for adjustment"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustmentFabric(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAdj}
                >
                  {isSubmittingAdj ? "Updating..." : "Record Movement"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock History Ledger Modal */}
      <Dialog open={!!historyFabric} onOpenChange={() => setHistoryFabric(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Stock Ledger: {historyFabric?.name} ({historyFabric?.fabricCode})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {loadingHistory ? (
              <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Loading ledger transactions...
              </div>
            ) : historyTransactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No recorded stock transactions for this fabric.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase border-b border-border">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Change</th>
                      <th className="py-2 px-3 text-right">Prev</th>
                      <th className="py-2 px-3 text-right">New Stock</th>
                      <th className="py-2 px-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-[11px]">
                    {historyTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground font-mono">
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground">
                          {tx.transactionType}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {["SALE", "ORDER_CONSUMPTION", "WASTAGE"].includes(tx.transactionType) ? (
                            <span className="text-destructive">-{tx.quantityMeters}m</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">+{tx.quantityMeters}m</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">{tx.previousStock}m</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-foreground">{tx.newStock}m</td>
                        <td className="py-2 px-3 text-muted-foreground truncate max-w-[120px]">{tx.referenceNo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Estimator Modal */}
      <Dialog open={isEstimatorOpen} onOpenChange={setIsEstimatorOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              Fabric Consumption Estimator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Garment Type</Label>
                <Select value={estGarment} onValueChange={(val) => setEstGarment(val || "SHIRT")}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="SHIRT">Shirt</SelectItem>
                    <SelectItem value="PANT">Pant / Trouser</SelectItem>
                    <SelectItem value="SUIT_2PC">Suit 2-Piece</SelectItem>
                    <SelectItem value="SUIT_3PC">Suit 3-Piece</SelectItem>
                    <SelectItem value="KURTA">Kurta</SelectItem>
                    <SelectItem value="PAJAMA">Pajama</SelectItem>
                    <SelectItem value="WAISTCOAT">Waistcoat / Nehru Jacket</SelectItem>
                    <SelectItem value="SAFARI">Safari Suit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Fabric Width</Label>
                <Select value={String(estWidth)} onValueChange={(v) => setEstWidth(Number(v))}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="36">36" (Narrow)</SelectItem>
                    <SelectItem value="44">44" (Standard Shirting)</SelectItem>
                    <SelectItem value="58">58" (Suiting / Wide)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-1/2">
                <Label className="text-xs text-muted-foreground font-semibold">Quantity of Garments</Label>
                <Input
                  type="number"
                  min="1"
                  value={estQty}
                  onChange={(e) => setEstQty(Math.max(1, Number(e.target.value)))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div className="w-1/2 pt-5">
                <Button
                  onClick={handleRunEstimation}
                  disabled={isCalculatingEst}
                  className="w-full font-semibold text-xs"
                >
                  {isCalculatingEst ? "Calculating..." : "Calculate Meters"}
                </Button>
              </div>
            </div>

            {estResult && (
              <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Fabric:</span>
                  <span className="font-mono text-foreground font-bold">{estResult.baseMeters.toFixed(2)} Mtr</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Wastage Allowance:</span>
                  <span className="font-mono text-primary font-semibold">+{estResult.wastageMeters.toFixed(2)} Mtr</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-black text-foreground">
                  <span>Recommended Fabric:</span>
                  <span className="text-primary font-mono text-base">{estResult.totalEstimatedMeters.toFixed(2)} Meters</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1">{estResult.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
