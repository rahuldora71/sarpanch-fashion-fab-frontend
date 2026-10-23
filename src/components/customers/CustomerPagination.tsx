import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  CustomerPageResponse,
} from "@/models/Customer";

interface Props {
  pageData: CustomerPageResponse;
  page: number;
  onPageChange: (page: number) => void;
}

export default function CustomerPagination({
  pageData,
  page,
  onPageChange,
}: Props) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {pageData.numberOfElements} of{" "}
        {pageData.totalElements} customers
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pageData.first}
          onClick={() =>
            onPageChange(page - 1)
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="min-w-20 text-center text-xs text-muted-foreground">
          Page {page + 1} /{" "}
          {Math.max(pageData.totalPages, 1)}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pageData.last}
          onClick={() =>
            onPageChange(page + 1)
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}