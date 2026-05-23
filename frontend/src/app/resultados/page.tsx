import { api } from "@/lib/api"
import type { ResultItem } from "@/lib/types"
import ResultsDrillDown from "@/components/ResultsDrillDown"

export const revalidate = 60

export default async function ResultadosPage() {
  const [deptResults, provinceResults] = await Promise.all([
    api.results("department", "GP2021-P2"),
    api.results("province", "GP2021-P2").catch(() => ({ items: [] as ResultItem[] })),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resultados por Territorio</h1>
        <p className="text-slate-500 text-sm mt-1">
          Segunda vuelta GP2021 · Selecciona un departamento para ver el desglose provincial
        </p>
      </div>
      <ResultsDrillDown
        deptItems={deptResults.items}
        provinceItems={provinceResults.items}
      />
    </div>
  )
}
