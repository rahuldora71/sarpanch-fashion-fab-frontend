import { ChevronLeft, ChevronRight } from "lucide-react";
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
  backLabel = "Back",
  nextLabel = "Next",
}: CreateOrderNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t pt-5">
      {showBack ? (
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      <Button
        type="button"
        disabled={nextDisabled || nextLoading}
        onClick={onNext}
      >
        {nextLoading ? "Creating..." : nextLabel}
        {!nextLoading && <ChevronRight className="ml-1 h-4 w-4" />}
      </Button>
    </div>
  );
}
