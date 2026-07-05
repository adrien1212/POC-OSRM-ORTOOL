import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAddress } from "@/api/addressSearch";
import type { AddressResult } from "@/types";
import { formatCoords } from "@/utils/format";
import { Loader2, MapPin, Search } from "lucide-react";

interface Props {
  onSelect: (result: AddressResult) => void;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function AddressSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["address-search", debounced],
    queryFn: () => searchAddress(debounced),
    enabled: debounced.trim().length > 1,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = data ?? [];

  function handleSelect(r: AddressResult) {
    onSelect(r);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search an address…"
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && debounced.trim().length > 1 && (
        <div className="absolute z-[1100] mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {results.length === 0 && !isFetching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.address}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatCoords(r.latitude, r.longitude)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}