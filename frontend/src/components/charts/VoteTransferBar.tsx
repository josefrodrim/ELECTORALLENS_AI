"use client"

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts"
import type { TransferScenario } from "@/lib/elections-data"
import { computeProjection } from "@/lib/elections-data"

interface Props {
  scenarios: TransferScenario[]
}

export default function VoteTransferBar({ scenarios }: Props) {
  const data = scenarios.map((s) => {
    const proj = computeProjection(s)
    return {
      label: s.label,
      keiko: proj.keiko_pct,
      sanchez: proj.sanchez_pct,
      keiko_wins: proj.keiko_pct > 50,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
        <XAxis
          type="number"
          domain={[40, 60]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={170}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine
          x={50}
          stroke="#f97316"
          strokeDasharray="5 3"
          strokeWidth={1.5}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm space-y-1 shadow-md">
                <p className="text-slate-800 font-medium">{d.label}</p>
                <p className="text-orange-600">Fujimori: ~{Math.round(d.keiko)}%</p>
                <p className="text-cyan-600">Sánchez: ~{Math.round(d.sanchez)}%</p>
                <p className={d.keiko_wins ? "text-orange-700" : "text-cyan-700"}>
                  {d.keiko_wins ? "Fujimori adelante" : "Sánchez adelante"}
                </p>
              </div>
            )
          }}
        />
        <Bar dataKey="keiko" radius={[0, 4, 4, 0]}
          label={{ position: "right", formatter: (v: unknown) => typeof v === "number" ? `~${Math.round(v)}%` : "", fill: "#71717a", fontSize: 11 }}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.keiko_wins ? "#22c55e" : "#ef4444"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
