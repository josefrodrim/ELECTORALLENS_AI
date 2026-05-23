export const fmt = {
  pct: (v: number | null | undefined, decimals = 1) =>
    v == null ? "—" : `${v.toFixed(decimals)}%`,

  num: (v: number | null | undefined) =>
    v == null ? "—" : v.toLocaleString("es-PE"),

  votes: (v: number | null | undefined) => fmt.num(v),
}

export const CANDIDATE_COLORS: Record<string, string> = {
  F1: "#ef4444",   // Castillo — Peru Libre
  F2: "#f97316",   // Fujimori — Fuerza Popular
  F3: "#3b82f6",   // Lopez Aliaga
  F4: "#8b5cf6",
  F5: "#06b6d4",
  F6: "#10b981",
  F7: "#f59e0b",
  F8: "#ec4899",
  F9: "#84cc16",
  F10: "#6366f1",
  F11: "#14b8a6",
  F12: "#f43f5e",
}

export const LEADING_LABEL: Record<string, string> = {
  F1: "Castillo",
  F2: "Fujimori",
}
