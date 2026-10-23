import { Badge } from "@/components/ui/badge";
import { garmentStatusLabel, garmentStatusColor } from "@/utils/productionUtils";
import type { GarmentStatus } from "@/types/cutting";
import { useWorkerTranslation } from "@/i18n/WorkerLanguageSynchronizer";

interface Props {
  status: GarmentStatus;
  className?: string;
}

/**
 * Renders a consistent garment production status badge.
 */
export default function GarmentStatusBadge({ status, className = "" }: Props) {
  const { t } = useWorkerTranslation();
  const label = garmentStatusLabel[status] ?? status;
  const translated = t(status, t(label, label));

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium border ${garmentStatusColor[status]} ${className}`}
    >
      {translated}
    </Badge>
  );
}
