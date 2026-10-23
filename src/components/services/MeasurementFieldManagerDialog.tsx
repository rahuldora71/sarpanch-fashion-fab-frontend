import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
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
  Label,
} from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createMeasurementField,
  deleteMeasurementField,
  getMeasurementFields,
  searchMeasurementFields,
  updateMeasurementField,
} from "@/services/measurementFieldService";
import { useMeasurementFields } from "@/hooks/useMeasurementFields";

import type {
  MeasurementField,
} from "@/types/measurementField";


interface MeasurementFieldManagerDialogProps {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;
}


export function MeasurementFieldManagerDialog({
  open,
  onOpenChange,
}: MeasurementFieldManagerDialogProps) {
  const {
    fields: globalFields,
    upsertField,
    deleteField,
    refetch,
  } = useMeasurementFields();

  const [fields, setFields] =
    useState<MeasurementField[]>([]);

  const [search, setSearch] =
    useState("");

  const [newName, setNewName] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // =========================================================
  // LOAD
  // =========================================================

  const loadFields = async () => {

    try {

      setLoading(true);
      setError(null);


      const keyword =
        search.trim();


      const response =
        keyword
          ? await searchMeasurementFields(
              keyword,
              0,
              100,
              "name,asc",
            )
          : await getMeasurementFields(
              0,
              100,
              "name,asc",
            );


      setFields(
        response.content ?? [],
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load measurement fields.",
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    if (open && !search.trim() && globalFields.length > 0 && fields.length === 0) {
      setFields(globalFields);
    }
  }, [open, search, globalFields, fields.length]);

  useEffect(() => {
    if (!open) {
      return;
    }


    const timeout =
      window.setTimeout(
        loadFields,
        search.trim() ? 300 : 0,
      );


    return () =>
      window.clearTimeout(
        timeout,
      );

  }, [
    open,
    search,
  ]);


  // =========================================================
  // CREATE
  // =========================================================

  const handleCreate = async () => {

    const name =
      newName.trim();


    if (!name) {
      return;
    }


    try {

      setSaving(true);
      setError(null);


      const created =
        await createMeasurementField({
          name,
        });

      upsertField(created);
      void refetch(true);

      setFields(
        (previous) =>
          [...previous, created].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
              ),
          ),
      );


      setNewName("");

    } catch (err) {

      console.error(err);

      setError(
        "Unable to create measurement field. It may already exist.",
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // EDIT
  // =========================================================

  const startEdit = (
    field: MeasurementField,
  ) => {

    setEditingId(field.id);

    setEditingName(
      field.name,
    );

  };


  const cancelEdit = () => {

    setEditingId(null);

    setEditingName("");

  };


  const saveEdit = async () => {

    if (
      editingId === null
    ) {
      return;
    }


    const name =
      editingName.trim();


    if (!name) {
      return;
    }


    try {

      setSaving(true);
      setError(null);


      const updated =
        await updateMeasurementField(
          editingId,
          {
            name,
          },
        );

      upsertField(updated);
      void refetch(true);

      setFields(
        (previous) =>
          previous
            .map(
              (field) =>
                field.id ===
                editingId
                  ? updated
                  : field,
            )
            .sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                ),
            ),
      );


      cancelEdit();

    } catch (err) {

      console.error(err);

      setError(
        "Unable to update measurement field.",
      );

    } finally {

      setSaving(false);

    }

  };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    field: MeasurementField,
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${field.name}"?`,
      );


    if (!confirmed) {
      return;
    }


    try {

      setSaving(true);
      setError(null);


      await deleteMeasurementField(
        field.id,
      );

      deleteField(field.id);
      void refetch(true);

      setFields(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              field.id,
          ),
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to delete this field. It may already be used by a service.",
      );

    } finally {

      setSaving(false);

    }

  };


  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >

      <DialogContent
        className="
          flex
          max-h-[85dvh]
          flex-col
          overflow-hidden
          p-0
          sm:max-w-lg
        "
      >

        {/* HEADER */}

        <DialogHeader
          className="
            shrink-0
            border-b
            px-4
            py-4
            sm:px-6
          "
        >

          <DialogTitle>
            Measurement Fields
          </DialogTitle>

          <p className="text-sm text-muted-foreground">
            Manage reusable measurements
            used across your services.
          </p>

        </DialogHeader>


        {/* ADD */}

        <div
          className="
            shrink-0
            border-b
            px-4
            py-4
            sm:px-6
          "
        >

          <Label
            htmlFor="new-measurement"
          >
            Add Measurement Field
          </Label>


          <div
            className="
              mt-2
              flex
              gap-2
            "
          >

            <Input
              id="new-measurement"
              value={newName}
              onChange={(event) =>
                setNewName(
                  event.target.value,
                )
              }
              placeholder="e.g. Chest"
              maxLength={100}
              onKeyDown={(event) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  event.preventDefault();

                  handleCreate();

                }

              }}
            />


            <Button
              type="button"
              onClick={
                handleCreate
              }
              disabled={
                saving ||
                !newName.trim()
              }
            >

              {saving ? (
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />
              ) : (
                <Plus className="h-4 w-4" />
              )}

            </Button>

          </div>

        </div>


        {/* SEARCH */}

        <div
          className="
            shrink-0
            px-4
            pt-4
            sm:px-6
          "
        >

          <div className="relative">

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
              placeholder="Search fields..."
              className="pl-9"
            />

          </div>

        </div>


        {/* ERROR */}

        {error && (
          <div
            className="
              mx-4
              mt-3
              shrink-0
              rounded-md
              border
              border-destructive/30
              bg-destructive/10
              px-3
              py-2
              text-sm
              text-destructive
              sm:mx-6
            "
          >
            {error}
          </div>
        )}


        {/* LIST */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            px-4
            py-3
            sm:px-6
          "
        >

          {loading && (
            <div
              className="
                flex
                items-center
                justify-center
                gap-2
                py-8
                text-sm
                text-muted-foreground
              "
            >

              <Loader2
                className="
                  h-4
                  w-4
                  animate-spin
                "
              />

              Loading...

            </div>
          )}


          {!loading &&
            fields.length === 0 && (
              <div
                className="
                  py-8
                  text-center
                "
              >

                <p className="text-sm font-medium">
                  No measurement fields
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add your first reusable
                  measurement above.
                </p>

              </div>
            )}


          {!loading &&
            fields.map((field) => (

              <div
                key={field.id}
                className="
                  flex
                  items-center
                  gap-3
                  border-b
                  border-border
                  py-3
                  last:border-b-0
                "
              >

                {editingId ===
                field.id ? (

                  <>

                    <Input
                      value={
                        editingName
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditingName(
                          event.target
                            .value,
                        )
                      }
                      className="min-w-0 flex-1"
                      autoFocus
                    />

                    <Button
                      type="button"
                      size="sm"
                      onClick={
                        saveEdit
                      }
                      disabled={
                        saving ||
                        !editingName.trim()
                      }
                    >
                      Save
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={
                        cancelEdit
                      }
                    >
                      Cancel
                    </Button>

                  </>

                ) : (

                  <>

                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {field.name}
                    </p>


                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        startEdit(
                          field,
                        )
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>


                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="
                        h-8
                        w-8
                        text-destructive
                        hover:text-destructive
                      "
                      onClick={() =>
                        handleDelete(
                          field,
                        )
                      }
                      disabled={
                        saving
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </>

                )}

              </div>

            ))}

        </div>

      </DialogContent>

    </Dialog>
  );
}