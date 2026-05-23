import { api } from "@/lib/api"
import { CYCLES_BY_YEAR } from "@/lib/elections-data"
import ElectionCyclePage from "@/components/election/ElectionCyclePage"
import { PeruMapP2Client } from "@/components/charts/ChartsSection"
import { Separator } from "@/components/ui/separator"
import type { P2CandidateConfig } from "@/components/charts/PeruMapP2"

const P2_CANDIDATES: [P2CandidateConfig, P2CandidateConfig] = [
  { code: "F1", name: "Pedro Pablo Kuczynski Godard", short: "PPK", party: "Peruanos Por el Kambio",
    photo: "/candidates/ppk.jpg", color: "#d97706", dimColor: "#fef3c7" },
  { code: "F2", name: "Keiko Fujimori Higuchi", short: "Fujimori", party: "Fuerza Popular",
    photo: "/candidates/fujimori.jpg", color: "#ea580c", dimColor: "#fff7ed" },
]

export default async function Page2016() {
  const p2Data = await api.results("department", "EG2016-P2").catch(() => null)

  return (
    <div className="space-y-12">
      <ElectionCyclePage cycle={CYCLES_BY_YEAR[2016]} />

      {p2Data && (
        <>
          <Separator className="border-slate-200" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Mapa de resultados — Segunda Vuelta EG 2016
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Resultado por departamento · Pasa el cursor sobre la foto del candidato para
              resaltar los departamentos donde ganó
            </p>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <PeruMapP2Client items={p2Data.items} candidates={P2_CANDIDATES} />
              <p className="text-xs text-slate-400 mt-4">
                Fuente: ONPE · Resultados finales Segunda Vuelta EG 2016 por departamento.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
