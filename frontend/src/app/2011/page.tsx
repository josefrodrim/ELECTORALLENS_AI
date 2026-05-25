import { api } from "@/lib/api"
import { CYCLES_BY_YEAR } from "@/lib/elections-data"
import ElectionCyclePage from "@/components/election/ElectionCyclePage"
import { PeruMapP2Client } from "@/components/charts/ChartsSection"
import { Separator } from "@/components/ui/separator"
import type { P2CandidateConfig } from "@/components/charts/PeruMapP2"
import Link from "next/link"

const P2_CANDIDATES: [P2CandidateConfig, P2CandidateConfig] = [
  { code: "F1", name: "Ollanta Humala Tasso", short: "Humala", party: "Gana Perú",
    photo: "/candidates/humala.jpg", color: "#6366f1", dimColor: "#e0e7ff" },
  { code: "F2", name: "Keiko Fujimori Higuchi", short: "Fujimori", party: "Fuerza 2011",
    photo: "/candidates/fujimori.jpg", color: "#ea580c", dimColor: "#fff7ed" },
]

export default async function Page2011() {
  const p2Data = await api.results("department", "EG2011-P2").catch(() => null)

  return (
    <div className="space-y-12">
      <ElectionCyclePage cycle={CYCLES_BY_YEAR[2011]} />

      {p2Data && (
        <>
          <Separator className="border-slate-200" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Mapa de resultados — Segunda Vuelta EG 2011
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Resultado por departamento · Pasa el cursor sobre la foto del candidato para
              resaltar los departamentos donde ganó
            </p>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <PeruMapP2Client items={p2Data.items} candidates={P2_CANDIDATES} />
              <p className="text-xs text-slate-400 mt-4">
                Fuente: ONPE · Resultados finales Segunda Vuelta EG 2011 por departamento.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Links to territorial analysis ─────────────────────────────────── */}
      <Separator className="border-slate-200" />
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Análisis territorial · EG 2011 Segunda Vuelta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/resultados?election=EG2011-P2"
            className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-2"
          >
            <span className="text-slate-800 font-bold text-sm">Resultados por Territorio</span>
            <p className="text-slate-500 text-xs leading-relaxed">
              Drill-down interactivo por departamento y provincia. Humala vs Fujimori
              en cada territorio del país con desglose de participación.
            </p>
            <p className="text-slate-400 text-xs group-hover:text-slate-700 transition-colors">Ver resultados →</p>
          </Link>
          <Link
            href="/participacion?election=EG2011-P2"
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
