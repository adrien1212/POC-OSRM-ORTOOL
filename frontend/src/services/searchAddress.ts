import axios from "axios";
import type { AddressResult } from "@/types";

type BackendCoordonnees = {
  latitude: number;
  longitude: number;
  adresse: string;
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8012",
  headers: { "Content-Type": "application/json" },
});

export async function searchAddress(query: string): Promise<AddressResult[]> {
  const adresse = query.trim();
  if (!adresse) return [];

  const { data } = await client.get<BackendCoordonnees>("/api/v1/coordonnees", {
    params: { adresse },
  });

  return [
    {
      id: data.adresse,
      address: data.adresse,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  ];
}
