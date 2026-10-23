import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateOrderNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
  backLabel?: string;
  nextLabel?: string;
}

export function CreateOrderNavigation({
  onBack,
  onNext,
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  backLabel = "Back (पीछे)",
  nextLabel = "Next Step (आगे बढ़ें)",
}: CreateOrderNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/80 pt-6 mt-6">
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 px-5 rounded-xl border-border/80 font-medium text-sm gap-2 hover:bg-accent active:scale-98 transition"
        >
          <ChevronLeft className="size-4" />
          <span>{backLabel}</span>
        </Button>
      ) : (
        <div />
      )}

      <Button
        type="button"
        disabled={nextDisabled || nextLoading}
        onClick={onNext}
        className="h-12 px-6 rounded-xl font-semibold text-sm gap-2 bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 active:scale-98 transition disabled:opacity-50"
      >
        {nextLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            <ChevronRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}

