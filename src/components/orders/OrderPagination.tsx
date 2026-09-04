import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface OrderPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function OrderPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: OrderPaginationProps) {
  if (totalElements === 0) {
    return null;
  }

  const start = page * pageSize + 1;
  const end = Math.min(
    (page + 1) * pageSize,
    totalElements,
  );

  return (
    <div
      className="
        flex
        items-center
        justify-between
        border-t
        border-border
        pt-4
      "
    >
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {start}
        </span>{" "}
        to{" "}
        <span className="font-medium text-foreground">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {totalElements}
        </span>{" "}
        orders
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="default"
          size="sm"
          className="min-w-8"
        >
          {page + 1}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}