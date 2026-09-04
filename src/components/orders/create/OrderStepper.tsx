import { Check } from "lucide-react";

const STEPS = [
  "Customer",
  "Fabric & Garments",
  "Measurements",
  "Billing",
  "Confirm",
] as const;

interface OrderStepperProps {
  currentStep: number;
}

export function OrderStepper({ currentStep }: OrderStepperProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex min-w-[620px] items-center">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const completed = currentStep > number;
          const active = currentStep === number;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                    completed || active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {completed ? <Check className="h-4 w-4" /> : number}
                </div>

                <span
                  className={[
                    "whitespace-nowrap text-xs sm:text-sm",
                    active || completed
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>

              {number < STEPS.length && (
                <div
                  className={[
                    "mx-3 h-px flex-1",
                    completed ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
