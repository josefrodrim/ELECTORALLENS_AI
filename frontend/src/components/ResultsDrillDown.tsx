"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import ResultsTable from "@/components/ResultsTable"
import { CandidateBarClient } from "@/components/charts/ChartsSection"
import { CANDIDATE_COLORS, fmt, LEADING_LABEL } from "@/lib/format"
import type { ResultItem } from "@/lib/types"
import { X } from "lucide-react"

interface Props {
  deptItems: ResultItem[]
  provinceItems: ResultItem[]
}

function deptCode(ubigeo: string) {
  return ubigeo.slice(0, 2)
}

function isProvince(ubigeo: string) {
  return ubigeo.slice(2, 4) !== "00" && ubigeo.slice(4) === "00"
}

export default function ResultsDrillDown({ deptItems, provinceItems }: Props) {
  const [selected, setSelected] = useState<ResultItem | null>(null)

  const handleSelect = (item: ResultItem) => {
    setSelected((prev) => (prev?.ubigeo === item.ubigeo ? null : item))
  }

  const childProvinces = selected
    ? provinceItems.filter(
        (r) => deptCode(r.ubigeo) === deptCode(selected.ubigeo) && isProvince(r.ubigeo)
      )
    : []

  const leaderColor = CANDIDATE_COLORS[selected?.leading_candidate_code ?? "F1"]

  return (
    <div className="space-y-6">
      <div className={selected ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : undefined}>
        {/* Department table */}
        <div className={selected ? "lg:col-span-2" : undefined}>
          <ResultsTable
            items={deptItems}
            onSelect={handleSelect}
            selectedUbigeo={selected?.ubigeo}
          />
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4 self-start">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-slate-900 font-semibold text-base">{selected.geo_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs border-transparent"
                    style={{
                      background: `${leaderColor}22`,
                      color: leaderColor,
                    }}
                  >
                    {LEADING_LABEL[selected.leading_candidate_code ?? "F1"]}
                  </Badge>
                  <span className="text-slate-400 text-xs">
                    Margen {fmt.pct(selected.winning_margin_pct)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-0.5"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">Participación</p>
                <p className="text-slate-900 font-semibold">{fmt.pct(selected.turnout_pct)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">Electores</p>
                <p className="text-slate-900 font-semibold">{fmt.num(selected.registered_voters)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">Votos nulos</p>
                <p className="text-slate-900 font-semibold">{fmt.pct(selected.null_pct)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">Votos en blanco</p>
                <p className="text-slate-900 font-semibold">{fmt.pct(selected.blank_pct)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                Votos por candidato
              </p>
              <CandidateBarClient candidates={selected.candidates} />
            </div>
          </div>
        )}
      </div>

      {/* Province drill-down */}
      {selected && childProvinces.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Provincias · {selected.geo_name}
          </h3>
          <ResultsTable items={childProvinces} />
        </div>
      )}
    </div>
  )
}
