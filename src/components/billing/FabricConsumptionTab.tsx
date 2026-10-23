import React, { useState, useEffect } from "react";
import type { FabricConsumptionRule, FabricEstimateResponse } from "@/types/billingModule";
import {
  getFabricConsumptionRules,
  saveFabricConsumptionRule,
  estimateFabricConsumption,
} from "@/services/billingModuleService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Scissors, Plus, RefreshCw, Calculator, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

export const FabricConsumptionTab: React.FC = () => {
  const [rules, setRules] = useState<FabricConsumptionRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit / Add Rule Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<FabricConsumptionRule | null>(null);
  const [garmentType, setGarmentType] = useState<string>("SHIRT");
  const [widthInches, setWidthInches] = useState<number>(44);
  const [baseMeters, setBaseMeters] = useState<number>(1.6);
  const [wastagePercent, setWastagePercent] = useState<number>(5.0);
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Interactive Live Tester
  const [testGarment, setTestGarment] = useState<string>("SHIRT");
  const [testWidth, setTestWidth] = useState<number>(44);
  const [testQty, setTestQty] = useState<number>(1);
  const [testChest, setTestChest] = useState<number>(38);
  const [testLength, setTestLength] = useState<number>(30);
  const [testResult, setTestResult] = useState<FabricEstimateResponse | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await getFabricConsumptionRules();
      setRules(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load consumption rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setGarmentType("SHIRT");
    setWidthInches(44);
    setBaseMeters(1.6);
    setWastagePercent(5.0);
    setDescription("");
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (rule: FabricConsumptionRule) => {
    setEditingRule(rule);
    setGarmentType(rule.garmentType);
    setWidthInches(rule.widthInches);
    setBaseMeters(rule.baseConsumptionMeters);
    setWastagePercent(rule.wastagePercent);
    setDescription(rule.description || "");
    setIsEditModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload: FabricConsumptionRule = {
        id: editingRule?.id,
        garmentType,
        widthInches,
        baseConsumptionMeters: baseMeters,
        wastagePercent,
        description: description.trim() || undefined,
      };

      await saveFabricConsumptionRule(payload);
      toast.success("Consumption rule saved successfully!");
      setIsEditModalOpen(false);
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run Test Calculation
  const handleTestCalculation = async () => {
    try {
      const res = await estimateFabricConsumption({
        garmentType: testGarment,
        widthInches: testWidth,
        quantity: testQty,
        chestSizeInches: testChest,
        lengthInches: testLength,
      });
      setTestResult(res);
    } catch (err: any) {
      toast.error("Calculation failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Garment Fabric Consumption & Cutting Rules
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Define standard meter consumption and cutting wastage allowances based on fabric width (36", 44", 58").
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Consumption Rule
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Table */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Configured Garment Formulas</CardTitle>
              <span className="text-xs text-muted-foreground">{rules.length} rules defined</span>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[10px] uppercase font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Garment Type</th>
                      <th className="py-3 px-3 text-center">Fabric Width</th>
                      <th className="py-3 px-3 text-right">Base Requirement</th>
                      <th className="py-3 px-3 text-center">Wastage %</th>
                      <th className="py-3 px-3 text-right">Total Standard / Pc</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                            Loading consumption formulas...
                          </div>
                        </td>
                      </tr>
                    ) : rules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          No formulas defined. Click "Add Consumption Rule" above.
                        </td>
                      </tr>
                    ) : (
                      rules.map((rule) => {
                        const totalStandard =
                          rule.baseConsumptionMeters +
                          (rule.baseConsumptionMeters * rule.wastagePercent) / 100;

                        return (
                          <tr key={rule.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-foreground">
                              {rule.garmentType.replace(/_/g, " ")}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-primary font-bold">
                              {rule.widthInches}"
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-foreground">
                              {rule.baseConsumptionMeters.toFixed(2)} Mtr
                            </td>
                            <td className="py-3 px-3 text-center text-muted-foreground">
                              {rule.wastagePercent}%
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                              {totalStandard.toFixed(2)} Mtr
                            </td>
                            <td className="py-3 px-3 text-muted-foreground truncate max-w-[150px]">
                              {rule.description || "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(rule)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
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
        </div>

        {/* Live Calculation Tester */}
        <div className="space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Interactive Tailor Calculator
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Simulate exact cloth meterage for a job
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Garment</Label>
                <Select value={testGarment} onValueChange={(val) => setTestGarment(val || "SHIRT")}>
                  <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="SHIRT">Shirt</SelectItem>
                    <SelectItem value="PANT">Pant / Trouser</SelectItem>
                    <SelectItem value="SUIT_2PC">Suit 2-Piece (Coat + Pant)</SelectItem>
                    <SelectItem value="SUIT_3PC">Suit 3-Piece (Coat + Vest + Pant)</SelectItem>
                    <SelectItem value="KURTA">Kurta</SelectItem>
                    <SelectItem value="PAJAMA">Pajama</SelectItem>
                    <SelectItem value="WAISTCOAT">Waistcoat / Nehru Jacket</SelectItem>
                    <SelectItem value="SAFARI">Safari Suit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Cloth Width</Label>
                  <Select value={String(testWidth)} onValueChange={(v) => setTestWidth(Number(v))}>
                    <SelectTrigger className="bg-background border-input text-xs mt-1 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="36">36" (Narrow)</SelectItem>
                      <SelectItem value="44">44" (Standard)</SelectItem>
                      <SelectItem value="58">58" (Double/Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={testQty}
                    onChange={(e) => setTestQty(Math.max(1, Number(e.target.value)))}
                    className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Chest / Waist (in)</Label>
                  <Input
                    type="number"
                    value={testChest}
                    onChange={(e) => setTestChest(Number(e.target.value))}
                    className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Garment Length (in)</Label>
                  <Input
                    type="number"
                    value={testLength}
                    onChange={(e) => setTestLength(Number(e.target.value))}
                    className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                  />
                </div>
              </div>

              <Button
                onClick={handleTestCalculation}
                className="w-full font-bold h-9 text-xs"
              >
                Compute Requirement
              </Button>

              {testResult && (
                <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2 text-xs mt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Consumption:</span>
                    <span className="font-mono text-foreground font-bold">{testResult.baseMeters.toFixed(2)} Mtr</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cutting Waste:</span>
                    <span className="font-mono text-primary font-semibold">+{testResult.wastageMeters.toFixed(2)} Mtr</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-black text-foreground">
                    <span>Required Meterage:</span>
                    <span className="text-primary font-mono text-base">{testResult.totalEstimatedMeters.toFixed(2)} Meters</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Formula Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              {editingRule ? "Edit Formula" : "Add Consumption Formula"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRule} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Garment Type *</Label>
              <Input
                required
                placeholder="e.g. SHIRT, PANT, SUIT_2PC, KURTA..."
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value.toUpperCase())}
                className="bg-background border-input text-xs font-mono uppercase mt-1 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Fabric Width (Inches) *</Label>
                <Input
                  type="number"
                  step="1"
                  required
                  value={widthInches}
                  onChange={(e) => setWidthInches(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Base Meters *</Label>
                <Input
                  type="number"
                  step="0.05"
                  required
                  value={baseMeters}
                  onChange={(e) => setBaseMeters(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Wastage % *</Label>
                <Input
                  type="number"
                  step="0.5"
                  required
                  value={wastagePercent}
                  onChange={(e) => setWastagePercent(Number(e.target.value))}
                  className="bg-background border-input text-xs font-mono mt-1 text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Description</Label>
                <Input
                  placeholder="e.g. Full sleeves on 44 inch cloth"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background border-input text-xs mt-1 text-foreground"
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
                {isSubmitting ? "Saving..." : "Save Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
