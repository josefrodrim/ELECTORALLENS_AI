"use client"

import {
  Bar, BarChart, CartesianGrid, Cell, LabelList,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import type { KeikoEntry } from "@/lib/elections-data"

interface Props {
  trajectory: KeikoEntry[]
}

export default function KeikoTimeline({ trajectory }: Props) {
  const data = trajectory.map((e) => ({
    year: String(e.year),
    p1: e.p1_pct,
    p2: e.p2_pct,
    opponent_p2: e.opponent_p2_pct,
    pending: e.p2_pending,
    won: e.won,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="year" tick={{ fill: "#475569", fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 60]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine
          y={50}
          stroke="#f97316"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{ value: "50% — umbral para ganar", fill: "#ea580c", fontSize: 10, position: "insideTopRight" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm space-y-1 shadow-md">
                <p className="text-slate-800 font-semibold">{label}</p>
                <p className="text-orange-600">P1 Fujimori: {d.p1.toFixed(2)}%</p>
                {d.p2 != null && (
                  <>
                    <p className="text-red-600">P2 Fujimori: {d.p2.toFixed(2)}%</p>
                    <p className="text-slate-500">P2 oponente: {d.opponent_p2?.toFixed(2)}%</p>
                    <p className={d.won ? "text-green-700" : "text-slate-400"}>
                      {d.won ? "Ganó" : `Perdió por ${(50 - d.p2).toFixed(2)}pp`}
                    </p>
                  </>
                )}
                {d.pending && <p className="text-blue-600">Segunda vuelta pendiente</p>}
              </div>
            )
          }}
        />

        {/* P1 bar */}
        <Bar dataKey="p1" name="P1 Fujimori" fill="#f97316" opacity={0.6} radius={[4, 4, 0, 0]} barSize={36}>
          <LabelList dataKey="p1" position="insideTop" formatter={(v: unknown) => typeof v === "number" ? `${v.toFixed(1)}%` : ""}
            style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }} />
        </Bar>

        {/* P2 bar */}
        <Bar dataKey="p2" name="P2 Fujimori" barSize={36} radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pending ? "#3b82f6" : entry.won ? "#22c55e" : "#ef4444"}
              opacity={entry.pending ? 0.4 : 0.85}
            />
          ))}
          <LabelList
            dataKey="p2"
            position="insideTop"
            formatter={(v: unknown) => v == null ? "?" : typeof v === "number" ? `${v.toFixed(1)}%` : ""}
            style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
