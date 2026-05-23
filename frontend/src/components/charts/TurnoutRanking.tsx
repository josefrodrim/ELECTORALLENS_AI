"use client"

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ResultItem } from "@/lib/types"
import { CANDIDATE_COLORS, fmt } from "@/lib/format"

interface Props {
  items: ResultItem[]
  avgTurnout: number
}

export default function TurnoutRanking({ items, avgTurnout }: Props) {
  const data = [...items]
    .filter((r) => r.turnout_pct != null)
    .sort((a, b) => (b.turnout_pct ?? 0) - (a.turnout_pct ?? 0))
    .map((r) => ({
      name: r.geo_name.length > 14 ? r.geo_name.slice(0, 14) + "…" : r.geo_name,
      fullName: r.geo_name,
      turnout: r.turnout_pct!,
      leading: r.leading_candidate_code ?? "F2",
    }))

  return (
    <ResponsiveContainer width="100%" height={data.length * 30 + 40}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56, top: 0, bottom: 0 }}>
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine
          x={avgTurnout}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
          label={{ value: `${avgTurnout.toFixed(1)}%`, fill: "#94a3b8", fontSize: 10, position: "insideTopRight" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-md">
                <p className="text-slate-800 font-medium">{d.fullName}</p>
                <p className="text-slate-400">Participación: {fmt.pct(d.turnout)}</p>
              </div>
            )
          }}
        />
        <Bar
          dataKey="turnout"
          radius={[0, 3, 3, 0]}
          label={{
            position: "right",
            formatter: (v: unknown) => `${Number(v).toFixed(1)}%`,
            fill: "#71717a",
            fontSize: 10,
          }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={CANDIDATE_COLORS[entry.leading]} fillOpacity={0.72} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
