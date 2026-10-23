import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Phone,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchCustomers, type CustomerSummary } from "@/services/CustomerService";

export type CustomerFilter = "all" | "balance" | "pending";

interface Props {
  searchInput: string;
  appliedSearch: string;
  filter: CustomerFilter;
  searching: boolean;
  onSearchInputChange: (value: string) => void;
  onApplySearch: (query: string) => void;
  onResetSearch: () => void;
  onFilterChange: (value: CustomerFilter) => void;
}

const filters: {
  value: CustomerFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "balance",
    label: "With Balance",
  },
  {
    value: "pending",
    label: "Pending",
  },
];

export default function CustomerToolbar({
  searchInput,
  appliedSearch,
  filter,
  searching,
  onSearchInputChange,
  onApplySearch,
  onResetSearch,
  onFilterChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<CustomerSummary[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Track latest query request to prevent stale async responses
  const latestQueryRef = useRef("");

  // Debounced search for suggestions only (does NOT modify table)
  useEffect(() => {
    const trimmed = searchInput.trim();
    latestQueryRef.current = trimmed;

    const timer = setTimeout(async () => {
      if (!trimmed) {
        setSuggestions([]);
        setLoadingSuggestions(false);
        setHighlightedIndex(-1);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await searchCustomers(trimmed, 0, 6, "name,asc");
        // Verify this is still the active query
        if (latestQueryRef.current === trimmed) {
          setSuggestions(response.content ?? []);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        console.error("Suggestions fetch error:", err);
        if (latestQueryRef.current === trimmed) {
          setSuggestions([]);
        }
      } finally {
        if (latestQueryRef.current === trimmed) {
          setLoadingSuggestions(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Mobile virtual keyboard handling: keep search input visible in viewport
  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    };

    vv.addEventListener("resize", handleViewportChange);
    return () => vv.removeEventListener("resize", handleViewportChange);
  }, []);

  const handleInputFocus = () => {
    setShowSuggestions(true);
    // Smooth scroll into viewport on focus for mobile devices
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        // Select highlighted suggestion
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        // Submit search to query table
        setShowSuggestions(false);
        onApplySearch(searchInput);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelectSuggestion = (customer: CustomerSummary) => {
    onSearchInputChange(customer.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    // Focus back on search input so user can press Search or view
    inputRef.current?.focus();
  };

  const handleClearInput = () => {
    onSearchInputChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmitSearch = () => {
    setShowSuggestions(false);
    onApplySearch(searchInput);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* SEARCH INPUT & GOOGLE-STYLE SUGGESTIONS */}
        <div ref={containerRef} className="relative flex-1 scroll-mt-24">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              ref={inputRef}
              value={searchInput}
              onChange={(e) => {
                onSearchInputChange(e.target.value);
                if (!showSuggestions) setShowSuggestions(true);
              }}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, phone, or code..."
              className="h-10 pl-9 pr-16 text-sm"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {loadingSuggestions && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  aria-label="Clear typed search"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* GOOGLE-STYLE SUGGESTIONS DROPDOWN */}
          {showSuggestions && searchInput.trim().length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 shadow-xl backdrop-blur-md"
              role="listbox"
            >
              {loadingSuggestions && suggestions.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching customers...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                  No customers found matching &quot;{searchInput.trim()}&quot;
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Matching Customers ({suggestions.length})
                  </div>
                  {suggestions.map((cust, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <div
                        key={cust.id}
                        role="option"
                        aria-selected={isHighlighted}
                        tabIndex={0}
                        onClick={() => handleSelectSuggestion(cust)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                          isHighlighted
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {cust.image ? (
                              <img
                                src={cust.image}
                                alt={cust.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              (cust.name.slice(0, 1) || "C").toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {cust.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {cust.phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="h-2.5 w-2.5" />
                                  {cust.phone}
                                </span>
                              )}
                              {cust.customerCode && (
                                <span className="font-mono text-[10px] text-muted-foreground/80">
                                  {cust.customerCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {(cust.balance ?? 0) > 0 && (
                          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Due ₹{Number(cust.balance).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t border-border/50 px-2 py-1 text-right">
                    <span className="text-[10px] text-muted-foreground">
                      Click customer to fill input · Press Search to update table
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEARCH ACTION BUTTON */}
        <Button
          type="button"
          onClick={handleSubmitSearch}
          disabled={searching}
          className="h-10 shrink-0 gap-1.5 px-4 font-medium shadow-xs"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span>Search</span>
        </Button>

        {/* FILTERS */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onFilterChange(item.value)}
                className={`h-10 rounded-md border px-3.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* APPLIED SEARCH FILTER BADGE */}
      {appliedSearch && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Table filtered by:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
            &ldquo;{appliedSearch}&rdquo;
            <button
              type="button"
              onClick={onResetSearch}
              title="Clear table filter"
              className="rounded-full hover:bg-primary/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetSearch}
            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset table
          </Button>
        </div>
      )}
    </div>
  );
}