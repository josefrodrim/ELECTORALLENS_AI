"use client"

import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type ScatterShapeProps } from "recharts"
import type { ResultItem } from "@/lib/types"
import { CANDIDATE_COLORS } from "@/lib/format"

interface Props {
  items: ResultItem[]
}

export default function PolarizationMap({ items }: Props) {
  const data = items
    .filter((r) => r.turnout_pct != null && r.winning_margin_pct != null)
    .map((r) => {
      const castillo = r.candidates.find((c) => c.candidate_code === "F1")
      return {
        name: r.geo_name,
        turnout: r.turnout_pct!,
        margin: r.winning_margin_pct!,
        castillo_pct: castillo?.vote_pct ?? 50,
        leading: r.leading_candidate_code ?? "F2",
        voters: r.registered_voters ?? 100000,
      }
    })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
        <XAxis
          dataKey="turnout"
          name="Participación"
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Participación (%)", position: "insideBottom", offset: -10, fill: "#52525b", fontSize: 11 }}
        />
        <YAxis
          dataKey="margin"
          name="Margen"
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          label={{ value: "Margen (%)", angle: -90, position: "insideLeft", fill: "#52525b", fontSize: 11 }}
        />
        <ZAxis dataKey="voters" range={[40, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "#3f3f46" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                <p className="text-white font-medium">{d.name}</p>
                <p className="text-zinc-400">Participación: {d.turnout.toFixed(1)}%</p>
                <p className="text-zinc-400">Margen: {d.margin.toFixed(1)}%</p>
                <p className="text-zinc-400">Castillo: {d.castillo_pct.toFixed(1)}%</p>
              </div>
            )
          }}
        />
        <Scatter
          data={data}
          shape={(props: ScatterShapeProps) => {
            const p = props.payload as typeof data[0] | undefined
            const fill = p?.leading === "F1" ? CANDIDATE_COLORS.F1 : CANDIDATE_COLORS.F2
            return <circle cx={props.cx ?? 0} cy={props.cy ?? 0} r={6} fill={fill} fillOpacity={0.8} />
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
