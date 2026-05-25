"use client"

import { ResponsiveSankey, type SankeyNodeDatum, type SankeyCustomLayer } from "@nivo/sankey"
import type { VoteFlow, FlowLink } from "@/lib/vote-flows"
import { CANDIDATE_PHOTOS } from "@/lib/candidate-photos"

type NodeExtra = { id: string; nodeColor: string; label: string }
type NodeDatum = SankeyNodeDatum<NodeExtra, FlowLink>

function makePhotoLayer(photoMap: Record<string, string>): SankeyCustomLayer<NodeExtra, FlowLink> {
  return ({ nodes }) => {
    const R = 17
    return (
      <g>
        <defs>
          {nodes.map((node) => {
            if (!photoMap[node.id] || node.height < R * 2) return null
            const sid = `clipsan_${node.id.replace(/[^a-zA-Z0-9]/g, "_")}`
            return (
              <clipPath key={sid} id={sid}>
                <circle cx={node.x} cy={node.y} r={R} />
              </clipPath>
            )
          })}
        </defs>
        {nodes.map((node) => {
          const photo = photoMap[node.id]
          if (!photo || node.height < R * 2) return null
          const sid = `clipsan_${node.id.replace(/[^a-zA-Z0-9]/g, "_")}`
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

function fmtM(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : `${(v / 1_000).toFixed(0)}K`
}

interface Props {
  flow: VoteFlow
  height?: number
}

export default function VoteFlowSankey({ flow, height = 460 }: Props) {
  const nodes = flow.nodes.map((n) => ({ id: n.id, nodeColor: n.color, label: n.label }))

  // build lookup maps
  const labelById = Object.fromEntries(nodes.map((n) => [n.id, n.label]))
  const colorById = Object.fromEntries(nodes.map((n) => [n.id, n.nodeColor]))

  const data = { nodes, links: flow.links }

  // photo map: strip "-p1" / "-p2" suffix to get candidate short name
  const photoMap: Record<string, string> = {}
  for (const n of flow.nodes) {
    const name = n.id.replace(/-p[12]$/, "")
    const photo = CANDIDATE_PHOTOS[name]
    if (photo) photoMap[n.id] = photo
  }
  const photoLayer = makePhotoLayer(photoMap)

  return (
    <div style={{ height }}>
      <ResponsiveSankey<NodeExtra, FlowLink>
        data={data}
        theme={NIVO_THEME}
        margin={{ top: 24, right: 190, bottom: 24, left: 190 }}
        align="justify"
        sort="auto"
        layers={["links", "nodes", photoLayer, "labels", "legends"]}

        // node styling
        colors={(node) => node.nodeColor}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeThickness={36}
        nodeSpacing={18}
        nodeBorderWidth={0}
        nodeBorderRadius={5}

        // link styling
        enableLinkGradient={true}
        linkOpacity={0.5}
        linkHoverOpacity={0.88}
        linkHoverOthersOpacity={0.12}
        linkContract={3}

        // labels
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={22}
        labelTextColor={{ from: "color", modifiers: [["darker", 0.6]] }}
        label={(node) => labelById[node.id] ?? node.id}

        // node tooltip
        nodeTooltip={({ node }) => {
          const n = node as unknown as NodeDatum & { value: number }
          return (
            <div
              style={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#e4e4e7",
                minWidth: 160,
              }}
            >
              <p style={{ color: colorById[n.id] ?? "#0f172a", fontWeight: 600, marginBottom: 2 }}>
                {labelById[n.id] ?? n.id}
              </p>
              <p style={{ color: "#64748b" }}>{fmtM(n.value)} votos</p>
            </div>
          )
        }}

        // link tooltip
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
                background: "#18181b",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "#0f172a",
                minWidth: 200,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
              }}
            >
              <p style={{ marginBottom: 4 }}>
                <span style={{ color: srcColor, fontWeight: 600 }}>{srcLabel}</span>
                <span style={{ color: "#94a3b8", margin: "0 6px" }}>→</span>
                <span style={{ color: tgtColor, fontWeight: 600 }}>{tgtLabel}</span>
              </p>
              <p style={{ color: "#64748b" }}>{fmtM(link.value)} votos estimados</p>
            </div>
          )
        }}
      />
    </div>
  )
}
