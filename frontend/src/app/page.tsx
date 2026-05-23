import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ELECTION_CYCLES, KEIKO_TRAJECTORY } from "@/lib/elections-data"
import CandidateAvatar from "@/components/CandidateAvatar"

function fmtM(v: number) {
  return `${(v / 1_000_000).toFixed(2)}M`
}

export default function HomePage() {
  return (
    <div className="space-y-12">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">Datos ONPE</Badge>
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">4 ciclos electorales</Badge>
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">Análisis estadístico</Badge>
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
            EG 2026 · 100% actas
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          Inteligencia Electoral<br />
          <span className="text-slate-400 text-2xl font-normal">Perú · Elecciones Generales 2011–2026</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Análisis estadístico de resultados electorales oficiales ONPE. Incluye flujos de votos
          entre rondas, proyecciones de segunda vuelta y patrones históricos de transferencia.
          Todos los datos son de fuente pública y el análisis es estrictamente descriptivo.
        </p>
      </div>

      <Separator className="border-slate-200" />

      {/* ── Election cycles grid ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Ciclos electorales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ELECTION_CYCLES.map((cycle, i) => {
            const kEntry = KEIKO_TRAJECTORY[i]
            const p1Leader = [...cycle.p1.candidates]
              .filter((c) => c.short_name !== "Otros")
              .sort((a, b) => b.vote_pct - a.vote_pct)[0]
            const p2Winner = cycle.p2?.candidates.find((c) => c.is_winner)
            const isCompleted = cycle.p2 !== null

            return (
              <Link
                key={cycle.year}
                href={`/${cycle.year}`}
                className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 font-bold text-lg">{cycle.label}</span>
                  {isCompleted ? (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Completado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">P2 pendiente</Badge>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-1">Primera Vuelta · líder</p>
                  <p className="text-slate-800 font-semibold">{p1Leader?.short_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(p1Leader?.vote_pct ?? 0) / 45 * 100}%` }}
                      />
                    </div>
                    <span className="text-orange-600 text-xs font-mono font-semibold">{p1Leader?.vote_pct.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  {isCompleted && p2Winner ? (
                    <>
                      <p className="text-slate-400 text-xs mb-2">Segunda Vuelta · presidente electo</p>
                      <div className="flex items-center gap-2">
                        <CandidateAvatar shortName={p2Winner.short_name} fullName={p2Winner.name} ideology={p2Winner.ideology} size={32} />
                        <div>
                          <p className="text-slate-800 font-semibold text-sm">{p2Winner.short_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-green-700 text-xs font-mono font-semibold">{p2Winner.vote_pct.toFixed(2)}%</span>
                            {kEntry.margin_pp != null && (
                              <span className="text-slate-400 text-xs">+{Math.abs(kEntry.margin_pp).toFixed(2)} pp</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-400 text-xs mb-2">Segunda Vuelta · finalistas</p>
                      <div className="flex items-center gap-2">
                        {cycle.p1.candidates.filter((c) => c.is_finalist).map((c) => (
                          <div key={c.short_name} className="flex items-center gap-1.5">
                            <CandidateAvatar shortName={c.short_name} fullName={c.name} ideology={c.ideology} size={28} />
                            <span className="text-slate-600 text-xs">{c.short_name}</span>
                          </div>
                        ))}
                        <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700 bg-blue-50">
                          Pendiente
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
                  <span>{fmtM(cycle.p1.registered)} electores</span>
                  <span>Ver →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Separator className="border-slate-200" />

      {/* ── Analysis features ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Análisis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <Link href="/keiko" className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-orange-200 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold text-sm">Patrón Keiko</span>
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-400">4 elecciones</Badge>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Comparativo del desempeño de Fujimori en P1 y P2 de 2011 a 2026. Análisis del
              "techo electoral" y proyecciones de transferencia para la segunda vuelta 2026.
            </p>
            <p className="text-orange-600 text-xs group-hover:text-orange-700">Ver análisis →</p>
          </Link>

          <Link href="/resultados" className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-bold text-sm">Resultados por Territorio</span>
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-400">API</Badge>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Drill-down por departamento y provincia. Resultados EG 2021 P2 desde la API
              FastAPI con datos ONPE procesados.
            </p>
            <p className="text-slate-500 text-xs group-hover:text-slate-700">Ver resultados →</p>
          </Link>

          <Link href="/participacion" className="group rounded-xl border border-slate-200 bg-white shadow-sm p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-bold text-sm">Participación Electoral</span>
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-400">API</Badge>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Ranking de participación y votos nulos/blancos por departamento. Identifica
              outliers estadísticos en el comportamiento del electorado.
            </p>
            <p className="text-slate-500 text-xs group-hover:text-slate-700">Ver participación →</p>
          </Link>

        </div>
      </div>

      <Separator className="border-slate-200" />

      {/* ── Quick stats strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Ciclos analizados",  value: "4",                          sub: "EG 2011 · 2016 · 2021 · 2026" },
          { label: "Electores 2026",     value: fmtM(ELECTION_CYCLES[3].p1.registered), sub: `${ELECTION_CYCLES[3].p1.turnout_pct}% participación P1` },
          { label: "Votos válidos 2026", value: fmtM(ELECTION_CYCLES[3].p1.valid),      sub: "100% actas procesadas" },
          {
            label: "Finalistas 2026",
            value: ELECTION_CYCLES[3].p1.candidates.filter((c) => c.is_finalist).map((c) => c.short_name).join(" · "),
            sub: "Segunda vuelta pendiente",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className="text-slate-900 font-bold text-lg leading-tight">{s.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-300">
        Fuente: Resultados Oficiales ONPE · Datos públicos · Análisis estrictamente descriptivo
      </p>
    </div>
  )
}
