import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Factory, Settings, CalendarCheck2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductionCalendar from "@/components/production/ProductionCalendar";

/**
 * Production Calendar Page.
 * Redesigned for shadcn Dark & Light themes.
 * Date Management (Blocked Dates & Holidays) now lives inside Settings (/settings).
 */
export default function ProductionCalendarPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* PAGE HEADER */}
      <div className="px-4 md:px-6 pt-6 pb-5 border-b border-border bg-card/60 backdrop-blur-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-600/20">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                  Production Calendar & Order Progress
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <CalendarCheck2 className="w-3 h-3" /> Live Stage Tracking
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Track order-by-order dominant production phase (Cutting vs Stitching vs Ironing) & strict all-garment delivery completion
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/workers")}
              className="gap-2 rounded-xl shadow-xs"
            >
              <UsersRound className="w-4 h-4" />
              <span>Workers & Capacity</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings")}
              className="gap-2 rounded-xl border-border bg-background hover:bg-accent text-foreground"
            >
              <Settings className="w-4 h-4 text-primary" />
              <span>Date & Holiday Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-[1600px] mx-auto"
        >
          <ProductionCalendar />
        </motion.div>
      </div>
    </div>
  );
}
