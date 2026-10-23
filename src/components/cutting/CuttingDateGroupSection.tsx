import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CuttingQueueCard from "./CuttingQueueCard";
import type { CuttingDateGroup } from "@/types/cutting";

interface Props {
  dateGroup: CuttingDateGroup;
  onOpenWorkspace: (orderId: number) => void;
}

/**
 * Groups all orders/garments under one delivery date header.
 */
export default function CuttingDateGroupSection({ dateGroup, onOpenWorkspace }: Props) {
  const borderColor = dateGroup.isOverdue
    ? "border-red-400"
    : dateGroup.isToday
    ? "border-blue-500"
    : "border-gray-200";

  const headerBg = dateGroup.isOverdue
    ? "bg-red-50 text-red-800"
    : dateGroup.isToday
    ? "bg-blue-50 text-blue-800"
    : dateGroup.isTomorrow
    ? "bg-amber-50 text-amber-800"
    : "bg-gray-50 text-gray-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* DATE HEADER */}
      <div className={`flex items-center justify-between rounded-lg px-4 py-3 border ${borderColor} ${headerBg}`}>
        <div className="flex items-center gap-2">
          {dateGroup.isOverdue ? (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          ) : dateGroup.isToday ? (
            <Clock className="w-4 h-4 text-blue-600" />
          ) : (
            <CalendarDays className="w-4 h-4" />
          )}
          <span className="font-semibold text-sm">{dateGroup.dueDateLabel}</span>
        </div>
        <Badge variant="outline" className={`text-xs ${headerBg} border-current`}>
          {dateGroup.garmentCount} garment{dateGroup.garmentCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* ORDER CARDS under this date */}
      <AnimatePresence mode="popLayout">
        <div className="pl-2 space-y-3">
          {dateGroup.orders.map((orderGroup) => (
            <CuttingQueueCard
              key={orderGroup.orderId}
              orderGroup={orderGroup}
              onOpenWorkspace={onOpenWorkspace}
            />
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
