import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";

export interface DatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minDate?: string; // YYYY-MM-DD
  showPresets?: boolean;
  className?: string;
  allowClear?: boolean;
}

const MONTHS_I18N: Record<string, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  hi: [
    "जनवरी",
    "फ़रवरी",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुलाई",
    "अगस्त",
    "सितंबर",
    "अक्टूबर",
    "नवंबर",
    "दिसंबर",
  ],
  pa: [
    "ਜਨਵਰੀ",
    "ਫ਼ਰਵਰੀ",
    "ਮਾਰਚ",
    "ਅਪ੍ਰੈਲ",
    "ਮਈ",
    "ਜੂਨ",
    "ਜੁਲਾਈ",
    "ਅਗਸਤ",
    "ਸਤੰਬਰ",
    "ਅਕਤੂਬਰ",
    "ਨਵੰਬਰ",
    "ਦਸੰਬਰ",
  ],
};

const SHORT_MONTHS_I18N: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  hi: ["जन", "फ़र", "मार्च", "अप्रै", "मई", "जून", "जुला", "अग", "सितं", "अक्टू", "नवं", "दिसं"],
  pa: ["ਜਨ", "ਫ਼ਰ", "ਮਾਰਚ", "ਅਪ੍ਰੈ", "ਮਈ", "ਜੂਨ", "ਜੁਲਾ", "ਅਗ", "ਸਤੰ", "ਅਕਤੂ", "ਨਵੰ", "ਦਸੰ"],
};

const WEEKDAYS_SHORT_I18N: Record<string, string[]> = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  pa: ["ਐਤ", "ਸੋਮ", "ਮੰਗਲ", "ਬੁੱਧ", "ਵੀਰ", "ਸ਼ੁੱਕਰ", "ਸ਼ਨੀ"],
};

const WEEKDAYS_FULL_I18N: Record<string, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "वीरवार", "शुक्रवार", "शनिवार"],
  pa: ["ਐਤਵਾਰ", "ਸੋਮਵਾਰ", "ਮੰਗਲਵਾਰ", "ਬੁੱਧਵਾਰ", "ਵੀਰਵਾਰ", "ਸ਼ੁੱਕਰਵਾਰ", "ਸ਼ਨੀਵਾਰ"],
};

interface QuickPreset {
  days: number;
  en: string;
  hi: string;
  pa: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  { days: 0, en: "Today", hi: "आज", pa: "ਅੱਜ" },
  { days: 1, en: "Tomorrow", hi: "कल", pa: "ਕੱਲ੍ਹ" },
  { days: 3, en: "+3 Days", hi: "+3 दिन", pa: "+3 ਦਿਨ" },
  { days: 7, en: "+1 Week", hi: "1 हफ़्ता", pa: "1 ਹਫ਼ਤਾ" },
  { days: 10, en: "+10 Days", hi: "+10 दिन", pa: "+10 ਦਿਨ" },
  { days: 14, en: "+2 Weeks", hi: "2 हफ़्ते", pa: "2 ਹਫ਼ਤੇ" },
];

function parseDateValue(val: string): Date | null {
  if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return null;
  const [y, m, d] = val.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatDateToISO(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDiffInDays(target: Date, base: Date): number {
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const t2 = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  placeholder,
  minDate,
  showPresets = true,
  className = "",
  allowClear = true,
}: DatePickerProps) {
  const { currentLanguage } = useWorkerTranslation();
  const lang = currentLanguage === "hi" || currentLanguage === "pa" ? currentLanguage : "en";

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const today = useMemo(() => getStartOfToday(), []);
  const minDateObj = useMemo(() => (minDate ? parseDateValue(minDate) : null), [minDate]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() =>
    selectedDate ? selectedDate.getFullYear() : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    selectedDate ? selectedDate.getMonth() : today.getMonth(),
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openAbove: boolean;
  }>({ top: 0, left: 0, openAbove: false });

  // Sync calendar view month/year when external value changes
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Compute position when opening
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 340;
    const popoverHeight = showPresets ? 430 : 370;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    const top = openAbove ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    setCoords({ top, left, openAbove });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, showPresets]);

  // Generate 42 calendar grid cells (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      date: Date;
      iso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
      isSunday: boolean;
    }> = [];

    // Previous month overflow days
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dt = new Date(viewYear, viewMonth - 1, d);
      const iso = formatDateToISO(dt);
      cells.push({
        date: dt,
        iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: getDiffInDays(dt, today) === 0,
        isSelected: value === iso,
        isDisabled: minDateObj ? getDiffInDays(dt, minDateObj) < 0 : false,
        isSunday: dt.getDay() === 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      const iso = formatDateToISO(dt);
      cells.push({
        date: dt,
        iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: getDiffInDays(dt, today) === 0,
        isSelected: value === iso,
        isDisabled: minDateObj ? getDiffInDays(dt, minDateObj) < 0 : false,
        isSunday: dt.getDay() === 0,
      });
    }

    // Next month overflow days to fill 42 cells
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(viewYear, viewMonth + 1, d);
      const iso = formatDateToISO(dt);
      cells.push({
        date: dt,
        iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: getDiffInDays(dt, today) === 0,
        isSelected: value === iso,
        isDisabled: minDateObj ? getDiffInDays(dt, minDateObj) < 0 : false,
        isSunday: dt.getDay() === 0,
      });
    }

    return cells;
  }, [viewYear, viewMonth, value, today, minDateObj]);

  const handleSelectDate = (dt: Date) => {
    if (minDateObj && getDiffInDays(dt, minDateObj) < 0) return;
    onChange(formatDateToISO(dt));
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
    setOpen(false);
  };

  const handlePresetClick = (daysFromToday: number) => {
    const target = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + daysFromToday,
    );
    handleSelectDate(target);
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Relative badge text (e.g. "Today", "Tomorrow", "In 5 days")
  const getRelativeLabel = (dt: Date | null): string | null => {
    if (!dt) return null;
    const diff = getDiffInDays(dt, today);
    if (diff === 0) {
      return lang === "hi" ? "आज" : lang === "pa" ? "ਅੱਜ" : "Today";
    }
    if (diff === 1) {
      return lang === "hi" ? "कल" : lang === "pa" ? "ਕੱਲ੍ਹ" : "Tomorrow";
    }
    if (diff === -1) {
      return lang === "hi" ? "बीता कल" : lang === "pa" ? "ਬੀਤਿਆ ਕੱਲ੍ਹ" : "Yesterday";
    }
    if (diff > 1) {
      return lang === "hi"
        ? `${diff} दिन बाद`
        : lang === "pa"
          ? `${diff} ਦਿਨ ਬਾਅਦ`
          : `In ${diff} days`;
    }
    const abs = Math.abs(diff);
    return lang === "hi"
      ? `${abs} दिन पहले`
      : lang === "pa"
        ? `${abs} ਦਿਨ ਪਹਿਲਾਂ`
        : `${abs}d ago`;
  };

  const months = MONTHS_I18N[lang] ?? MONTHS_I18N.en;
  const shortMonths = SHORT_MONTHS_I18N[lang] ?? SHORT_MONTHS_I18N.en;
  const weekdaysShort = WEEKDAYS_SHORT_I18N[lang] ?? WEEKDAYS_SHORT_I18N.en;
  const weekdaysFull = WEEKDAYS_FULL_I18N[lang] ?? WEEKDAYS_FULL_I18N.en;

  const formattedDisplay = useMemo(() => {
    if (!selectedDate) return null;
    const d = selectedDate.getDate();
    const m = shortMonths[selectedDate.getMonth()];
    const y = selectedDate.getFullYear();
    const dayName = weekdaysFull[selectedDate.getDay()];
    return {
      main: `${d} ${m} ${y}`,
      dayName,
      relative: getRelativeLabel(selectedDate),
    };
  }, [selectedDate, lang]);

  const defaultPlaceholder =
    placeholder ||
    (lang === "hi"
      ? "तारीख चुनें (Select Date)"
      : lang === "pa"
        ? "ਤਾਰੀਖ ਚੁਣੋ (Select Date)"
        : "Select date");

  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    const arr: number[] = [];
    for (let y = base - 3; y <= base + 5; y++) {
      arr.push(y);
    }
    return arr;
  }, [today]);

  return (
    <div className={`relative w-full ${className}`} data-no-translate>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "group flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-xl border bg-background px-3 py-1.5 text-left text-sm transition-all duration-200",
          open
            ? "border-primary ring-3 ring-primary/15 shadow-sm"
            : "border-input hover:border-primary/60 hover:bg-accent/30",
          disabled && "cursor-not-allowed opacity-60",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={[
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              selectedDate
                ? "bg-primary/12 text-primary"
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            ].join(" ")}
          >
            <CalendarIcon className="h-4 w-4" />
          </div>

          {formattedDisplay ? (
            <div className="flex min-w-0 flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-foreground">
                  {formattedDisplay.main}
                </span>
                {formattedDisplay.relative && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                    {formattedDisplay.relative}
                  </span>
                )}
              </div>
              <span className="truncate text-[11px] text-muted-foreground">
                {formattedDisplay.dayName}
              </span>
            </div>
          ) : (
            <span className="truncate text-muted-foreground">
              {defaultPlaceholder}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {allowClear && selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 transition hover:bg-destructive/15 hover:text-destructive"
              title="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Portal Calendar Popover */}
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            data-no-translate
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: "340px",
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Top Gradient Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 text-white">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  {lang === "hi"
                    ? "डिलीवरी / ऑर्डर तारीख"
                    : lang === "pa"
                      ? "ਡਿਲੀਵਰੀ / ਆਰਡਰ ਤਾਰੀਖ"
                      : "Selected Date"}
                </span>
                {formattedDisplay?.relative && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    <Clock className="h-2.5 w-2.5" />
                    {formattedDisplay.relative}
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-base font-bold tracking-tight">
                  {selectedDate
                    ? `${selectedDate.getDate()} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                    : lang === "hi"
                      ? "कोई तारीख नहीं चुनी गई"
                      : lang === "pa"
                        ? "ਕੋਈ ਤਾਰੀਖ ਨਹੀਂ ਚੁਣੀ ਗਈ"
                        : "No date selected"}
                </div>
                {selectedDate && (
                  <span className="text-xs font-medium text-slate-300">
                    {weekdaysFull[selectedDate.getDay()]}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Workshop Presets */}
            {showPresets && (
              <div className="border-b border-border/60 bg-muted/35 px-3 py-2">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "hi"
                    ? "जल्दी चुनें (Quick Select)"
                    : lang === "pa"
                      ? "ਜਲਦੀ ਚੁਣੋ (Quick Select)"
                      : "Quick Delivery Presets"}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_PRESETS.map((preset) => {
                    const targetDate = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate() + preset.days,
                    );
                    const isPresetSelected =
                      value === formatDateToISO(targetDate);

                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handlePresetClick(preset.days)}
                        className={[
                          "flex items-center justify-center rounded-lg border px-2 py-1 text-[11px] font-medium transition-all",
                          isPresetSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "border-border/70 bg-background text-foreground hover:border-primary/50 hover:bg-primary/8 hover:text-primary",
                        ].join(" ")}
                      >
                        {lang === "hi"
                          ? preset.hi
                          : lang === "pa"
                            ? preset.pa
                            : preset.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Month & Year Navigation Bar */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground transition hover:border-primary/40 hover:bg-accent"
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="cursor-pointer rounded-lg border border-border/60 bg-background px-2 py-1 text-xs font-bold text-foreground outline-none hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="cursor-pointer rounded-lg border border-border/60 bg-background px-2 py-1 text-xs font-bold text-foreground outline-none hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground transition hover:border-primary/40 hover:bg-accent"
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 px-3 pb-1 text-center">
              {weekdaysShort.map((day, i) => (
                <div
                  key={day}
                  className={[
                    "py-1 text-[11px] font-bold uppercase tracking-wider",
                    i === 0 ? "text-rose-500" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 6-Week x 7-Day Grid */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
              {calendarDays.map((cell) => {
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => handleSelectDate(cell.date)}
                    className={[
                      "relative flex h-9 w-full flex-col items-center justify-center rounded-xl text-xs font-medium transition-all duration-150",
                      cell.isSelected
                        ? "bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25 scale-105 z-10"
                        : cell.isToday
                          ? "border border-primary/60 bg-primary/10 font-bold text-primary"
                          : cell.isCurrentMonth
                            ? cell.isSunday
                              ? "text-rose-600 hover:bg-rose-500/10"
                              : "text-foreground hover:bg-primary/10 hover:text-primary"
                            : "text-muted-foreground/35 hover:bg-muted/60 hover:text-muted-foreground",
                      cell.isDisabled &&
                        "cursor-not-allowed opacity-25 hover:bg-transparent",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span>{cell.dayNumber}</span>
                    {cell.isToday && !cell.isSelected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3.5 py-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                {lang === "hi"
                  ? "साफ़ करें (Clear)"
                  : lang === "pa"
                    ? "ਸਾਫ਼ ਕਰੋ (Clear)"
                    : "Clear"}
              </button>

              <button
                type="button"
                onClick={() => handleSelectDate(today)}
                className="rounded-lg bg-primary/12 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                {lang === "hi"
                  ? "आज की तारीख (Today)"
                  : lang === "pa"
                    ? "ਅੱਜ ਦੀ ਤਾਰੀਖ (Today)"
                    : "Today"}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
