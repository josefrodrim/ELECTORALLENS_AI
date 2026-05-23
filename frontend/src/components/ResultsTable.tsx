"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { ResultItem } from "@/lib/types"
import { CANDIDATE_COLORS, fmt } from "@/lib/format"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SortKey = "geo_name" | "turnout_pct" | "winning_margin_pct"

interface Props {
  items: ResultItem[]
  onSelect?: (item: ResultItem) => void
  selectedUbigeo?: string
}

export default function ResultsTable({ items, onSelect, selectedUbigeo }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "winning_margin_pct", asc: false })

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.key] ?? ""
    const vb = b[sort.key] ?? ""
    return sort.asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  const toggle = (key: SortKey) =>
    setSort((s) => s.key === key ? { key, asc: !s.asc } : { key, asc: false })

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key === k ? (
      sort.asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3 opacity-20" />
    )

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th
              className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
              onClick={() => toggle("geo_name")}
            >
              <span className="flex items-center gap-1">Territorio <SortIcon k="geo_name" /></span>
            </th>
            <th
              className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
              onClick={() => toggle("turnout_pct")}
            >
              <span className="flex items-center justify-end gap-1">Participación <SortIcon k="turnout_pct" /></span>
            </th>
            <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Castillo</th>
            <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Fujimori</th>
            <th
              className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
              onClick={() => toggle("winning_margin_pct")}
            >
              <span className="flex items-center justify-end gap-1">Margen <SortIcon k="winning_margin_pct" /></span>
            </th>
            <th className="text-center px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Líder</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const c1 = r.candidates.find((c) => c.candidate_code === "F1")
            const c2 = r.candidates.find((c) => c.candidate_code === "F2")
            const isSelected = r.ubigeo === selectedUbigeo
            return (
              <tr
                key={r.ubigeo}
                onClick={() => onSelect?.(r)}
                className={cn(
                  i < sorted.length - 1 ? "border-b border-slate-100" : "",
                  "transition-colors",
                  onSelect && "cursor-pointer hover:bg-slate-50",
                  isSelected && "bg-slate-100"
                )}
              >
                <td className="px-4 py-2.5 text-slate-800 font-medium">{r.geo_name}</td>
                <td className="px-4 py-2.5 text-right text-slate-500 font-mono">{fmt.pct(r.turnout_pct)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-red-600">{fmt.pct(c1?.vote_pct)}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="font-mono text-orange-600">{fmt.pct(c2?.vote_pct)}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-500">{fmt.pct(r.winning_margin_pct)}</td>
                <td className="px-4 py-2.5 text-center">
                  <Badge
                    variant="outline"
                    className="text-xs border-transparent"
                    style={{
                      background: `${CANDIDATE_COLORS[r.leading_candidate_code ?? "F1"]}22`,
                      color: CANDIDATE_COLORS[r.leading_candidate_code ?? "F1"],
                    }}
                  >
                    {r.leading_candidate_code === "F1" ? "Castillo" : "Fujimori"}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
