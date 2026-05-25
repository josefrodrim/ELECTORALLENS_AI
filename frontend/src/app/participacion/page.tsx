import { api } from "@/lib/api"
import { fmt } from "@/lib/format"
import StatCard from "@/components/StatCard"
import { Separator } from "@/components/ui/separator"
import { TurnoutRankingClient } from "@/components/charts/ChartsSection"
import ResultsTable from "@/components/ResultsTable"
import { getStaticDeptResults } from "@/lib/static-election-results"

export const revalidate = 60

export default async function ParticipacionPage({
  searchParams,
}: {
  searchParams: Promise<{ election?: string }>
}) {
  const { election = "GP2021-P2" } = await searchParams
  const staticData = getStaticDeptResults(election)
  const deptResults = staticData ?? await api.results("department", election)
  const items = deptResults.items

  const totalRegistered = items.reduce((s, r) => s + (r.registered_voters ?? 0), 0)
  const totalCast = items.reduce((s, r) => s + (r.votes_cast ?? 0), 0)
  const totalNull = items.reduce((s, r) => s + (r.null_votes ?? 0), 0)
  const totalBlank = items.reduce((s, r) => s + (r.blank_votes ?? 0), 0)
  const avgTurnout = totalRegistered > 0 ? (totalCast / totalRegistered) * 100 : 0

  const withTurnout = items.filter((r) => r.turnout_pct != null)
  const sorted = [...withTurnout].sort((a, b) => (b.turnout_pct ?? 0) - (a.turnout_pct ?? 0))
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]
  const aboveAvg = sorted.filter((r) => (r.turnout_pct ?? 0) >= avgTurnout).length

  const nullPct = totalCast > 0 ? (totalNull / totalCast) * 100 : 0
  const blankPct = totalCast > 0 ? (totalBlank / totalCast) * 100 : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Análisis de Participación</h1>
        <p className="text-slate-500 text-sm mt-1">
          Distribución de la participación electoral por departamento · {deptResults.election_name}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Participación nacional"
          value={fmt.pct(avgTurnout)}
          sub={`${fmt.num(totalCast)} votos emitidos`}
          accent="text-blue-600"
        />
        <StatCard
          label="Mayor participación"
          value={fmt.pct(highest?.turnout_pct)}
          sub={highest?.geo_name ?? "—"}
          accent="text-green-600"
        />
        <StatCard
          label="Menor participación"
          value={fmt.pct(lowest?.turnout_pct)}
          sub={lowest?.geo_name ?? "—"}
          accent="text-amber-600"
        />
        <StatCard
          label="Deptos. sobre la media"
          value={`${aboveAvg} / ${sorted.length}`}
          sub="departamentos"
          accent="text-purple-600"
        />
      </div>

      <Separator className="border-slate-200" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turnout ranking chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Ranking de Participación</h2>
          <p className="text-xs text-slate-400 mb-4">
            Rojo = Castillo ganó · Naranja = Fujimori ganó · Línea punteada = media nacional
          </p>
          <TurnoutRankingClient items={items} avgTurnout={avgTurnout} />
        </div>

        {/* Vote quality breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Calidad del Voto</h2>
            <p className="text-xs text-slate-400">
              Distribución de votos emitidos a nivel nacional
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Votos válidos", value: totalCast - totalNull - totalBlank, color: "bg-blue-500" },
              { label: "Votos nulos", value: totalNull, color: "bg-red-500" },
              { label: "Votos en blanco", value: totalBlank, color: "bg-slate-400" },
            ].map(({ label, value, color }) => {
              const pct = totalCast > 0 ? (value / totalCast) * 100 : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-700 font-mono">{fmt.pct(pct)} · {fmt.num(value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="border-slate-200" />

          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Resumen</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">Nulos</p>
                <p className="text-slate-900 font-semibold">{fmt.pct(nullPct)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">En blanco</p>
                <p className="text-slate-900 font-semibold">{fmt.pct(blankPct)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 col-span-2">
                <p className="text-slate-400 text-xs mb-0.5">Electores registrados</p>
                <p className="text-slate-900 font-semibold">{fmt.num(totalRegistered)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="border-slate-200" />

      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Detalle por Departamento</h2>
        <ResultsTable items={items} />
      </div>
    </div>
  )
}
