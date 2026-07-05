import type { DeliveryPoint } from "@/types";

interface Props {
  points: DeliveryPoint[];
  startPointId: string | null;
  endPointId: string | null;
  onStartChange: (id: string | null) => void;
  onEndChange: (id: string | null) => void;
}

export function DepotSelector({
  points,
  startPointId,
  endPointId,
  onStartChange,
  onEndChange,
}: Props) {
  const selectCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50";

  return (
    <div className="grid grid-cols-1 gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Start depot
        </span>
        <select
          value={startPointId ?? ""}
          onChange={(e) => onStartChange(e.target.value || null)}
          disabled={points.length === 0}
          className={selectCls}
        >
          <option value="">Select start…</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          End depot
        </span>
        <select
          value={endPointId ?? ""}
          onChange={(e) => onEndChange(e.target.value || null)}
          disabled={points.length === 0}
          className={selectCls}
        >
          <option value="">Select end…</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => onEndChange(startPointId)}
        disabled={!startPointId}
        className="self-start text-xs font-medium text-primary hover:underline disabled:opacity-40"
      >
        Use start as end (return to depot)
      </button>
    </div>
  );
}