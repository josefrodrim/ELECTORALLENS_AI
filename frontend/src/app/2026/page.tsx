import { api } from "@/lib/api"
import { CYCLES_BY_YEAR } from "@/lib/elections-data"
import ElectionCyclePage from "@/components/election/ElectionCyclePage"
import { PeruMapP2Client } from "@/components/charts/ChartsSection"
import { Separator } from "@/components/ui/separator"
import type { P2CandidateConfig } from "@/components/charts/PeruMapP2"
import Link from "next/link"

const FINALIST_CANDIDATES: [P2CandidateConfig, P2CandidateConfig] = [
  { code: "F1", name: "Keiko Fujimori Higuchi", short: "Fujimori", party: "Fuerza Popular",
    photo: "/candidates/fujimori.jpg", color: "#ea580c", dimColor: "#fff7ed" },
  { code: "F2", name: "Andrés Avelino Sánchez Palomino", short: "Sánchez", party: "Juntos x Perú",
    photo: "/candidates/sanchez.jpg", color: "#3b82f6", dimColor: "#dbeafe" },
]

export default async function Page2026() {
  const [p1Data, p2Data] = await Promise.all([
    api.results("department", "EG2026-P1").catch(() => null),
    api.results("department", "EG2026-P2").catch(() => null),
  ])

  return (
    <div className="space-y-12">
      <ElectionCyclePage cycle={CYCLES_BY_YEAR[2026]} />

      {p1Data && (
        <>
          <Separator className="border-slate-200" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Mapa de resultados — Primera Vuelta EG 2026
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Resultado por departamento (finalistas) · Pasa el cursor sobre la foto del candidato
              para resaltar los departamentos donde lideró
            </p>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <PeruMapP2Client items={p1Data.items} candidates={FINALIST_CANDIDATES} legendLabel="Resultado P1" />
              <p className="text-xs text-slate-400 mt-4">
                Fuente: ONPE · Resultados oficiales Primera Vuelta EG 2026 por departamento.
              </p>
            </div>
          </div>
        </>
      )}

      {p2Data && (
        <>
          <Separator className="border-slate-200" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Mapa de resultados — Segunda Vuelta EG 2026
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Resultado por departamento · Pasa el cursor sobre la foto del candidato para
              resaltar los departamentos donde ganó
            </p>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <PeruMapP2Client items={p2Data.items} candidates={FINALIST_CANDIDATES} />
              <p className="text-xs text-slate-400 mt-4">
                Fuente: ONPE · Resultados Segunda Vuelta EG 2026 por departamento.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Links to territorial analysis ─────────────────────────────────── */}
      <Separator className="border-slate-200" />
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Análisis territorial · EG 2026 Primera Vuelta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/resultados?election=EG2026-P1"
            className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-2"
          >
            <span className="text-slate-800 font-bold text-sm">Resultados por Territorio</span>
            <p className="text-slate-500 text-xs leading-relaxed">
              Drill-down interactivo por departamento y provincia. Fujimori vs Sánchez (y demás candidatos)
              en cada territorio del país con desglose de participación.
            </p>
            <p className="text-slate-400 text-xs group-hover:text-slate-700 transition-colors">Ver resultados →</p>
          </Link>
          <Link
            href="/participacion?election=EG2026-P1"
            className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-2"
          >
            <span className="text-slate-800 font-bold text-sm">Participación Electoral</span>
            <p className="text-slate-500 text-xs leading-relaxed">
              Ranking de participación y votos nulos/blancos por departamento.
              Identifica outliers estadísticos en el comportamiento del electorado.
            </p>
            <p className="text-slate-400 text-xs group-hover:text-slate-700 transition-colors">Ver participación →</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
