import type { Election, GeoChildren, GeoLevel, GeoUnit, ResultItem, ResultList } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  elections: (): Promise<Election[]> =>
    get("/api/v1/elections"),

  results: (level: GeoLevel, election: string): Promise<ResultList> =>
    get(`/api/v1/results/${level}?election=${election}`),

  resultByUbigeo: (ubigeo: string, election: string): Promise<ResultItem> =>
    get(`/api/v1/results/ubigeo/${ubigeo}?election=${election}`),

  geoByLevel: (level: GeoLevel): Promise<GeoUnit[]> =>
    get(`/api/v1/geo/${level}`),

  geoChildren: (ubigeo: string): Promise<GeoChildren> =>
    get(`/api/v1/geo/${ubigeo}/children`),
}
