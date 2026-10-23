import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Scissors, CalendarDays, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { CuttingOrderGroup } from "@/types/cutting";
import { isDueDateOverdue } from "@/utils/productionUtils";

interface Props {
  orderGroup: CuttingOrderGroup;
  onOpenWorkspace: (orderId: number) => void;
}

/**
 * One card representing an order in the Cutting Queue.
 * Shows: customer info, garment count, garment list with due dates.
 * Clicking opens the Cutting Workspace.
 */
export default function CuttingQueueCard({ orderGroup, onOpenWorkspace }: Props) {
  const hasOverdue = orderGroup.garments.some((g) => isDueDateOverdue(g.dueDate));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -1 }}
    >
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md border ${
          hasOverdue ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
        }`}
        onClick={() => onOpenWorkspace(orderGroup.orderId)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {/* Customer + Order info */}
            <div className="flex items-center gap-3">
              {/* Avatar initials */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-sm">
                  {orderGroup.customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">{orderGroup.customer.name}</p>
                <p className="text-xs text-gray-500">{orderGroup.customer.phone}</p>
              </div>
            </div>

            {/* Right: order number + open arrow */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  Order #{orderGroup.orderId}
                </p>
                {orderGroup.sampleBookPageNumber && (
                  <p className="text-xs text-gray-400">
                    Sample: {orderGroup.sampleBookPageNumber}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Garment count */}
          <div className="flex items-center gap-2 mt-2">
            <Scissors className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              {orderGroup.garmentCount}{" "}
              {orderGroup.garmentCount === 1 ? "garment" : "garments"} pending cutting
            </span>
            {hasOverdue && (
              <Badge variant="destructive" className="text-xs ml-auto">
                <AlertTriangle className="w-3 h-3 mr-1 inline" />
                Overdue
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Garment list */}
          <div className="space-y-1.5 mt-1">
            {orderGroup.garments.map((garment) => {
              const overdue = isDueDateOverdue(garment.dueDate);
              return (
                <div
                  key={garment.garmentId}
                  className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                    overdue ? "bg-red-100 text-red-800" : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{garment.serviceName}</span>
                    {garment.cuttingAddOns.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-300 text-orange-700 bg-orange-50">
                        {garment.cuttingAddOns.length} cut req
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    <span className={overdue ? "text-red-600 font-semibold" : ""}>
                      {garment.dueDate
                        ? format(parseISO(garment.dueDate), "d MMM")
                        : "No date"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Open workspace button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorkspace(orderGroup.orderId);
            }}
          >
            Open Cutting Workspace
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
