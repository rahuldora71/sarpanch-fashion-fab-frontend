import { useState, useRef, useEffect } from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useWorkerTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const activeLang =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage) ??
    SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef} data-no-translate>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border/80 px-2.5 text-xs font-medium transition hover:bg-accent"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-semibold">{activeLang.shortLabel}</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Select Language / भाषा चुनें
          </div>

          <div className="space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{lang.nativeName}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {lang.label}
                    </span>
                  </div>

                  {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 border-t border-border/60 px-2.5 pt-1.5 text-[10px] text-muted-foreground">
            कारीगरों और टेलर के लिए सरल बोलचाल की भाषा
          </div>
        </div>
      )}
    </div>
  );
}
