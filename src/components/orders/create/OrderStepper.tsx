import { Check } from "lucide-react";

const STEPS = [
  { label: "Customer", hindi: "ग्राहक" },
  { label: "Fabric & Garments", hindi: "कपड़ा व परिधान" },
  { label: "Measurements", hindi: "नाप" },
  { label: "Billing & Advance", hindi: "बिल व जमा" },
  { label: "Confirm", hindi: "पुष्टि" },
] as const;

interface OrderStepperProps {
  currentStep: number;
}

export function OrderStepper({ currentStep }: OrderStepperProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1">
      <div className="flex min-w-[680px] items-center justify-between rounded-2xl border border-border/80 bg-card/90 p-3 shadow-xs backdrop-blur-md">
        {STEPS.map((step, index) => {
          const number = index + 1;
          const completed = currentStep > number;
          const active = currentStep === number;

          return (
            <div key={step.label} className="flex flex-1 items-center">
              <div
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all ${
                  active
                    ? "bg-primary/10 shadow-xs ring-1 ring-primary/25"
                    : ""
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    completed
                      ? "bg-primary text-primary-foreground shadow-xs shadow-primary/30"
                      : active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-2 ring-primary/20"
                      : "border border-border/80 bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {completed ? <Check className="size-4 stroke-[2.5]" /> : number}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`whitespace-nowrap text-xs sm:text-[13px] font-semibold leading-tight ${
                      active
                        ? "text-primary"
                        : completed
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/75 leading-tight">
                    {step.hindi}
                  </span>
                </div>
              </div>

              {number < STEPS.length && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                    completed ? "bg-primary" : "bg-border/70"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

