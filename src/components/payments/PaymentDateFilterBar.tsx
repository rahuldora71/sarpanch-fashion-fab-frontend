import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DatePreset = "today" | "yesterday" | "last7" | "thisMonth" | "custom" | "all";

export interface PaymentDateFilterBarProps {
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  onSelectPreset: (preset: DatePreset) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}

export default function PaymentDateFilterBar({
  datePreset,
  startDate,
  endDate,
  onSelectPreset,
  onStartDateChange,
  onEndDateChange,
}: PaymentDateFilterBarProps) {
  return (
    <Card className="p-3 bg-muted/30 border-border/80 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Date Filter:
          </span>
          <Button
            variant={datePreset === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("today")}
            className="h-8 text-xs rounded-full px-3"
          >
            Today
          </Button>
          <Button
            variant={datePreset === "yesterday" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("yesterday")}
            className="h-8 text-xs rounded-full px-3"
          >
            Yesterday
          </Button>
          <Button
            variant={datePreset === "last7" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("last7")}
            className="h-8 text-xs rounded-full px-3"
          >
            Last 7 Days
          </Button>
          <Button
            variant={datePreset === "thisMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("thisMonth")}
            className="h-8 text-xs rounded-full px-3"
          >
            This Month
          </Button>
          <Button
            variant={datePreset === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("all")}
            className="h-8 text-xs rounded-full px-3"
          >
            All Time
          </Button>
          <Button
            variant={datePreset === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectPreset("custom")}
            className="h-8 text-xs rounded-full px-3"
          >
            Custom Range
          </Button>
        </div>

        {datePreset === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
