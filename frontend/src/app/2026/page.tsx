import { api } from "@/lib/api"
import { CYCLES_BY_YEAR } from "@/lib/elections-data"
import ElectionCyclePage from "@/components/election/ElectionCyclePage"
import { PeruMapP2Client } from "@/components/charts/ChartsSection"
import { Separator } from "@/components/ui/separator"
import type { P2CandidateConfig } from "@/components/charts/PeruMapP2"

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
    </div>
  )
}
