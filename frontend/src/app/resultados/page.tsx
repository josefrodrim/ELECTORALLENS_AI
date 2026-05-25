import { api } from "@/lib/api"
import type { ResultItem, ResultList } from "@/lib/types"
import ResultsDrillDown from "@/components/ResultsDrillDown"
import { getStaticDeptResults } from "@/lib/static-election-results"

export const revalidate = 60

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ election?: string }>
}) {
  const { election = "GP2021-P2" } = await searchParams

  const staticData = getStaticDeptResults(election)
  const [deptResults, provinceResults] = await Promise.all([
    staticData
      ? Promise.resolve(staticData)
      : api.results("department", election),
    api.results("province", election).catch(() => ({ items: [] as ResultItem[] })) as Promise<ResultList | { items: ResultItem[] }>,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resultados por Territorio</h1>
        <p className="text-slate-500 text-sm mt-1">
          {deptResults.election_name} · Selecciona un departamento para ver el desglose provincial
        </p>
      </div>
      <ResultsDrillDown
        deptItems={deptResults.items}
        provinceItems={provinceResults.items}
      />
    </div>
  )
}
