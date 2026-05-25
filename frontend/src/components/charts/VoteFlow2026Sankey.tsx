"use client"

import { useState } from "react"
import { ResponsiveSankey, type SankeyNodeDatum, type SankeyCustomLayer } from "@nivo/sankey"
import { TRANSFER_SCENARIOS, CYCLES_BY_YEAR, computeProjection } from "@/lib/elections-data"
import { CANDIDATE_PHOTOS } from "@/lib/candidate-photos"

type NodeExtra = { id: string; nodeColor: string; label: string }
type Link2026 = { source: string; target: string; value: number }
type NodeDatum = SankeyNodeDatum<NodeExtra, Link2026>

const NIVO_THEME = {
  background: "transparent",
  text: { fontSize: 13, fill: "#475569" },
  tooltip: {
    container: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      color: "#0f172a",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
    },
  },
}

const IDEOLOGY_COLORS: Record<string, string> = {
  right: "#ef4444",
  "center-right": "#fb923c",
  center: "#64748b",
  "center-left": "#60a5fa",
  left: "#818cf8",
}

function fmtM(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : `${(v / 1_000).toFixed(0)}K`
}

function makePhotoLayer(photoMap: Record<string, string>): SankeyCustomLayer<NodeExtra, Link2026> {
  return ({ nodes }) => {
    const R = 14
    return (
      <g>
        <defs>
          {nodes.map((node) => {
            if (!photoMap[node.id] || node.height < R) return null
            const sid = `clipsan26_${node.id.replace(/[^a-zA-Z0-9]/g, "_")}`
            return (
              <clipPath key={sid} id={sid}>
                <circle cx={node.x} cy={node.y} r={R} />
              </clipPath>
            )
          })}
        </defs>
        {nodes.map((node) => {
          const photo = photoMap[node.id]
          if (!photo || node.height < R) return null
          const sid = `clipsan26_${node.id.replace(/[^a-zA-Z0-9]/g, "_")}`
          return (
            <image
              key={node.id}
              href={photo}
              x={node.x - R}
              y={node.y - R}
              width={R * 2}
              height={R * 2}
              clipPath={`url(#${sid})`}
            />
          )
        })}
      </g>
    )
  }
}

function buildData(scenarioIndex: number) {
  const scenario = TRANSFER_SCENARIOS[scenarioIndex]
  const projection = computeProjection(scenario)
  const fujimoriWins = projection.keiko_pct >= projection.sanchez_pct

  const p1 = CYCLES_BY_YEAR[2026].p1
  const finalists = p1.candidates.filter((c) => c.is_finalist)
  const eliminated = p1.candidates.filter((c) => !c.is_finalist)

  // Finalists on the left: winner P1 always on top
  const finalistLeftNodes: NodeExtra[] = [...finalists]
    .sort((a, _b) => fujimoriWins
      ? (a.short_name === "Fujimori" ? -1 : 1)
      : (a.short_name === "Sánchez"  ? -1 : 1))
    .map((c) => ({
      id: `${c.short_name}_p1`,
      nodeColor: c.short_name === "Fujimori" ? "#f97316" : "#22d3ee",
      label: `${c.short_name} P1  ${c.vote_pct.toFixed(1)}%`,
    }))

  const eliminatedNodes: NodeExtra[] = eliminated.map((c) => ({
    id: c.short_name,
    nodeColor: IDEOLOGY_COLORS[c.ideology ?? "center"] ?? "#64748b",
    label: `${c.short_name}  ${c.vote_pct.toFixed(1)}%`,
  }))

  // Right nodes: winner on top
  const rightNodes: NodeExtra[] = fujimoriWins
    ? [
        { id: "Fujimori",  nodeColor: "#f97316", label: "Fujimori P2" },
        { id: "Sánchez",   nodeColor: "#22d3ee", label: "Sánchez P2"  },
        { id: "Abstención", nodeColor: "#52525b", label: "Abstención"  },
      ]
    : [
        { id: "Sánchez",   nodeColor: "#22d3ee", label: "Sánchez P2"  },
        { id: "Fujimori",  nodeColor: "#f97316", label: "Fujimori P2" },
        { id: "Abstención", nodeColor: "#52525b", label: "Abstención"  },
      ]

  const links: Link2026[] = []

  // Finalist own votes flow 100% to themselves (matches computeProjection assumption)
  for (const c of finalists) {
    links.push({ source: `${c.short_name}_p1`, target: c.short_name, value: c.votes })
  }

  // Eliminated candidates transfer per scenario
  for (const c of eliminated) {
    const transfer = scenario.transfers[c.short_name] ?? [30, 50, 20]
    const v = c.votes
    if (transfer[0] > 0) links.push({ source: c.short_name, target: "Fujimori", value: Math.round((v * transfer[0]) / 100) })
    if (transfer[1] > 0) links.push({ source: c.short_name, target: "Sánchez", value: Math.round((v * transfer[1]) / 100) })
    if (transfer[2] > 0) links.push({ source: c.short_name, target: "Abstención", value: Math.round((v * transfer[2]) / 100) })
  }

  return { nodes: [...finalistLeftNodes, ...eliminatedNodes, ...rightNodes], links }
}

export default function VoteFlow2026Sankey() {
  const [idx, setIdx] = useState(0)

  const scenario = TRANSFER_SCENARIOS[idx]
  const projection = computeProjection(scenario)
  const { nodes, links } = buildData(idx)

  const labelById = Object.fromEntries(nodes.map((n) => [n.id, n.label]))
  const colorById = Object.fromEntries(nodes.map((n) => [n.id, n.nodeColor]))

  // photo map: strip "_p1" suffix to find the photo for finalist source nodes
  const photoMap: Record<string, string> = {}
  for (const n of nodes) {
    const baseId = n.id.replace(/_p1$/, "")
    const photo = CANDIDATE_PHOTOS[n.id] ?? CANDIDATE_PHOTOS[baseId]
    if (photo) photoMap[n.id] = photo
  }
  const photoLayer = makePhotoLayer(photoMap)

  return (
    <div className="space-y-4">
      {/* Scenario selector */}
      <div className="flex flex-wrap gap-2">
        {TRANSFER_SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              i === idx
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scenario description + projected result */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
        <p className="text-slate-500 text-xs max-w-lg">{scenario.description}</p>
        <div className="flex gap-6 text-sm font-mono">
          <span>
            <span className="text-orange-600 font-bold">~{Math.round(projection.keiko_pct)}%</span>
            <span className="text-slate-400 text-xs ml-1">Fujimori</span>
          </span>
          <span>
            <span className="text-cyan-600 font-bold">~{Math.round(projection.sanchez_pct)}%</span>
            <span className="text-slate-400 text-xs ml-1">Sánchez</span>
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
            projection.keiko_pct > 50
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-cyan-50 border-cyan-200 text-cyan-700"
          }`}>
            {projection.keiko_pct > 50 ? "Fujimori adelante" : "Sánchez adelante"}
          </span>
        </div>
      </div>

      {/* Ideology legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {[
          { color: "#ef4444", label: "Derecha" },
          { color: "#fb923c", label: "Centro-derecha" },
          { color: "#94a3b8", label: "Centro" },
          { color: "#60a5fa", label: "Centro-izquierda" },
          { color: "#818cf8", label: "Izquierda" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
            <span className="text-slate-400">{item.label}</span>
          </span>
        ))}
      </div>

      {/* Sankey */}
      <div style={{ height: 540 }}>
        <ResponsiveSankey<NodeExtra, Link2026>
          data={{ nodes, links }}
          theme={NIVO_THEME}
          margin={{ top: 24, right: 200, bottom: 24, left: 210 }}
          align="justify"
          sort="input"
          layers={["links", "nodes", photoLayer, "labels", "legends"]}
          colors={(node) => node.nodeColor}
          nodeOpacity={1}
          nodeHoverOpacity={1}
          nodeThickness={36}
          nodeSpacing={16}
          nodeBorderWidth={0}
          nodeBorderRadius={5}
          enableLinkGradient={true}
          linkOpacity={0.5}
          linkHoverOpacity={0.88}
          linkHoverOthersOpacity={0.12}
          linkContract={3}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={22}
          labelTextColor={{ from: "color", modifiers: [["darker", 0.6]] }}
          label={(node) => labelById[node.id] ?? node.id}
          nodeTooltip={({ node }) => {
            const n = node as unknown as NodeDatum & { value: number }
            return (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#0f172a",
                  minWidth: 160,
                }}
              >
                <p style={{ color: colorById[n.id] ?? "#fff", fontWeight: 600, marginBottom: 2 }}>
                  {labelById[n.id] ?? n.id}
                </p>
                <p style={{ color: "#64748b" }}>{fmtM(n.value)} votos</p>
              </div>
            )
          }}
          linkTooltip={({ link }) => {
            const src = link.source as unknown as NodeDatum
            const tgt = link.target as unknown as NodeDatum
            const srcLabel = labelById[src.id] ?? src.id
            const tgtLabel = labelById[tgt.id] ?? tgt.id
            const srcColor = colorById[src.id] ?? "#fff"
            const tgtColor = colorById[tgt.id] ?? "#fff"
            return (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#0f172a",
                  minWidth: 200,
                }}
              >
                <p style={{ marginBottom: 4 }}>
                  <span style={{ color: srcColor, fontWeight: 600 }}>{srcLabel}</span>
                  <span style={{ color: "#71717a", margin: "0 6px" }}>→</span>
                  <span style={{ color: tgtColor, fontWeight: 600 }}>{tgtLabel}</span>
                </p>
                <p style={{ color: "#64748b" }}>{fmtM(link.value)} votos estimados</p>
              </div>
            )
          }}
        />
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Proyecciones calibradas con patrones históricos de transferencia electoral (EG 2011, 2016, 2021) — Referencia: Inferencia Ecológica (King 1997) · ONPE.
        El voto es secreto; estos flujos son aproximaciones estadísticas, no predicciones.
      </p>
    </div>
  )
}
