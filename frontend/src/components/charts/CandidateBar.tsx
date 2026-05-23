"use client"

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { CandidateResult } from "@/lib/types"
import { CANDIDATE_COLORS, fmt } from "@/lib/format"

interface Props {
  candidates: CandidateResult[]
  title?: string
}

export default function CandidateBar({ candidates, title }: Props) {
  const data = candidates
    .filter((c) => (c.vote_pct ?? 0) > 0.5)
    .sort((a, b) => (b.vote_pct ?? 0) - (a.vote_pct ?? 0))
    .slice(0, 8)
    .map((c) => ({
      name: c.full_name.split(",")[0].split(" ").slice(0, 2).join(" "),
      code: c.candidate_code,
      pct: c.vote_pct ?? 0,
      votes: c.votes,
    }))

  return (
    <div className="w-full">
      {title && <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">{title}</p>}
      <ResponsiveContainer width="100%" height={data.length * 42 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110}
            tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                  <p className="text-white font-medium">{d.name}</p>
                  <p className="text-zinc-400">{fmt.pct(d.pct, 2)} · {fmt.votes(d.votes)} votos</p>
                </div>
              )
            }}
          />
          <Bar dataKey="pct" radius={[0, 3, 3, 0]} label={{ position: "right", formatter: (v: unknown) => `${Number(v).toFixed(1)}%`, fill: "#71717a", fontSize: 11 }}>
            {data.map((entry) => (
              <Cell key={entry.code} fill={CANDIDATE_COLORS[entry.code] ?? "#6366f1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
