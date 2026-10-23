import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CustomerProfileAlteration } from "@/models/Customer";

interface Props {
  alterations: CustomerProfileAlteration[];
  customerId?: number;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const humanize = (value: string | null | undefined) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join(" ")
    : "—";

export default function CustomerAlterationsTab({
  alterations,
  customerId,
}: Props) {
  const navigate = useNavigate();

  const handleNewAlteration = () => {
    if (customerId) {
      navigate(`/alterations?customerId=${customerId}`);
    } else {
      navigate("/alterations");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Alteration History</h3>
          <p className="text-xs text-muted-foreground">
            Manage and log garment alterations and fit modifications for this customer
          </p>
        </div>
        <Button
          onClick={handleNewAlteration}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Scissors className="h-4 w-4" />
          New Alteration
        </Button>
      </div>

      {alterations.length === 0 ? (
        <Card className="border-border bg-card shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <p>No alterations found for this customer.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewAlteration}
              className="mt-3 gap-1.5"
            >
              <Scissors className="h-4 w-4 text-primary" />
              Create First Alteration
            </Button>
          </CardContent>
        </Card>
      ) : (
        alterations.map((alteration) => (
          <Card
            key={alteration.id}
            className="border-border bg-card shadow-none"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {alteration.alterationNumber}
                  </p>

                  <p className="mt-2 text-sm font-medium text-foreground">
                    {alteration.description}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Order #{alteration.orderId} ·{" "}
                    {formatDate(alteration.createdAt)}
                  </p>
                </div>

                <span className="shrink-0 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                  {humanize(alteration.status)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}