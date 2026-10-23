import { Link } from "react-router-dom";
import {
  RefreshCw,
  Receipt,
  Wallet,
  Smartphone,
  CreditCard,
  Building2,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentTransaction } from "@/types/payment";
import type { PaymentMethod, PaymentType } from "@/types/order";

export interface PaymentTransactionsTableProps {
  transactions: PaymentTransaction[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
}

export function getMethodBadge(m: PaymentMethod) {
  switch (m) {
    case "CASH":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1 font-medium text-[11px]"
        >
          <Wallet className="h-3 w-3" /> Cash
        </Badge>
      );
    case "UPI":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 gap-1 font-medium text-[11px]"
        >
          <Smartphone className="h-3 w-3" /> UPI
        </Badge>
      );
    case "CARD":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 gap-1 font-medium text-[11px]"
        >
          <CreditCard className="h-3 w-3" /> Card
        </Badge>
      );
    case "BANK_TRANSFER":
      return (
        <Badge
          variant="outline"
          className="bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 gap-1 font-medium text-[11px]"
        >
          <Building2 className="h-3 w-3" /> Bank
        </Badge>
      );
    case "CHEQUE":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 gap-1 font-medium text-[11px]"
        >
          <FileCheck2 className="h-3 w-3" /> Cheque
        </Badge>
      );
    default:
      return <Badge variant="outline">{m}</Badge>;
  }
}

export function getTypeBadge(t: PaymentType) {
  switch (t) {
    case "ADVANCE":
      return (
        <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-300 text-[11px] font-medium">
          Advance
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300 text-[11px] font-medium">
          Partial
        </Badge>
      );
    case "FINAL":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 text-[11px] font-medium">
          Final
        </Badge>
      );
    default:
      return <Badge variant="secondary">{t}</Badge>;
  }
}

export default function PaymentTransactionsTable({
  transactions,
  totalElements,
  totalPages,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: PaymentTransactionsTableProps) {
  return (
    <Card className="overflow-hidden border-border/80">
      <CardContent className="p-0">
        {loading && (!transactions || transactions.length === 0) ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
            Loading payment transactions...
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Receipt className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              No payment transactions found
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your date range, search query, or payment method filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Collected By</th>
                  <th className="py-3 px-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((txn) => (
                  <tr
                    key={txn.paymentId}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-muted-foreground">
                      #{txn.paymentId}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-foreground block">
                        {txn.paidAt ? txn.paidAt.split("T")[0] : "-"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {txn.paidAt && txn.paidAt.includes("T")
                          ? txn.paidAt.split("T")[1]?.slice(0, 5)
                          : ""}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Link
                        to={`/orders?orderId=${txn.orderId}`}
                        className="font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        #{txn.orderId}
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">
                        {txn.customerName}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        {txn.customerCode && (
                          <span className="font-mono">{txn.customerCode}</span>
                        )}
                        {txn.customerPhone && <span>{txn.customerPhone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{Number(txn.amount).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getMethodBadge(txn.paymentMethod)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getTypeBadge(txn.paymentType)}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {txn.receivedByName || "Staff"}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {txn.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {totalPages > 1 && (
        <div className="py-3 px-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center gap-2">
            <span>
              Showing {page * pageSize + 1} to{" "}
              {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}{" "}
              payments
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
