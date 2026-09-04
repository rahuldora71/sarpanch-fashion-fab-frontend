import { Skeleton } from "@/components/ui/skeleton";

const rows = Array.from({ length: 6 });

export function OrderTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="
          grid
          grid-cols-[1.15fr_1.55fr_0.8fr_0.9fr_0.75fr_0.85fr_0.95fr_1.15fr]
          gap-4
          bg-muted/50
          px-5
          py-3
        "
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-3 w-16"
          />
        ))}
      </div>

      {rows.map((_, index) => (
        <div
          key={index}
          className="
            grid
            grid-cols-[1.15fr_1.55fr_0.8fr_0.9fr_0.75fr_0.85fr_0.95fr_1.15fr]
            items-center
            gap-4
            border-t
            border-border
            px-5
            py-4
          "
        >
          {Array.from({ length: 8 }).map(
            (_, column) => (
              <Skeleton
                key={column}
                className="h-4 w-full max-w-24"
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}