import type { ResultList } from "@/lib/types"
import { EG2021_P2_DEPT_RESULTS } from "./elections-2021-p2-static"
import { EG2011_P2_DEPT_RESULTS } from "./elections-2011-p2-static"
import { EG2016_P2_DEPT_RESULTS } from "./elections-2016-p2-static"
import { EG2026_P1_DEPT_RESULTS } from "./elections-2026-p1-static"

const STATIC_DEPT: Record<string, ResultList> = {
  "GP2021-P2": {
    election_code: "GP2021-P2", election_name: "Segunda Vuelta EG 2021",
    level: "department", total: EG2021_P2_DEPT_RESULTS.length, items: EG2021_P2_DEPT_RESULTS,
  },
  "EG2011-P2": {
    election_code: "EG2011-P2", election_name: "Segunda Vuelta EG 2011",
    level: "department", total: EG2011_P2_DEPT_RESULTS.length, items: EG2011_P2_DEPT_RESULTS,
  },
  "EG2016-P2": {
    election_code: "EG2016-P2", election_name: "Segunda Vuelta EG 2016",
    level: "department", total: EG2016_P2_DEPT_RESULTS.length, items: EG2016_P2_DEPT_RESULTS,
  },
  "EG2026-P1": {
    election_code: "EG2026-P1", election_name: "Primera Vuelta EG 2026",
    level: "department", total: EG2026_P1_DEPT_RESULTS.length, items: EG2026_P1_DEPT_RESULTS,
  },
}

export function getStaticDeptResults(electionCode: string): ResultList | null {
  return STATIC_DEPT[electionCode] ?? null
}
