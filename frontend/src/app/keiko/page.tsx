import {
  KEIKO_TRAJECTORY,
  TRANSFER_SCENARIOS,
  computeProjection,
  CYCLES_BY_YEAR,
  ELECTION_CYCLES,
} from "@/lib/elections-data"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { KeikoTimelineClient, VoteTransferBarClient } from "@/components/charts/ChartsSection"
import CandidateAvatar from "@/components/CandidateAvatar"

// Build opponent info (ideology + fullName) keyed by year
const OPPONENT_BY_YEAR = Object.fromEntries(
  ELECTION_CYCLES.map((c) => {
    if (c.p2) {
      const w = c.p2.candidates.find((x) => x.is_winner)
      return [c.year, w ? { shortName: w.short_name, fullName: w.name, ideology: w.ideology } : null]
    }
    const opp = c.p1.candidates.find((x) => x.is_finalist && !x.is_keiko)
    return [c.year, opp ? { shortName: opp.short_name, fullName: opp.name, ideology: opp.ideology } : null]
  })
)

export default function KeikoPage() {
  const cycle2026 = CYCLES_BY_YEAR[2026]
  const scenarios = TRANSFER_SCENARIOS.map((s) => ({ ...s, projection: computeProjection(s) }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">¿Le toca a Keiko?</h1>
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">
            4 elecciones · 4 segundos lugares
          </Badge>
        </div>
        <p className="text-slate-500 text-sm">
          Análisis comparativo 2011–2026 · Fuente: Resultados Oficiales ONPE
        </p>
      </div>

      {/* Election summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KEIKO_TRAJECTORY.map((e) => {
          const opp = OPPONENT_BY_YEAR[e.year]
          return (
            <div key={e.year} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium">{e.label}</span>
                {e.won === null ? (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">P2 pendiente</Badge>
                ) : e.won ? (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Ganó</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">Perdió</Badge>
                )}
              </div>

              {/* Candidate avatars — rival left, Keiko right (badge "Perdió" top-right aligns with Keiko) */}
              <div className="flex items-center gap-2">
                {opp && (
                  <div className="flex flex-col items-center gap-0.5">
                    <CandidateAvatar shortName={opp.shortName} fullName={opp.fullName} ideology={opp.ideology} size={44} />
                    <span className="text-[10px] text-slate-500 font-medium">{opp.shortName}</span>
                  </div>
                )}
                <span className="text-slate-300 text-xs font-light flex-1 text-center">vs</span>
                <div className="flex flex-col items-center gap-0.5">
                  <CandidateAvatar shortName="Fujimori" fullName="Keiko Fujimori Higuchi" ideology="right" size={44} />
                  <span className="text-[10px] text-orange-600 font-semibold">Keiko</span>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-xs">P1 Fujimori</p>
                <p className="text-slate-900 font-bold text-xl">{e.p1_pct.toFixed(2)}%</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-xs">P2 Fujimori</p>
                  <p className={`font-semibold text-sm ${e.p2_pct != null ? "text-orange-600" : "text-slate-300"}`}>
                    {e.p2_pct != null ? `${e.p2_pct.toFixed(2)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">vs {e.opponent_short ?? "—"}</p>
                  <p className={`font-semibold text-sm ${e.opponent_p2_pct != null ? "text-slate-700" : "text-slate-300"}`}>
                    {e.opponent_p2_pct != null ? `${e.opponent_p2_pct.toFixed(2)}%` : "—"}
                  </p>
                </div>
              </div>
              {e.margin_pp !== null && (
                <p className="text-xs text-slate-400 border-t border-slate-100 pt-2">
                  Diferencia:{" "}
                  <span className={e.margin_pp < 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
                    {e.margin_pp > 0 ? "+" : ""}{e.margin_pp.toFixed(2)} pp
                  </span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      <Separator className="border-slate-200" />

      {/* Main chart + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Desempeño en P1 vs P2</h2>
          <p className="text-xs text-slate-400 mb-4">
            Naranja = P1 · Rojo = P2 perdida · Verde = P2 ganada · Azul = pendiente · Línea = umbral 50%
          </p>
          <KeikoTimelineClient trajectory={KEIKO_TRAJECTORY} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">El "Techo Fujimori"</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            En cada segunda vuelta, independientemente del oponente, Fujimori converge hacia el ~49%.
            Su voto en P1 varía radicalmente, pero en P2 siempre es bloqueada por una coalición anti-fujimorista.
          </p>

          <div className="space-y-3">
            {KEIKO_TRAJECTORY.filter((e) => !e.p2_pending).map((e) => {
              const mult = e.p1_votes > 0 && e.p2_votes != null ? e.p2_votes / e.p1_votes : null
              const gap = e.p2_pct != null ? 50 - e.p2_pct : null
              return (
                <div key={e.year} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-700 text-xs font-medium">{e.year} vs {e.opponent_short}</span>
                    <span className="text-red-600 text-xs font-mono font-semibold">
                      {gap != null ? `−${gap.toFixed(2)} pp` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${((e.p2_pct ?? 0) / 55) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-slate-400">P2: {e.p2_pct?.toFixed(2)}%</span>
                    {mult && <span className="text-slate-400">{mult.toFixed(2)}× multiplicador</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Separator className="border-slate-200" />

      {/* 2026 Projection */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Proyección 2026: Segunda Vuelta</h2>
        <p className="text-slate-500 text-sm mb-1">
          Fujimori (17.19%) vs Sánchez (12.04%) · Votos disponibles de candidatos eliminados
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Proyecciones calibradas con patrones históricos de transferencia electoral (EG 2011, 2016, 2021) ·
          Referencia: Inferencia Ecológica (King 1997) · ONPE.
          No constituyen predicciones — el voto es secreto.
        </p>

        {/* Range summary strip */}
        {(() => {
          const keikoPcts = scenarios.map((s) => s.projection.keiko_pct)
          const kMin = Math.round(Math.min(...keikoPcts))
          const kMax = Math.round(Math.max(...keikoPcts))
          const sMin = Math.round(100 - kMax)
          const sMax = Math.round(100 - kMin)
          return (
            <div className="flex flex-wrap gap-4 mb-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Rango Fujimori (entre escenarios)</p>
                <p className="text-orange-600 font-bold text-xl">{kMin}–{kMax}%</p>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <p className="text-slate-400 text-xs mb-0.5">Rango Sánchez (entre escenarios)</p>
                <p className="text-cyan-600 font-bold text-xl">{sMin}–{sMax}%</p>
              </div>
              <p className="text-slate-400 text-xs self-end ml-auto">
                Valores aproximados · La incertidumbre real puede ser mayor
              </p>
            </div>
          )
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Escenarios de transferencia de votos</h3>
            <p className="text-xs text-slate-400 mb-4">
              % votos válidos proyectados para Fujimori · Línea naranja = 50%
            </p>
            <VoteTransferBarClient scenarios={TRANSFER_SCENARIOS} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Detalle por escenario</h3>
            {scenarios.map((s, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-slate-800 text-xs font-medium">{s.label}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${s.projection.keiko_pct > 50
                      ? "border-orange-300 text-orange-700 bg-orange-50"
                      : "border-cyan-300 text-cyan-700 bg-cyan-50"}`}
                  >
                    {s.projection.keiko_pct > 50 ? "Fujimori adelante" : "Sánchez adelante"}
                  </Badge>
                </div>
                <p className="text-slate-500 text-xs">{s.description}</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-slate-50 rounded p-2 border border-slate-100">
                    <p className="text-slate-400 text-xs">Fujimori</p>
                    <p className="text-orange-600 font-semibold text-sm">~{Math.round(s.projection.keiko_pct)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2 border border-slate-100">
                    <p className="text-slate-400 text-xs">Sánchez</p>
                    <p className="text-cyan-600 font-semibold text-sm">~{Math.round(s.projection.sanchez_pct)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="border-slate-200" />

      {/* P1 candidates table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Candidatos eliminados EG 2026 P1 — votos disponibles para transferencia
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Candidato</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Partido</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Votos válidos</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">Votos</th>
              </tr>
            </thead>
            <tbody>
              {cycle2026.p1.candidates.filter((c) => !c.is_finalist).map((c, i, arr) => (
                <tr key={c.short_name} className={i < arr.length - 1 ? "border-b border-slate-100" : ""}>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">{c.short_name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.party}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{c.vote_pct.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-400">
                    {c.votes ? `${(c.votes / 1_000_000).toFixed(2)}M` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * Los porcentajes de transferencia son estimaciones estadísticas. No constituyen predicciones
          definitivas. Fuentes: ONPE resultados oficiales 2011–2026.
        </p>
      </div>
    </div>
  )
}
