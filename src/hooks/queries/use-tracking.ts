"use client";

import { useQuery } from "@tanstack/react-query";

import type { TrackingResult } from "@/app/api/tracking/[code]/route";

export const getTrackingQueryKey = (code: string) => ["tracking", code];

async function fetchTracking(code: string): Promise<TrackingResult> {
  const res = await fetch(`/api/tracking/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("Erro ao buscar rastreamento.");
  return res.json() as Promise<TrackingResult>;
}

export function useTracking(code: string | null) {
  return useQuery({
    queryKey: getTrackingQueryKey(code ?? ""),
    queryFn: () => fetchTracking(code!),
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
