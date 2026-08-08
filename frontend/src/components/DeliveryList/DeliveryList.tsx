import { useState } from "react";
import type { DeliveryPoint, StopType } from "@/types";
import { formatCoords } from "@/utils/format";
import { Check, MapPin, Pencil, Trash2, X } from "lucide-react";

interface Props {
  points: DeliveryPoint[];
  startPointId: string | null;
  maxVehicleCapacity: number;
  showDemand: boolean;
  onUpdate: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  onDelete: (id: string) => void;
}

function badge(p: DeliveryPoint, startId: string | null) {
  if (p.id === startId) {
    return { label: "Depot", cls: "bg-[#7c3aed] text-white" };
  }
  return null;
}

function stopTypeBadge(stopType: StopType) {
  return stopType === "pickup"
    ? { label: "Pickup", cls: "bg-amber-500 text-white" }
    : { label: "Delivery", cls: "bg-primary text-primary-foreground" };
}

function stopTypeButtonClass(active: boolean, variant: StopType) {
  const base =
    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors";
  if (active) {
    return variant === "pickup"
      ? `${base} bg-amber-500 text-white`
      : `${base} bg-primary text-primary-foreground`;
  }
  return `${base} border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground`;
}

export function DeliveryList({
  points,
  startPointId,
  maxVehicleCapacity,
  showDemand,
  onUpdate,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    address: "",
    lat: "",
    lng: "",
    quantity: "",
    stopType: "delivery" as StopType,
    serviceDurationMinutes: "",
  });

  function startEdit(p: DeliveryPoint) {
    setEditingId(p.id);
    setDraft({
      address: p.address,
      lat: String(p.latitude),
      lng: String(p.longitude),
      quantity: String(p.quantity),
      stopType: p.stopType,
      serviceDurationMinutes: String(p.serviceDurationMinutes ?? 0),
    });
  }

  function save(id: string) {
    const lat = Number(draft.lat);
    const lng = Number(draft.lng);
    const quantity = Number(draft.quantity);
    const serviceDurationMinutes = Number(draft.serviceDurationMinutes);
    onUpdate(id, {
      address: draft.address.trim() || "Untitled",
      latitude: Number.isFinite(lat) ? lat : 0,
      longitude: Number.isFinite(lng) ? lng : 0,
      quantity:
        Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : 0,
      stopType: draft.stopType,
      serviceDurationMinutes:
        Number.isFinite(serviceDurationMinutes) && serviceDurationMinutes >= 0
          ? Math.floor(serviceDurationMinutes)
          : 0,
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
        const b = badge(p, startPointId);
        const editing = editingId === p.id;
        const isDepot = p.id === startPointId;
        const oversizedDemand = showDemand && p.quantity > maxVehicleCapacity;
        const typeBadge =
          showDemand && !isDepot ? stopTypeBadge(p.stopType) : null;

        return (
          <li
            key={p.id}
            className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
          >
            {editing ? (
              <div className="space-y-2">
                <input
                  value={draft.address}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, address: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                />
                <div className="flex gap-2">
                  <input
                    value={draft.lat}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, lat: e.target.value }))
                    }
                    placeholder="lat"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                  <input
                    value={draft.lng}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, lng: e.target.value }))
                    }
                    placeholder="lng"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                </div>
                {showDemand && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Type
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, stopType: "delivery" }))
                          }
                          className={stopTypeButtonClass(
                            draft.stopType === "delivery",
                            "delivery",
                          )}
                        >
                          D
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, stopType: "pickup" }))
                          }
                          className={stopTypeButtonClass(
                            draft.stopType === "pickup",
                            "pickup",
                          )}
                        >
                          P
                        </button>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Quantity
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={draft.quantity}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, quantity: e.target.value }))
                        }
                        placeholder="Qty"
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                      />
                    </label>
                  </div>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    Service time (min)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={draft.serviceDurationMinutes}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        serviceDurationMinutes: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                </label>
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
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.address}
                    </p>
                    {b && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${b.cls}`}
                      >
                        {b.label}
                      </span>
                    )}
                    {typeBadge && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeBadge.cls}`}
                      >
                        {typeBadge.label}
                      </span>
                    )}
                    {oversizedDemand && (
                      <span className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                        Too large
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCoords(p.latitude, p.longitude)}
                  </p>
                  {showDemand && !isDepot ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          Type
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate(p.id, {
                                stopType: "delivery",
                              })
                            }
                            className={stopTypeButtonClass(
                              p.stopType === "delivery",
                              "delivery",
                            )}
                          >
                            D
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate(p.id, {
                                stopType: "pickup",
                              })
                            }
                            className={stopTypeButtonClass(
                              p.stopType === "pickup",
                              "pickup",
                            )}
                          >
                            P
                          </button>
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          Quantity
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={p.quantity}
                          onChange={(e) =>
                            onUpdate(p.id, {
                              quantity: Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            })
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none transition-colors focus:ring-2 focus:ring-ring/30"
                        />
                      </label>
                    </div>
                  ) : null}
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Service time (min)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={p.serviceDurationMinutes}
                      onChange={(e) =>
                        onUpdate(p.id, {
                          serviceDurationMinutes: Math.max(
                            0,
                            Math.floor(Number(e.target.value) || 0),
                          ),
                        })
                      }
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none transition-colors focus:ring-2 focus:ring-ring/30"
                    />
                  </label>
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
