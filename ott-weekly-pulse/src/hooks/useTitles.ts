"use client";
import { useQuery } from "@tanstack/react-query";
import type { Title, TitleFilters, WeekMeta } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useWeeks() {
  return useQuery({
    queryKey: ["weeks"],
    queryFn: () => fetchJson<{ weeks: WeekMeta[] }>("/api/weeks").then((d) => d.weeks)
  });
}

export function useTitles(weekId: string | undefined, filters: TitleFilters) {
  const params = new URLSearchParams();
  if (weekId) params.set("weekId", weekId);
  if (filters.type && filters.type !== "ALL") params.set("type", filters.type);
  if (filters.language && filters.language !== "ALL") params.set("language", filters.language);
  if (filters.platform && filters.platform !== "ALL") params.set("platform", filters.platform);
  if (filters.genre && filters.genre !== "ALL") params.set("genre", filters.genre);
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.search) params.set("search", filters.search);

  return useQuery({
    queryKey: ["titles", weekId, filters],
    queryFn: () => fetchJson<{ titles: Title[]; total: number }>(`/api/titles?${params.toString()}`)
  });
}

export function useTitle(id: string | undefined) {
  return useQuery({
    queryKey: ["title", id],
    queryFn: () => fetchJson<{ title: Title }>(`/api/titles/${id}`).then((d) => d.title),
    enabled: !!id
  });
}

export function useWatchlist(userToken: string) {
  return useQuery({
    queryKey: ["watchlist", userToken],
    queryFn: () => fetchJson<{ titleIds: string[] }>(`/api/watchlist?userToken=${userToken}`).then((d) => d.titleIds),
    enabled: !!userToken
  });
}
