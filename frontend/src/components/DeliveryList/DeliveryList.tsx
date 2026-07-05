import { useState } from "react";
import type { DeliveryPoint } from "@/types";
import { formatCoords } from "@/utils/format";
import { Check, MapPin, Pencil, Trash2, X } from "lucide-react";

interface Props {
  points: DeliveryPoint[];
  startPointId: string | null;
  endPointId: string | null;
  onUpdate: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  onDelete: (id: string) => void;
}

function badge(p: DeliveryPoint, startId: string | null, endId: string | null) {
  if (p.id === startId && p.id === endId)
    return { label: "Depot", cls: "bg-[#7c3aed] text-white" };
  if (p.id === startId) return { label: "Start", cls: "bg-success text-success-foreground" };
  if (p.id === endId) return { label: "End", cls: "bg-destructive text-destructive-foreground" };
  return null;
}

export function DeliveryList({
  points,
  startPointId,
  endPointId,
  onUpdate,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ address: "", lat: "", lng: "" });

  function startEdit(p: DeliveryPoint) {
    setEditingId(p.id);
    setDraft({
      address: p.address,
      lat: String(p.latitude),
      lng: String(p.longitude),
    });
  }

  function save(id: string) {
    const lat = Number(draft.lat);
    const lng = Number(draft.lng);
    onUpdate(id, {
      address: draft.address.trim() || "Untitled",
      latitude: Number.isFinite(lat) ? lat : 0,
      longitude: Number.isFinite(lng) ? lng : 0,
    });
    setEditingId(null);
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No delivery points yet. Search an address to add one.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {points.map((p, idx) => {
        const b = badge(p, startPointId, endPointId);
        const editing = editingId === p.id;
        return (
          <li
            key={p.id}
            className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
          >
            {editing ? (
              <div className="space-y-2">
                <input
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                />
                <div className="flex gap-2">
                  <input
                    value={draft.lat}
                    onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value }))}
                    placeholder="lat"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                  <input
                    value={draft.lng}
                    onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value }))}
                    placeholder="lng"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => save(p.id)}
                    className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.address}
                    </p>
                    {b && (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${b.cls}`}>
                        {b.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCoords(p.latitude, p.longitude)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(p)}
                    title="Edit"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    title="Delete"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}