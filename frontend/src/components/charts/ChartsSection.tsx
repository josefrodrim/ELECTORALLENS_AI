"use client"

import dynamic from "next/dynamic"
import type { CandidateResult, ResultItem } from "@/lib/types"

const CandidateBar = dynamic(() => import("./CandidateBar"), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse rounded bg-slate-100" />,
})

const PolarizationMap = dynamic(() => import("./PolarizationMap"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded bg-slate-100" />,
})

const TurnoutRanking = dynamic(() => import("./TurnoutRanking"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded bg-slate-100" />,
})

export function CandidateBarClient({ candidates }: { candidates: CandidateResult[] }) {
  return <CandidateBar candidates={candidates} />
}

export function PolarizationMapClient({ items }: { items: ResultItem[] }) {
  return <PolarizationMap items={items} />
}

export function TurnoutRankingClient({ items, avgTurnout }: { items: ResultItem[]; avgTurnout: number }) {
  return <TurnoutRanking items={items} avgTurnout={avgTurnout} />
}

const KeikoTimeline = dynamic(() => import("./KeikoTimeline"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded bg-slate-100" />,
})

const VoteTransferBar = dynamic(() => import("./VoteTransferBar"), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded bg-slate-100" />,
})

export function KeikoTimelineClient({ trajectory }: { trajectory: import("@/lib/elections-data").KeikoEntry[] }) {
  return <KeikoTimeline trajectory={trajectory} />
}

export function VoteTransferBarClient({ scenarios }: { scenarios: import("@/lib/elections-data").TransferScenario[] }) {
  return <VoteTransferBar scenarios={scenarios} />
}

const VoteFlowSankey = dynamic(() => import("./VoteFlowSankey"), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded bg-slate-100" style={{ height: 420 }} />,
})

export function VoteFlowSankeyClient({ flow, height }: { flow: import("@/lib/vote-flows").VoteFlow; height?: number }) {
  return <VoteFlowSankey flow={flow} height={height} />
}

const VoteFlow2026Sankey = dynamic(() => import("./VoteFlow2026Sankey"), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded bg-slate-100" style={{ height: 420 }} />,
})

export function VoteFlow2026SankeyClient() {
  return <VoteFlow2026Sankey />
}

const PeruMapP2 = dynamic(() => import("./PeruMapP2"), {
  ssr: false,
  loading: () => <div className="animate-pulse rounded bg-slate-100" style={{ height: 520 }} />,
})

export function PeruMapP2Client({
  items,
  candidates,
  legendLabel,
}: {
  items: import("@/lib/types").ResultItem[]
  candidates: [import("./PeruMapP2").P2CandidateConfig, import("./PeruMapP2").P2CandidateConfig]
  legendLabel?: string
}) {
  return <PeruMapP2 items={items} candidates={candidates} legendLabel={legendLabel} />
}
