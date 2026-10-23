import { useState, useEffect } from "react";
import {
  Type,
  Check,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_PRESETS,
  getStoredTypography,
  saveTypography,
  resetTypography,
  type FontFamilyId,
  type FontSizePreset,
  type TypographySettings,
} from "@/utils/typography";
import toast from "react-hot-toast";

export default function TypographySettingsSection() {
  const [typography, setTypography] = useState<TypographySettings>(() =>
    getStoredTypography()
  );

  useEffect(() => {
    setTypography(getStoredTypography());
  }, []);

  const handleFontFamilyChange = (fontFamily: FontFamilyId) => {
    const updated: TypographySettings = {
      ...typography,
      fontFamily,
    };
    setTypography(updated);
    saveTypography(updated);
    toast.success("Font updated globally!");
  };

  const handlePresetChange = (preset: FontSizePreset, percent: number) => {
    const updated: TypographySettings = {
      ...typography,
      fontSizePreset: preset,
      fontSizePercent: percent,
    };
    setTypography(updated);
    saveTypography(updated);
  };

  const handleSliderChange = (percent: number) => {
    let preset: FontSizePreset = "default";
    if (percent <= 92) preset = "small";
    else if (percent >= 118) preset = "extralarge";
    else if (percent >= 106) preset = "large";

    const updated: TypographySettings = {
      ...typography,
      fontSizePreset: preset,
      fontSizePercent: percent,
    };
    setTypography(updated);
    saveTypography(updated);
  };

  const handleReset = () => {
    const def = resetTypography();
    setTypography(def);
    toast.success("Typography reset to system defaults.");
  };

  const activeFamily =
    FONT_FAMILY_OPTIONS.find((f) => f.id === typography.fontFamily) ||
    FONT_FAMILY_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Type className="size-4" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Font & Text Appearance
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Customize the global typography and display scale across the ERP
                interface. Changes apply instantly and persist across sessions.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset to Default
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Font Family Selection Grid */}
      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>1. Font Family</span>
            <Badge variant="outline" className="text-[11px] font-normal border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              Active: {activeFamily.label}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Choose a typeface that maximizes legibility on your shop floor screens and mobile devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FONT_FAMILY_OPTIONS.map((font) => {
              const isSelected = typography.fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleFontFamilyChange(font.id)}
                  style={{ fontFamily: font.cssFamily }}
                  className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/25 ring-1 ring-emerald-600/50"
                      : "border-border bg-muted/20 hover:bg-muted/40 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-foreground">
                      {font.label}
                    </span>
                    {isSelected ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="size-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {font.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {font.previewSample}
                  </p>
                  <p className="text-[11px] text-foreground/80 mt-1 font-medium">
                    1234567890 • ₹ 4,850 • कटिंग
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font Size & Display Scaling */}
      <Card className="border-border bg-card shadow-xs rounded-2xl">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Text Scale & Display Density</span>
            </CardTitle>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {typography.fontSizePercent}%
            </span>
          </div>
          <CardDescription className="text-xs">
            Adjust overall scale to fit more records on screen or enlarge text for comfortable tablet reading.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_SIZE_PRESETS.map((preset) => {
              const isSelected = typography.fontSizePercent === preset.percent;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id, preset.percent)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-600/50"
                      : "border-border bg-muted/20 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="text-xs font-semibold">{preset.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {preset.percent}% scale
                  </div>
                </button>
              );
            })}
          </div>

          {/* Precision Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Compact (85%)</span>
              <span>Default (100%)</span>
              <span>Spacious (125%)</span>
            </div>
            <input
              type="range"
              min={85}
              max={125}
              step={1}
              value={typography.fontSizePercent}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-muted rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Card */}
      <Card className="border-border bg-card shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-bold">
                Live Preview (Real-time Typography Rendering)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Family: {activeFamily.label} | Scale: {typography.fontSizePercent}%
            </Badge>
          </div>
          <CardDescription className="text-xs">
            This preview simulates headings, metrics, tables, and buttons rendered with your selected typography.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Simulated Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Orders & Production Workspace
              </h3>
              <p className="text-xs text-muted-foreground">
                Bespoke tailoring orders, fabric assignment, and delivery schedule.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                Filter
              </Button>
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                New Order
              </Button>
            </div>
          </div>

          {/* Simulated Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Active Orders
              </span>
              <p className="text-lg font-bold font-mono">42</p>
              <span className="text-[10px] text-emerald-600 font-medium">
                ↑ 4 today
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                In Stitching
              </span>
              <p className="text-lg font-bold font-mono">18</p>
              <span className="text-[10px] text-muted-foreground">
                3 master tailors
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Due Today
              </span>
              <p className="text-lg font-bold font-mono text-amber-600">6</p>
              <span className="text-[10px] text-amber-600 font-medium">
                High priority
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Collection
              </span>
              <p className="text-lg font-bold font-mono text-emerald-600">
                ₹ 48,500
              </p>
              <span className="text-[10px] text-muted-foreground">
                12 transactions
              </span>
            </div>
          </div>

          {/* Simulated Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-[11px] font-bold text-muted-foreground grid grid-cols-12 gap-2 uppercase tracking-wider">
              <div className="col-span-3">Order / Customer</div>
              <div className="col-span-3">Service</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            <div className="divide-y divide-border text-xs">
              <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-3">
                  <div className="font-bold text-foreground">#SFF-1082</div>
                  <div className="text-muted-foreground text-[11px]">
                    Rajesh Kumar Verma
                  </div>
                </div>
                <div className="col-span-3 text-muted-foreground">
                  3-Piece Sherwani (Raw Silk)
                </div>
                <div className="col-span-2 font-mono text-muted-foreground">
                  24 Oct 2026
                </div>
                <div className="col-span-2">
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                    STITCHING
                  </Badge>
                </div>
                <div className="col-span-2 text-right font-bold font-mono text-foreground">
                  ₹ 6,800
                </div>
              </div>
              <div className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-3">
                  <div className="font-bold text-foreground">#SFF-1081</div>
                  <div className="text-muted-foreground text-[11px]">
                    Vikram Singh
                  </div>
                </div>
                <div className="col-span-3 text-muted-foreground">
                  Formal Trousers & Shirt
                </div>
                <div className="col-span-2 font-mono text-muted-foreground">
                  25 Oct 2026
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="text-[10px]">
                    CUTTING
                  </Badge>
                </div>
                <div className="col-span-2 text-right font-bold font-mono text-foreground">
                  ₹ 2,450
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
