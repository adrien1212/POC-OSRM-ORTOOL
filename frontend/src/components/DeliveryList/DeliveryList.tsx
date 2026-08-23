import { useState } from "react";
import type { DeliveryPoint, StopType } from "@/types";
import { formatCoords } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cardInteractive, controlXs, focusEdge, iconButton } from "@/lib/brand";
import { Check, MapPin, Pencil, Trash2, X } from "lucide-react";

interface Props {
  points: DeliveryPoint[];
  startPointId: string | null;
  maxVehicleCapacity: number;
  showDemand: boolean;
  onUpdate: (id: string, patch: Partial<Omit<DeliveryPoint, "id">>) => void;
  onDelete: (id: string) => void;
}

/*
 * Pill tab pair, per components/navigation/PillTabs.prompt.md: the active tab
 * is solid black, the inactive one is white with a hairline border and steel
 * text. Pickup borrows the orange pastel so the two stop types stay separable
 * without introducing a colour outside the documented set.
 */
function stopTypeTab(active: boolean, variant: StopType) {
  const base = [
    "rounded-full px-3 py-1 text-[13px] font-medium",
    "transition-colors duration-150 ease-brand",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
  ].join(" ");
  if (!active) {
    return `${base} border border-hairline bg-canvas text-steel hover:bg-hairline-soft hover:text-ink`;
  }
  return variant === "pickup"
    ? `${base} bg-brand-yellow-deep text-ink`
    : `${base} bg-ink text-canvas`;
}

function fieldLabel(text: string) {
  return (
    <span className="mb-1 block text-[13px] font-medium text-steel">
      {text}
    </span>
  );
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
      <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
        <MapPin className="mx-auto h-[22px] w-[22px] text-stone" />
        <p className="mt-2 text-sm text-steel">
          No delivery points yet. Search an address to add one.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {points.map((p, idx) => {
        const editing = editingId === p.id;
        const isDepot = p.id === startPointId;
        const oversizedDemand = showDemand && p.quantity > maxVehicleCapacity;
        const showTypeControls = showDemand && !isDepot;

        return (
          <li key={p.id} className={`${cardInteractive} p-3`}>
            {editing ? (
              <div className="space-y-2.5">
                <label className="block">
                  {fieldLabel("Address")}
                  <input
                    value={draft.address}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, address: e.target.value }))
                    }
                    className={controlXs}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    {fieldLabel("Latitude")}
                    <input
                      value={draft.lat}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, lat: e.target.value }))
                      }
                      className={controlXs}
                    />
                  </label>
                  <label className="block">
                    {fieldLabel("Longitude")}
                    <input
                      value={draft.lng}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, lng: e.target.value }))
                      }
                      className={controlXs}
                    />
                  </label>
                </div>
                {showDemand && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                    <div>
                      {fieldLabel("Type")}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, stopType: "delivery" }))
                          }
                          className={stopTypeTab(
                            draft.stopType === "delivery",
                            "delivery",
                          )}
                        >
                          Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, stopType: "pickup" }))
                          }
                          className={stopTypeTab(
                            draft.stopType === "pickup",
                            "pickup",
                          )}
                        >
                          Pickup
                        </button>
                      </div>
                    </div>
                    <label className="block">
                      {fieldLabel("Quantity")}
                      <input
                        type="number"
                        min={0}
                        value={draft.quantity}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, quantity: e.target.value }))
                        }
                        className={controlXs}
                      />
                    </label>
                  </div>
                )}
                <label className="block">
                  {fieldLabel("Service time (min)")}
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
                    className={controlXs}
                  />
                </label>
                <div className="flex justify-end gap-2 pt-0.5">
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button size="xs" onClick={() => save(p.id)}>
                    <Check className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-slate">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-ink">
                      {p.address}
                    </p>
                    {/* Yellow is the depot's signature here, matching its map pin. */}
                    {isDepot && (
                      <Badge variant="promo" size="sm">
                        Depot
                      </Badge>
                    )}
                    {showTypeControls && (
                      <Badge
                        variant={p.stopType === "pickup" ? "orange" : "neutral"}
                        size="sm"
                      >
                        {p.stopType === "pickup" ? "Pickup" : "Delivery"}
                      </Badge>
                    )}
                    {oversizedDemand && (
                      <Badge variant="destructive" size="sm">
                        Too large
                      </Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-steel">
                    {formatCoords(p.latitude, p.longitude)}
                  </p>
                  {showTypeControls ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                      <div>
                        {fieldLabel("Type")}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate(p.id, { stopType: "delivery" })
                            }
                            className={stopTypeTab(
                              p.stopType === "delivery",
                              "delivery",
                            )}
                          >
                            Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate(p.id, { stopType: "pickup" })
                            }
                            className={stopTypeTab(
                              p.stopType === "pickup",
                              "pickup",
                            )}
                          >
                            Pickup
                          </button>
                        </div>
                      </div>
                      <label className="block">
                        {fieldLabel("Quantity")}
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
                          className={[
                            "w-full rounded-md border border-hairline-strong bg-canvas px-2 py-1 text-[13px] text-ink",
                            "transition-colors duration-150 ease-brand",
                            focusEdge,
                          ].join(" ")}
                        />
                      </label>
                    </div>
                  ) : null}
                  <label className="block">
                    {fieldLabel("Service time (min)")}
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
                      className={[
                        "w-full rounded-md border border-hairline-strong bg-canvas px-2 py-1 text-[13px] text-ink",
                        "transition-colors duration-150 ease-brand",
                        focusEdge,
                      ].join(" ")}
                    />
                  </label>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    onClick={() => startEdit(p)}
                    title="Edit"
                    aria-label={`Edit ${p.address}`}
                    className={iconButton}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    title="Delete"
                    aria-label={`Delete ${p.address}`}
                    className={`${iconButton} hover:bg-brand-red hover:text-coral-dark`}
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
