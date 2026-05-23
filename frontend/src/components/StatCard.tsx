import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string
  sub?: string
  accent?: string
  className?: string
}

export default function StatCard({ label, value, sub, accent, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm p-5", className)}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", accent ?? "text-slate-900")}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}
