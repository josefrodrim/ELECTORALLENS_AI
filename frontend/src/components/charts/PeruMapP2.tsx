"use client"

import { useRef, useState } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import Image from "next/image"
import type { ResultItem } from "@/lib/types"

export interface P2CandidateConfig {
  code: string        // matches API leading_candidate_code ("F1", "F2", etc.)
  name: string
  short: string
  party: string
  photo: string       // /candidates/*.jpg
  color: string
  dimColor: string
}

interface DeptInfo {
  winner: string
  margin: number
  pcts: Record<string, number | null>
}

interface Props {
  items: ResultItem[]
  candidates: [P2CandidateConfig, P2CandidateConfig]
  legendLabel?: string
}

const GEO_URL = "/geo/peru-departments.json"

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
}

export default function PeruMapP2({ items, candidates, legendLabel = "Resultado P2" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ name: string; info: DeptInfo; x: number; y: number } | null>(null)

  // Build dept lookup
  const deptMap: Record<string, DeptInfo> = {}
  for (const item of items) {
    const key = norm(item.geo_name)
    const pcts: Record<string, number | null> = {}
    for (const cand of candidates) {
      const found = item.candidates.find((c) => c.candidate_code === cand.code)
      pcts[cand.code] = found?.vote_pct ?? null
    }
    deptMap[key] = {
      winner: item.leading_candidate_code ?? candidates[0].code,
      margin: item.winning_margin_pct ?? 0,
      pcts,
    }
  }

  const counts = Object.fromEntries(
    candidates.map((c) => [c.code, Object.values(deptMap).filter((d) => d.winner === c.code).length])
  )

  function getFill(geoName: string): string {
    const info = deptMap[norm(geoName)]
    if (!info) return "#e2e8f0"
    const cand = candidates.find((c) => c.code === info.winner)!
    if (!active) return cand.color
    return info.winner === active ? cand.color : cand.dimColor
  }

  function handleGeoMouseMove(evt: React.MouseEvent, geoName: string) {
    const info = deptMap[norm(geoName)]
    if (!info || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ name: geoName, info, x: evt.clientX - rect.left, y: evt.clientY - rect.top })
  }

  return (
    <div ref={containerRef} className="relative flex flex-col lg:flex-row gap-6 items-start">
      {/* Map */}
      <div className="flex-1 min-w-0">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1700, center: [-75, -9.5] }}
          width={480}
          height={580}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: import("react-simple-maps").Geography[] }) =>
              geographies.map((geo) => {
                const name = geo.properties["NOMBDEP"] as string
                const fill = getFill(name)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none", cursor: "default", transition: "fill 0.18s ease" },
                      hover: { outline: "none", opacity: 0.82, cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    onMouseMove={(evt: React.MouseEvent) => handleGeoMouseMove(evt, name)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Candidate cards */}
      <div className="flex lg:flex-col flex-row gap-3 lg:w-52 w-full flex-wrap">
        {candidates.map((cand) => {
          const isActive = active === cand.code
          return (
            <button
              key={cand.code}
              onMouseEnter={() => setActive(cand.code)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(isActive ? null : cand.code)}
              className={`flex-1 lg:flex-none rounded-xl border p-4 text-left transition-all ${
                isActive ? "shadow-md" : "border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
              style={isActive ? { borderColor: cand.color, boxShadow: `0 0 0 2px ${cand.color}22` } : {}}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    outline: `2.5px solid ${isActive ? cand.color : "#cbd5e1"}`,
                    outlineOffset: "2px",
                  }}
                >
                  <Image
                    src={cand.photo}
                    alt={cand.name}
                    fill
                    className="object-cover object-top"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{cand.short}</p>
                  <p className="text-xs text-slate-400 truncate">{cand.party}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: cand.color }}>
                    {counts[cand.code] ?? 0}
                    <span className="text-xs font-normal text-slate-400 ml-1">depts.</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                {isActive
                  ? `Mostrando ${counts[cand.code]} departamentos ganados`
                  : "Pasar el mouse para resaltar"}
              </p>
            </button>
          )
        })}

        {/* Legend */}
        <div className="w-full lg:w-auto rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{legendLabel}</p>
          {candidates.map((c) => (
            <div key={c.code} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }} />
              <span className="text-slate-600">{c.short} ganó</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-slate-200" />
            <span className="text-slate-400">Sin datos</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed lg:block hidden">
          Pasa el cursor sobre la foto de un candidato para resaltar los departamentos donde ganó.
          Pasa sobre el mapa para ver el resultado por departamento.
        </p>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-sm pointer-events-none min-w-48"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.offsetWidth ?? 999) - 210),
            top: Math.max(tooltip.y - 10, 0),
          }}
        >
          <p className="font-semibold text-slate-900 mb-1.5">{tooltip.name}</p>
          {(() => {
            const winner = candidates.find((c) => c.code === tooltip.info.winner)!
            return (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: winner.color }} />
                  <span className="text-xs font-medium" style={{ color: winner.color }}>
                    {winner.short} ganó
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    +{tooltip.info.margin.toFixed(1)} pp
                  </span>
                </div>
                <div className="space-y-0.5 mt-1.5">
                  {candidates.map((c) => (
                    <div key={c.code} className="flex justify-between text-xs">
                      <span className="text-slate-500">{c.short}</span>
                      <span className="font-mono text-slate-700">
                        {tooltip.info.pcts[c.code] != null
                          ? `${tooltip.info.pcts[c.code]!.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
