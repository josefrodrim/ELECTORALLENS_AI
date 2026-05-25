import { CYCLES_BY_YEAR } from "@/lib/elections-data"
import { EG2021_P2_DEPT_RESULTS } from "@/lib/elections-2021-p2-static"
import ElectionCyclePage from "@/components/election/ElectionCyclePage"
import { PeruMapP2Client } from "@/components/charts/ChartsSection"
import type { P2CandidateConfig } from "@/components/charts/PeruMapP2"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const P2_CANDIDATES: [P2CandidateConfig, P2CandidateConfig] = [
  { code: "F1", name: "Pedro Castillo Terrones", short: "Castillo", party: "Perú Libre",
    photo: "/candidates/castillo.jpg", color: "#16a34a", dimColor: "#dcfce7" },
  { code: "F2", name: "Keiko Fujimori Higuchi", short: "Fujimori", party: "Fuerza Popular",
    photo: "/candidates/fujimori.jpg", color: "#ea580c", dimColor: "#fff7ed" },
]

export default function Page2021() {
  return (
    <div className="space-y-12">
      <ElectionCyclePage cycle={CYCLES_BY_YEAR[2021]} />

      {/* ── Interactive department map ─────────────────────────────────────── */}
      <>
        <Separator className="border-slate-200" />
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Mapa de resultados — Segunda Vuelta EG 2021
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            Resultado por departamento · Pasa el cursor sobre la foto del candidato para
            resaltar los departamentos donde ganó
          </p>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <PeruMapP2Client items={EG2021_P2_DEPT_RESULTS} candidates={P2_CANDIDATES} />
            <p className="text-xs text-slate-400 mt-4">
              Fuente: ONPE · Resultados finales Segunda Vuelta EG 2021 · Datos a nivel de mesa agregados por departamento (86 488 actas domésticas).
            </p>
          </div>
        </div>
      </>

      {/* ── Links to territorial analysis ─────────────────────────────────── */}
      <Separator className="border-slate-200" />
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Análisis territorial · EG 2021 Segunda Vuelta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/resultados?election=GP2021-P2"
            className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-bold text-sm">Resultados por Territorio</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Drill-down interactivo por departamento y provincia. Castillo vs Fujimori
              en cada territorio del país con desglose de participación.
            </p>
            <p className="text-slate-400 text-xs group-hover:text-slate-700 transition-colors">
              Ver resultados →
            </p>
          </Link>

          <Link
            href="/participacion?election=GP2021-P2"
            className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-bold text-sm">Participación Electoral</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Ranking de participación y votos nulos/blancos por departamento.
              Identifica outliers estadísticos en el comportamiento del electorado.
            </p>
            <p className="text-slate-400 text-xs group-hover:text-slate-700 transition-colors">
              Ver participación →
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
