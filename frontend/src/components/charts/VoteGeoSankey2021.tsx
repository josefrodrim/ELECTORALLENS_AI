"use client"

import { ResponsiveSankey, type SankeyNodeDatum } from "@nivo/sankey"

export type GeoNode = { id: string; nodeColor: string; label: string }
export type GeoLink = { source: string; target: string; value: number }

type NodeDatum = SankeyNodeDatum<GeoNode, GeoLink>

interface Props {
  nodes: GeoNode[]
  links: GeoLink[]
}

function fmtM(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : `${(v / 1_000).toFixed(0)}K`
}

const NIVO_THEME = {
  background: "transparent",
  text: { fontSize: 11, fill: "#64748b" },
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

export default function VoteGeoSankey2021({ nodes, links }: Props) {
  const labelById = Object.fromEntries(nodes.map((n) => [n.id, n.label]))
  const colorById = Object.fromEntries(nodes.map((n) => [n.id, n.nodeColor]))

  return (
    <div style={{ height: 580 }}>
      <ResponsiveSankey<GeoNode, GeoLink>
        data={{ nodes, links }}
        theme={NIVO_THEME}
        margin={{ top: 16, right: 190, bottom: 16, left: 170 }}
        align="justify"
        sort="input"
        colors={(node) => node.nodeColor}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeThickness={16}
        nodeSpacing={10}
        nodeBorderWidth={0}
        nodeBorderRadius={4}
        enableLinkGradient={false}
        linkOpacity={0.4}
        linkHoverOpacity={0.85}
        linkHoverOthersOpacity={0.08}
        linkContract={2}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={14}
        labelTextColor={{ from: "color", modifiers: [["brighter", 1.2]] }}
        label={(node) => labelById[node.id] ?? node.id}
        nodeTooltip={({ node }) => {
          const n = node as unknown as NodeDatum & { value: number }
          return (
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#0f172a", minWidth: 160,
            }}>
              <p style={{ color: colorById[n.id] ?? "#000", fontWeight: 600, marginBottom: 2 }}>
                {labelById[n.id] ?? n.id}
              </p>
              <p style={{ color: "#64748b" }}>{fmtM(n.value)} votos</p>
            </div>
          )
        }}
        linkTooltip={({ link }) => {
          const src = link.source as unknown as NodeDatum
          const tgt = link.target as unknown as NodeDatum
          return (
            <div style={{
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#0f172a", minWidth: 200,
            }}>
              <p style={{ marginBottom: 4 }}>
                <span style={{ color: colorById[src.id], fontWeight: 600 }}>{labelById[src.id]}</span>
                <span style={{ color: "#94a3b8", margin: "0 6px" }}>→</span>
                <span style={{ color: colorById[tgt.id], fontWeight: 600 }}>{labelById[tgt.id]}</span>
              </p>
              <p style={{ color: "#64748b" }}>{fmtM(link.value)} votos estimados</p>
            </div>
          )
        }}
      />
    </div>
  )
}
