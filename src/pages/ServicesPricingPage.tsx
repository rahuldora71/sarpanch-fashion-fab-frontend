import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";
import {
  Settings2,
} from "lucide-react";
import {
  MeasurementFieldManagerDialog,
} from "@/components/services/MeasurementFieldManagerDialog";
import {
  ServiceRow,
} from "@/components/services/ServiceRow";

import {
  AddServiceDialog,
} from "@/components/services/AddServiceDialog";

import {
  EditServiceDialog,
} from "@/components/services/EditServiceDialog";

import {
  getServices,
  searchServices,
  updateServiceStatus,
} from "@/services/serviceService";

import type {
  Service,
} from "@/types/service";


// =========================================================
// CONSTANTS
// =========================================================

const PAGE_SIZE = 50;


// =========================================================
// PAGE
// =========================================================

export default function ServicesPricingPage() {
  // -------------------------------------------------------
  // SERVICES
  // -------------------------------------------------------

  const [services, setServices] =
    useState<Service[]>([]);

  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  const [search, setSearch] =
    useState("");

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  const [loading, setLoading] =
    useState(true);

  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  const [error, setError] =
    useState<string | null>(null);

  // -------------------------------------------------------
  // ADD DIALOG
  // -------------------------------------------------------

  const [addOpen, setAddOpen] =
    useState(false);

  // -------------------------------------------------------
  // EDIT DIALOG
  // -------------------------------------------------------

  const [
    editingService,
    setEditingService,
  ] = useState<Service | null>(null);

  const [
    editOpen,
    setEditOpen,
  ] = useState(false);


  // =======================================================
  // LOAD SERVICES
  // =======================================================

  const loadServices =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const keyword =
          search.trim();

        /*
         * Your serviceService.ts uses:
         *
         * getServices(
         *   page,
         *   size,
         *   sort
         * )
         *
         * and:
         *
         * searchServices(
         *   keyword,
         *   page,
         *   size,
         *   sort
         * )
         */

        const response = keyword
          ? await searchServices(
            keyword,
            0,
            PAGE_SIZE,
          )
          : await getServices(
            0,
            PAGE_SIZE,
          );

        setServices(
          response.content ?? [],
        );
      } catch (err) {
        console.error(
          "Unable to load services:",
          err,
        );

        setError(
          "Unable to load services.",
        );
      } finally {
        setLoading(false);
      }
    }, [search]);
  const [
    measurementFieldManagerOpen,
    setMeasurementFieldManagerOpen,
  ] = useState(false);

  // =======================================================
  // SEARCH DEBOUNCE
  // =======================================================

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          loadServices();
        },
        search.trim()
          ? 350
          : 0,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    loadServices,
    search,
  ]);


  // =======================================================
  // DYNAMIC CATEGORIES
  // =======================================================

  const categories =
    useMemo(() => {
      return Array.from(
        new Set(
          services
            .map(
              (service) =>
                service.category,
            )
            .filter(Boolean),
        ),
      ).sort((a, b) =>
        a.localeCompare(b),
      );
    }, [services]);


  // =======================================================
  // GROUP SERVICES BY CATEGORY
  // =======================================================

  const groupedServices =
    useMemo(() => {
      const groups =
        new Map<
          string,
          Service[]
        >();

      for (const service of services) {
        const category =
          service.category?.trim() ||
          "Uncategorized";

        const existing =
          groups.get(category) ??
          [];

        existing.push(service);

        groups.set(
          category,
          existing,
        );
      }

      return Array.from(
        groups.entries(),
      );
    }, [services]);


  // =======================================================
  // SERVICE CREATED
  // =======================================================

  const handleCreated = (
    service: Service,
  ) => {
    setServices(
      (previous) => [
        service,
        ...previous,
      ],
    );
  };


  // =======================================================
  // SERVICE UPDATED
  // =======================================================

  const handleUpdated = (
    service: Service,
  ) => {
    setServices(
      (previous) =>
        previous.map(
          (item) =>
            item.id === service.id
              ? service
              : item,
        ),
    );
  };


  // =======================================================
  // EDIT SERVICE
  // =======================================================

  const handleEdit = (
    service: Service,
  ) => {
    setEditingService(service);
    setEditOpen(true);
  };


  // =======================================================
  // CHANGE SERVICE STATUS
  // =======================================================

  const handleStatusChange =
    async (
      service: Service,
    ) => {
      try {
        setError(null);

        const updated =
          await updateServiceStatus(
            service.id,
            !service.active,
          );

        handleUpdated(updated);
      } catch (err) {
        console.error(
          "Unable to update service status:",
          err,
        );

        setError(
          `Unable to ${service.active
            ? "deactivate"
            : "activate"
          } service.`,
        );
      }
    };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main className="min-h-full bg-background text-foreground">

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-7">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Services & Pricing
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage tailoring services,
              prices, commissions and
              measurements.
            </p>
          </div>

          <div
            className="
    flex
    flex-col
    gap-2
    sm:flex-row
  "
          >

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setMeasurementFieldManagerOpen(
                  true,
                )
              }
            >
              <Settings2 className="mr-1.5 h-4 w-4" />

              Measurement Fields
            </Button>


            <Button
              type="button"
              size="sm"
              onClick={() =>
                setAddOpen(true)
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />

              Add Service
            </Button>

          </div>

        </div>


        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="relative mb-6">

          <Search
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search services..."
            className="pl-9"
          />

        </div>


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">

            <span>
              {error}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() =>
                loadServices()
              }
            >
              Retry
            </Button>

          </div>
        )}


        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">

            <p className="text-sm text-muted-foreground">
              Loading services...
            </p>

          </div>
        )}


        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {!loading &&
          !groupedServices.length && (
            <div className="rounded-lg border border-border bg-card p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="mt-4 text-sm font-medium">
                No services found
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {search.trim()
                  ? "Try another search."
                  : "Add your first service to get started."}
              </p>

              {!search.trim() && (
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    setAddOpen(true)
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />

                  Add Service
                </Button>
              )}

            </div>
          )}


        {/* ================================================= */}
        {/* SERVICES */}
        {/* ================================================= */}

        {!loading &&
          groupedServices.map(
            ([
              category,
              categoryServices,
            ]) => (
              <section
                key={category}
                className="mb-6"
              >

                {/* Category heading */}

                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h2>

                  <span className="text-xs text-muted-foreground">
                    {categoryServices.length}{" "}
                    {categoryServices.length ===
                      1
                      ? "service"
                      : "services"}
                  </span>
                </div>


                {/* Service list */}

                <div className="overflow-hidden rounded-lg border border-border bg-card">

                  {categoryServices.map(
                    (service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        onEdit={
                          handleEdit
                        }
                        onStatusChange={
                          handleStatusChange
                        }
                      />
                    ),
                  )}

                </div>

              </section>
            ),
          )}

      </div>


      {/* ================================================= */}
      {/* ADD SERVICE DIALOG */}
      {/* ================================================= */}

      <AddServiceDialog
        open={addOpen}
        onOpenChange={
          setAddOpen
        }
        categories={categories}
        onCreated={
          handleCreated
        }
      />


      {/* ================================================= */}
      {/* EDIT SERVICE DIALOG */}
      {/* ================================================= */}

      <EditServiceDialog
        open={editOpen}
        service={
          editingService
        }
        categories={categories}
        onOpenChange={
          (open) => {
            setEditOpen(open);

            /*
             * Clear selected service when
             * edit dialog is closed.
             */
            if (!open) {
              setEditingService(
                null,
              );
            }
          }
        }
        onUpdated={
          handleUpdated
        }

      />
      <MeasurementFieldManagerDialog
        open={
          measurementFieldManagerOpen
        }
        onOpenChange={
          setMeasurementFieldManagerOpen
        }
      />
    </main>
  );
}