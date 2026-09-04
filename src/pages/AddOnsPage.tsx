import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  MoreHorizontal,
  Pencil,
  Power,
  Search,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Skeleton,
} from "@/components/ui/skeleton";

import {
  Switch,
} from "@/components/ui/switch";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  toast,
} from "react-hot-toast";

import {
  getAddOns,
  searchAddOns,
  updateAddOnStatus,
  deleteAddOn,
} from "@/services/addOnService";

import {
  AddAddOnDialog,
} from "@/components/addons/AddAddOnDialog";

import {
  EditAddOnDialog,
} from "@/components/addons/EditAddOnDialog";

import type {
  AddOn,
} from "@/types/addon";

const PAGE_SIZE = 10;

export default function AddOnsPage() {
  const [addOns, setAddOns] =
    useState<AddOn[]>([]);

  const [page, setPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [totalElements, setTotalElements] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editOpen, setEditOpen] =
    useState(false);

  const loadAddOns =
    useCallback(
      async (
        requestedPage: number,
        keyword: string,
      ) => {
        try {
          setLoading(true);
          setError(null);

          const response =
            keyword.trim()
              ? await searchAddOns(
                keyword,
                requestedPage,
                PAGE_SIZE,
                "name,asc",
              )
              : await getAddOns(
                requestedPage,
                PAGE_SIZE,
                "name,asc",
              );

          setAddOns(
            response.content ?? [],
          );

          setPage(
            response.number ?? requestedPage,
          );

          setTotalPages(
            response.totalPages ?? 0,
          );

          setTotalElements(
            response.totalElements ?? 0,
          );
        } catch (err) {
          console.error(
            "Failed to load add-ons:",
            err,
          );

          setError(
            "Failed to load add-ons.",
          );

          setAddOns([]);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadAddOns(
          0,
          search,
        );
      }, 300);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [search, loadAddOns]);

  const refresh =
    () => {
      void loadAddOns(
        page,
        search,
      );
    };

  const handleStatusChange =
    async (
      addOn: AddOn,
      active: boolean,
    ) => {
      try {
        await updateAddOnStatus(
          addOn.id,
          active,
        );

        toast.success(
          active
            ? "Add-on activated"
            : "Add-on deactivated",
        );

        refresh();
      } catch (err) {
        console.error(
          err,
        );

        toast.error(
          "Failed to update add-on status",
        );
      }
    };

  const handleDelete =
    async (
      addOn: AddOn,
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${addOn.name}"?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteAddOn(
          addOn.id,
        );

        toast.success(
          "Add-on deleted",
        );

        const nextPage =
          addOns.length === 1 &&
            page > 0
            ? page - 1
            : page;

        void loadAddOns(
          nextPage,
          search,
        );
      } catch (err) {
        console.error(
          err,
        );

        toast.error(
          "Failed to delete add-on",
        );
      }
    };

  const handleEdit =
    (id: number) => {
      setEditingId(id);
      setEditOpen(true);
    };

  const handleEditOpenChange =
    (open: boolean) => {
      setEditOpen(open);

      if (!open) {
        setEditingId(null);
      }
    };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add-ons
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage optional customizations
            available with your tailoring
            services.
          </p>
        </div>

        <AddAddOnDialog
          onCreated={refresh}
        />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Add-ons
              {totalElements > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalElements})
                </span>
              )}
            </CardTitle>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Search add-ons..."
                className="pl-9"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <Skeleton className="h-16 w-16 rounded-lg" />

                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>

                    <Skeleton className="h-8 w-20" />
                  </div>
                ),
              )}
            </div>
          ) : error ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-destructive">
                {error}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={
                  refresh
                }
              >
                Try again
              </Button>
            </div>
          ) : addOns.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
              </div>

              <h3 className="font-medium">
                No add-ons found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try a different search."
                  : "Create your first add-on to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {addOns.map(
                  (addOn) => (
                    <div
                      key={addOn.id}
                      className="flex flex-col gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          {addOn.imageUrl ? (
                            <img
                              src={
                                addOn.imageUrl
                              }
                              alt={
                                addOn.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">
                              {
                                addOn.name
                              }
                            </h3>

                            <Badge
                              variant={
                                addOn.active
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {addOn.active
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </div>

                        

                          <p className="mt-1 font-medium">
                            ₹
                            {Number(
                              addOn.price,
                            ).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center justify-end gap-4">
                        <div className="hidden items-center gap-2 sm:flex">
                          <span className="text-sm text-muted-foreground">
                            {addOn.active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <Switch
                            checked={
                              addOn.active
                            }
                            onCheckedChange={(
                              checked,
                            ) =>
                              void handleStatusChange(
                                addOn,
                                checked,
                              )
                            }
                          />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-lg"
                                aria-label={`Actions for ${addOn.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleEdit(
                                  addOn.id,
                                )
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                void handleStatusChange(
                                  addOn,
                                  !addOn.active,
                                )
                              }
                            >
                              <Power className="mr-2 h-4 w-4" />

                              {addOn.active
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                void handleDelete(
                                  addOn,
                                )
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page{" "}
                    {page + 1}{" "}
                    of{" "}
                    {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        page === 0 ||
                        loading
                      }
                      onClick={() =>
                        void loadAddOns(
                          page - 1,
                          search,
                        )
                      }
                    >
                      Previous
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        page >=
                        totalPages -
                        1 ||
                        loading
                      }
                      onClick={() =>
                        void loadAddOns(
                          page + 1,
                          search,
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EditAddOnDialog
        addOnId={editingId}
        open={editOpen}
        onOpenChange={
          handleEditOpenChange
        }
        onUpdated={refresh}
      />
    </div>
  );
}