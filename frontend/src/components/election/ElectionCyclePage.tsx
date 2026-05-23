import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ElectionCycle, Round, Candidate } from "@/lib/elections-data"
import { VOTE_FLOWS } from "@/lib/vote-flows"
import { VoteFlowSankeyClient, VoteFlow2026SankeyClient } from "@/components/charts/ChartsSection"
import CandidateAvatar from "@/components/CandidateAvatar"
import Link from "next/link"

// ─── helpers ─────────────────────────────────────────────────────────────────

const IDEOLOGY_LABEL: Record<string, string> = {
  right:          "Derecha",
  "center-right": "Centro-derecha",
  center:         "Centro",
  "center-left":  "Centro-izquierda",
  left:           "Izquierda",
}

const IDEOLOGY_DOT: Record<string, string> = {
  right:          "bg-red-500",
  "center-right": "bg-orange-400",
  center:         "bg-slate-400",
  "center-left":  "bg-blue-500",
  left:           "bg-indigo-600",
}

function fmt(n: number) {
  return n.toLocaleString("es-PE")
}

// ─── KPI strip ───────────────────────────────────────────────────────────────

function RoundKPIs({ round }: { round: Round }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Electores hábiles",  val: `${(round.registered/1_000_000).toFixed(2)}M`, sub: fmt(round.registered) },
        { label: "Votos emitidos",     val: `${(round.cast/1_000_000).toFixed(2)}M`,        sub: `Participación: ${round.turnout_pct}%` },
        { label: "Votos válidos",      val: `${(round.valid/1_000_000).toFixed(2)}M`,       sub: `${((round.valid/round.cast)*100).toFixed(2)}% del emitido` },
        { label: "Nulos + Blancos",    val: `${round.null_blank_pct.toFixed(2)}%`,           sub: `${fmt(round.null_blank)} votos` },
      ].map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
          <p className="text-slate-900 font-bold text-lg">{kpi.val}</p>
          <p className="text-slate-400 text-xs">{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── candidate row ────────────────────────────────────────────────────────────

function CandidateRow({ candidate, maxPct, isP1 }: { candidate: Candidate; maxPct: number; isP1: boolean }) {
  const barColor = candidate.is_keiko
    ? "bg-orange-500"
    : candidate.is_winner
    ? "bg-green-600"
    : candidate.is_finalist
    ? "bg-blue-600"
    : candidate.ideology === "right"       ? "bg-red-500/70"
    : candidate.ideology === "center-right"? "bg-orange-400/60"
    : candidate.ideology === "center-left" ? "bg-blue-400/60"
    : candidate.ideology === "left"        ? "bg-indigo-600/70"
    : "bg-slate-300"

  const nameColor = candidate.is_keiko
    ? "text-orange-600"
    : candidate.is_winner
    ? "text-green-700"
    : candidate.is_finalist
    ? "text-blue-700"
    : "text-slate-700"

  return (
    <div className="flex items-center gap-3 py-0.5">
      <CandidateAvatar shortName={candidate.short_name} fullName={candidate.name} ideology={candidate.ideology} size={36} />

      <div className="w-28 shrink-0">
        <p className={`text-xs font-semibold leading-tight ${nameColor}`}>{candidate.short_name}</p>
        <p className="text-slate-400 text-[10px] leading-tight truncate">{candidate.party}</p>
      </div>

      <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
        <div className={`h-full rounded-md ${barColor}`} style={{ width: `${(candidate.vote_pct/maxPct)*100}%` }} />
        <span className="absolute inset-y-0 left-2 flex items-center text-xs text-white font-semibold drop-shadow-sm">
          {candidate.vote_pct.toFixed(2)}%
        </span>
      </div>

      <div className="w-16 text-right text-xs text-slate-400 font-mono shrink-0">
        {(candidate.votes/1_000_000).toFixed(2)}M
      </div>

      <div className="w-24 shrink-0">
        {isP1 && candidate.is_finalist && (
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">Pasa a P2</Badge>
        )}
        {!isP1 && candidate.is_winner && (
          <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Presidente</Badge>
        )}
      </div>
    </div>
  )
}

// ─── round block ─────────────────────────────────────────────────────────────

function RoundBlock({ round, isP1 }: { round: Round; isP1: boolean }) {
  const sorted = [...round.candidates].sort((a, b) => b.vote_pct - a.vote_pct)
  const maxPct = sorted[0]?.vote_pct ?? 100
  const mainCandidates = sorted.filter((c) => c.short_name !== "Otros")
  const otros = sorted.find((c) => c.short_name === "Otros")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={`text-sm font-semibold px-3 py-1 ${
          isP1
            ? "border-amber-300 text-amber-700 bg-amber-50"
            : "border-violet-300 text-violet-700 bg-violet-50"
        }`}>
          {round.round_label}
        </Badge>
        <span className="text-slate-500 text-sm">{round.date}</span>
      </div>

      <RoundKPIs round={round} />

      {/* Winner banner for P2 */}
      {!isP1 && (() => {
        const winner = round.candidates.find((c) => c.is_winner)
        const runnerUp = round.candidates.find((c) => !c.is_winner)
        if (!winner) return null
        const margin = winner.vote_pct - (runnerUp?.vote_pct ?? 0)
        return (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CandidateAvatar shortName={winner.short_name} fullName={winner.name} ideology={winner.ideology} size={52} />
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Presidente electo</p>
                <p className="text-slate-900 font-bold text-xl">{winner.name}</p>
                <p className="text-slate-500 text-sm">{winner.party}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-700 font-bold text-4xl tabular-nums">{winner.vote_pct.toFixed(2)}%</p>
              <p className="text-slate-500 text-xs mt-1">
                Ventaja: <span className="text-green-700 font-semibold">+{margin.toFixed(2)} pp</span>
              </p>
            </div>
          </div>
        )
      })()}

      <div className="space-y-2">
        {mainCandidates.map((c) => (
          <CandidateRow key={c.short_name} candidate={c} maxPct={maxPct} isP1={isP1} />
        ))}
        {otros && (
          <div className="flex items-center gap-3 opacity-40 py-0.5">
            <div className="w-9 shrink-0" />
            <div className="w-28 shrink-0">
              <span className="text-xs text-slate-400">Otros</span>
            </div>
            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
              <div className="h-full rounded-md bg-slate-300" style={{ width: `${(otros.vote_pct/maxPct)*100}%` }} />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs text-slate-500 font-mono">
                {otros.vote_pct.toFixed(2)}%
              </span>
            </div>
            <div className="w-16 text-right text-xs text-slate-400 font-mono shrink-0">
              {(otros.votes/1_000_000).toFixed(2)}M
            </div>
            <div className="w-24 shrink-0" />
          </div>
        )}
      </div>

      {/* Ideology legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {mainCandidates
          .filter((c) => c.ideology && c.short_name !== "Otros")
          .map((c) => (
            <span key={c.short_name} className="flex items-center gap-1.5 text-slate-500">
              <span className={`inline-block w-2 h-2 rounded-full ${IDEOLOGY_DOT[c.ideology!] ?? "bg-slate-400"}`} />
              {c.short_name} · {IDEOLOGY_LABEL[c.ideology!]}
            </span>
          ))}
      </div>
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function ElectionCyclePage({ cycle }: { cycle: ElectionCycle }) {
  const isCompleted = cycle.p2 !== null

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">{cycle.label}</h1>
          {isCompleted ? (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Completado</Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">P2 pendiente</Badge>
          )}
        </div>
        <p className="text-slate-500 text-sm">
          Resultados Oficiales ONPE · {cycle.p1.round_label}: {cycle.p1.date}
          {cycle.p2 && ` · ${cycle.p2.round_label}: ${cycle.p2.date}`}
        </p>
      </div>

      {/* P1 */}
      <RoundBlock round={cycle.p1} isP1={true} />

      {/* Sankey histórico — only for completed cycles */}
      {(() => {
        const flow = VOTE_FLOWS[cycle.year]
        if (!flow) return null
        const height = flow.nodes.length > 9 ? 620 : 540
        return (
          <>
            <Separator className="border-slate-200" />
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-slate-900">Flujo de votos P1 → P2</h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                  Regresión ecológica · ONPE
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Goodman OLS sobre resultados oficiales ONPE (mesa → 1 800+ distritos) ·
                El voto es secreto; β_ij = fracción estimada de votantes de cada candidato que apoyó a cada finalista
              </p>
              <VoteFlowSankeyClient flow={flow} height={height} />
              <p className="text-xs text-slate-400 mt-3">{flow.note}</p>
            </div>
          </>
        )
      })()}

      <Separator className="border-slate-200" />

      {/* P2 or pending card */}
      {cycle.p2 ? (
        <RoundBlock round={cycle.p2} isP1={false} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center space-y-2">
          <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-violet-300 text-violet-700 bg-violet-50">
            Segunda Vuelta
          </Badge>
          <p className="text-slate-800 text-lg font-semibold mt-3">Pendiente</p>
          <p className="text-slate-500 text-sm">
            Los finalistas están definidos · La segunda vuelta aún no se ha celebrado
          </p>
          <div className="flex justify-center gap-4 mt-4">
            {cycle.p1.candidates.filter((c) => c.is_finalist).map((c) => (
              <div key={c.short_name} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center space-y-2">
                <CandidateAvatar shortName={c.short_name} fullName={c.name} ideology={c.ideology} size={48} />
                <p className="text-slate-800 font-semibold text-sm">{c.short_name}</p>
                <p className="text-slate-500 text-xs">{c.party}</p>
                <p className="text-orange-600 font-mono text-sm font-semibold">{c.vote_pct.toFixed(2)}% P1</p>
              </div>
            ))}
          </div>
          <Link
            href="/keiko"
            className="inline-flex items-center gap-1.5 mt-4 text-xs px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
          >
            Ver análisis de escenarios →
          </Link>
        </div>
      )}

      {/* 2026 Projected Sankey */}
      {!cycle.p2 && (
        <>
          <Separator className="border-slate-200" />
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Proyección Segunda Vuelta — Flujo de votos estimado
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Distribución estimada de votos de candidatos eliminados hacia los finalistas ·
              Selecciona un escenario
            </p>
            <VoteFlow2026SankeyClient />
          </div>
        </>
      )}

      <p className="text-xs text-slate-400">
        Fuente: Resultados Oficiales ONPE · {cycle.label}
        {cycle.year < 2026 && " · Conteos derivados de porcentajes oficiales × total votos válidos."}
      </p>
    </div>
  )
}
