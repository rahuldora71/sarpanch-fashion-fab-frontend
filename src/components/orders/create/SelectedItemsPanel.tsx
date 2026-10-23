import { useEffect, useRef, useState } from "react";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActiveAddOns, searchAddOns } from "@/services/addOnService";
import type { SelectedOrderAddOn } from "@/types/order";

interface SelectedItemsPanelProps {
  selectedAddOns: SelectedOrderAddOn[];
  isLocked?: boolean;
  onAdd: (addOn: SelectedOrderAddOn) => void;
  onRemove: (addOnId: number) => void;
}

export function SelectedItemsPanel({
  selectedAddOns,
  isLocked = false,
  onAdd,
  onRemove,
}: SelectedItemsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedOrderAddOn[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const latestQueryRef = useRef("");

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Fetch / filter matching add-ons when user types or opens
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = trimmed
          ? await searchAddOns(trimmed, 0, 15, "name,asc")
          : await getActiveAddOns(0, 10, "name,asc");

        if (latestQueryRef.current === trimmed) {
          const mapped: SelectedOrderAddOn[] = (response.content ?? []).map(
            (item) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price ?? 0),
              tailorCommission: Number(item.tailorCommission ?? 0),
              imageUrl: item.imageUrl ?? null,
              beforeCutting: item.beforeCutting,
              quantity: 1,
              totalPrice: Number(item.price ?? 0),
            }),
          );
          setResults(mapped);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        console.error("Failed to search add-ons:", err);
        if (latestQueryRef.current === trimmed) {
          setResults([]);
        }
      } finally {
        if (latestQueryRef.current === trimmed) {
          setLoading(false);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const selectedIds = new Set(selectedAddOns.map((item) => item.id));

  const totalAddOnsPrice = selectedAddOns.reduce(
    (sum, item) => sum + Number(item.totalPrice || item.price || 0),
    0,
  );

  const handleSelectAddOn = (addOn: SelectedOrderAddOn) => {
    if (isLocked) return;
    if (selectedIds.has(addOn.id)) return; // Prevent duplicates

    onAdd(addOn);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectAddOn(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <aside className="h-fit rounded-xl border bg-card p-4 shadow-2xs xl:sticky xl:top-5">
      {/* =====================================================
          PANEL HEADER
      ===================================================== */}
      <div className="mb-3 flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Add-ons</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search and add custom work to this garment
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-100 px-2 text-xs font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
            {selectedAddOns.length}
          </span>
        </div>
      </div>

      {/* =====================================================
          SEARCH-FIRST INPUT & DROPDOWN
      ===================================================== */}
      <div ref={containerRef} className="relative mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            disabled={isLocked}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search add-ons..."
            className="h-9 pl-8 pr-12 text-xs"
            autoComplete="off"
          />

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            {query && !isLocked && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setHighlightedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Dropdown Popover */}
        {isOpen && !isLocked && (
          <div
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 shadow-xl backdrop-blur-md"
            role="listbox"
          >
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching add-ons...
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                {query.trim()
                  ? `No add-ons matching "${query.trim()}"`
                  : "No active add-ons available"}
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Matching Add-ons
                </div>
                {results.map((addOn, idx) => {
                  const alreadySelected = selectedIds.has(addOn.id);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={addOn.id}
                      role="option"
                      aria-selected={isHighlighted}
                      tabIndex={0}
                      onClick={() => !alreadySelected && handleSelectAddOn(addOn)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                        alreadySelected
                          ? "cursor-default opacity-60 bg-muted/30"
                          : isHighlighted
                          ? "cursor-pointer bg-accent text-accent-foreground"
                          : "cursor-pointer hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                          {addOn.imageUrl ? (
                            <img
                              src={addOn.imageUrl}
                              alt={addOn.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{addOn.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            ₹{Number(addOn.price ?? 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {alreadySelected ? (
                        <span className="flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <Check className="h-2.5 w-2.5 text-green-600" />
                          Added
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-2 text-[11px] font-medium text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          SELECTED ADD-ONS SECTION (Compact Cards)
      ===================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            Selected Add-ons ({selectedAddOns.length})
          </span>
          {totalAddOnsPrice > 0 && (
            <span className="font-semibold text-foreground">
              Total: ₹{totalAddOnsPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {selectedAddOns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              No add-ons selected
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              Use the search above to add work like Cross Pocket, Elastic, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedAddOns.map((addOn) => (
              <div
                key={addOn.id}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/80 px-3 py-2 transition-colors hover:border-border hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">
                      {addOn.name}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-semibold text-foreground/90">
                      ₹{Number(addOn.price ?? 0).toLocaleString("en-IN")}
                    </span>
                    {addOn.beforeCutting && (
                      <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                        Pre-cut
                      </span>
                    )}
                  </div>
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => onRemove(addOn.id)}
                    aria-label={`Remove ${addOn.name}`}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}