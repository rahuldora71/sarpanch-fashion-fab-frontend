import { Plus, Ruler, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { useMeasurementFields } from "@/hooks/useMeasurementFields";

import type {
  CustomerProfileMeasurement,
} from "@/models/Customer";

interface Props {
  measurements: CustomerProfileMeasurement[];
  onNewMeasurement: () => void;
}

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerMeasurementsTab({
  measurements,
  onNewMeasurement,
}: Props) {
  /* =======================================================
     MEASUREMENT FIELD DEFINITIONS

     Backend stores measurement values using field IDs.

     Example:

       {
         "1": 15,
         "4": 30,
         "6": 26
       }

     The /fields endpoint gives us:

       1 → Chest
       4 → Shoulder
       6 → Waist

     fieldMap allows us to convert the IDs into
     human-readable field names.
  ======================================================= */

  const { getFieldName, loading: loadingFields } = useMeasurementFields();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-4">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {measurements.length} measurement{" "}
            {measurements.length === 1
              ? "record"
              : "records"}{" "}
            — never overwritten
          </p>
        </div>

        <Button
          type="button"
          onClick={onNewMeasurement}
          className="w-full bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Measurement
        </Button>
      </div>

      {/* =================================================
          LOADING FIELD DEFINITIONS
      ================================================= */}

      {loadingFields && measurements.length > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading measurement fields...
        </div>
      ) : null}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {measurements.length === 0 ? (
        <Card className="border-border bg-card shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Ruler className="h-6 w-6 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium text-foreground">
              No measurement history found
            </p>

            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Create a new measurement to keep
              track of this customer's measurement
              history.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={onNewMeasurement}
              className="mt-5"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Measurement
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* =================================================
           MEASUREMENT HISTORY
        ================================================= */

        <div className="space-y-3">
          {measurements.map(
            (measurement, index) => (
              <Card
                key={measurement.measurementId}
                className="border-border bg-card shadow-none transition-colors hover:bg-muted/20"
              >
                <CardContent className="p-4 sm:p-5">
                  {/* =====================================
                      MEASUREMENT HEADER
                  ===================================== */}

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-orange-600 dark:text-orange-400">
                        M-
                        {String(
                          measurement.measurementId,
                        ).padStart(5, "0")}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(
                          measurement.measuredAt,
                        )}{" "}
                        ·{" "}
                        <span className="text-foreground">
                          {measurement.serviceName}
                        </span>
                      </p>
                    </div>

                    {/* =================================
                        LATEST BADGE
                    ================================= */}

                    {index === 0 ? (
                      <span className="shrink-0 rounded-full border border-emerald-300/50 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400">
                        Latest
                      </span>
                    ) : null}
                  </div>

                  {/* =====================================
                      MEASUREMENT FIELDS
                  ===================================== */}

                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
                    {Object.entries(
                      measurement.measurementFields ??
                        {},
                    ).map(
                      ([fieldId, value]) => {
                        const fieldName =
                          getFieldName(fieldId);

                        return (
                          <div
                            key={fieldId}
                            className="min-w-0"
                          >
                            {/* FIELD NAME */}

                            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {fieldName}
                            </p>

                            {/* FIELD VALUE */}

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {String(value)}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* =====================================
                      NO FIELD VALUES
                  ===================================== */}

                  {Object.keys(
                    measurement.measurementFields ??
                      {},
                  ).length === 0 ? (
                    <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No measurement values recorded.
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}