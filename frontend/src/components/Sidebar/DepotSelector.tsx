import type { DeliveryPoint } from "@/types";
import { ChevronDown } from "lucide-react";
import { controlBase } from "@/lib/brand";

interface Props {
  points: DeliveryPoint[];
  startPointId: string | null;
  onStartChange: (id: string | null) => void;
}

export function DepotSelector({ points, startPointId, onStartChange }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate">
        Start depot
      </span>
      <div className="relative">
        <select
          value={startPointId ?? ""}
          onChange={(e) => onStartChange(e.target.value || null)}
          disabled={points.length === 0}
          className={`${controlBase} appearance-none pr-9`}
        >
          <option value="">Select start…</option>
          {points.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
      </div>
    </label>
  );
}
