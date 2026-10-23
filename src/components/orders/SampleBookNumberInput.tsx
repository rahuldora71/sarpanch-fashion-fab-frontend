import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Loader2 } from "lucide-react";
import { getNextSampleBookPageNumber } from "@/services/orderEditService";

interface Props {
  value: string;
  onChange: (val: string) => void;
  /** If true, auto-fetch next number on mount */
  autoFetch?: boolean;
  disabled?: boolean;
}

/**
 * Sample Book Page Number input with auto-fetch from the backend.
 * Displays the auto-generated next number but stays editable.
 */
export default function SampleBookNumberInput({
  value,
  onChange,
  autoFetch = true,
  disabled = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (autoFetch && !value) {
      fetchNext();
    }
  }, [autoFetch]);

  const fetchNext = async () => {
    setFetching(true);
    try {
      const next = await getNextSampleBookPageNumber();
      onChange(next);
      setDraft(next);
    } catch {
      // allow manual entry if fetch fails
    } finally {
      setFetching(false);
    }
  };

  const handleConfirm = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-32 h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleConfirm}>
          <Check className="w-3.5 h-3.5 text-green-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {fetching ? (
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Fetching...
        </span>
      ) : (
        <span className="font-mono text-sm font-semibold text-gray-800">
          {value || "—"}
        </span>
      )}
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-400 hover:text-gray-700"
          onClick={() => setEditing(true)}
          title="Edit sample book number"
        >
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
