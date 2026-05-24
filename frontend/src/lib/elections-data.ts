// Canonical electoral data — Official ONPE published results
// Sources: ONPE Resultados Oficiales 2011, 2016, 2021, 2026
// All vote counts derived from official vote percentages × total valid votes
// 2026 P1 vote counts are exact figures from ONPE API (100% actas processed)

export type Ideology =
  | "right"
  | "center-right"
  | "center"
  | "center-left"
  | "left"

export interface Candidate {
  name: string
  short_name: string
  party: string
  vote_pct: number        // % of valid votes in this round
  votes: number           // absolute vote count
  is_keiko?: boolean
  is_finalist?: boolean   // qualified for P2
  is_winner?: boolean     // won the round (P1: qualified 1st; P2: elected)
  ideology?: Ideology
}

export interface Round {
  code: string
  year: number
  round: 1 | 2
  round_label: "Primera Vuelta" | "Segunda Vuelta"
  date: string
  registered: number
  cast: number
  valid: number
  null_blank: number      // absolute null+blank votes
  null_blank_pct: number  // % of cast votes
  turnout_pct: number     // cast / registered × 100
  candidates: Candidate[]
}

export interface ElectionCycle {
  year: 2011 | 2016 | 2021 | 2026
  label: string
  p1: Round
  p2: Round | null        // null = pending (2026)
  p2_winner?: string      // short_name of president-elect (undefined if pending)
  p2_margin_pp?: number   // winner − runner-up in pp (positive = winner ahead)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — derive vote counts from pct × valid (rounds to nearest vote)
// Used only for 2011/2016/2021 where exact counts weren't captured at the time
// ─────────────────────────────────────────────────────────────────────────────
function votes(pct: number, valid: number): number {
  return Math.round((pct / 100) * valid)
}

// ─────────────────────────────────────────────────────────────────────────────
// EG 2011
// ─────────────────────────────────────────────────────────────────────────────
const EG2011_P1_VALID = 14_966_101
const EG2011_P1_CAST  = 16_507_076
const EG2011_P1_REG   = 19_949_915

const EG2011_P2_VALID = 15_232_513
const EG2011_P2_CAST  = 16_591_182
const EG2011_P2_REG   = 19_949_915

const EG2011: ElectionCycle = {
  year: 2011,
  label: "EG 2011",
  p2_winner: "Humala",
  p2_margin_pp: 2.90,
  p1: {
    code: "EG2011-P1",
    year: 2011,
    round: 1,
    round_label: "Primera Vuelta",
    date: "2011-04-10",
    registered: EG2011_P1_REG,
    cast: EG2011_P1_CAST,
    valid: EG2011_P1_VALID,
    null_blank: EG2011_P1_CAST - EG2011_P1_VALID,
    null_blank_pct: 9.33,
    turnout_pct: parseFloat(((EG2011_P1_CAST / EG2011_P1_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Ollanta Humala Tasso",
        short_name: "Humala",
        party: "Gana Perú",
        vote_pct: 31.72,
        votes: votes(31.72, EG2011_P1_VALID),
        ideology: "left",
        is_finalist: true,
        is_winner: true,
      },
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza 2011",
        vote_pct: 23.55,
        votes: votes(23.55, EG2011_P1_VALID),
        ideology: "right",
        is_keiko: true,
        is_finalist: true,
      },
      {
        name: "Pedro Pablo Kuczynski",
        short_name: "PPK",
        party: "Alianza por el Gran Cambio",
        vote_pct: 18.52,
        votes: votes(18.52, EG2011_P1_VALID),
        ideology: "center-right",
      },
      {
        name: "Alejandro Toledo Manrique",
        short_name: "Toledo",
        party: "Perú Posible",
        vote_pct: 15.64,
        votes: votes(15.64, EG2011_P1_VALID),
        ideology: "center",
      },
      {
        name: "Luis Castañeda Lossio",
        short_name: "Castañeda",
        party: "Solidaridad Nacional",
        vote_pct: 9.84,
        votes: votes(9.84, EG2011_P1_VALID),
        ideology: "center-right",
      },
      {
        name: "Otros candidatos",
        short_name: "Otros",
        party: "Varios",
        vote_pct: 0.73,
        votes: votes(0.73, EG2011_P1_VALID),
      },
    ],
  },
  p2: {
    code: "EG2011-P2",
    year: 2011,
    round: 2,
    round_label: "Segunda Vuelta",
    date: "2011-06-05",
    registered: EG2011_P2_REG,
    cast: EG2011_P2_CAST,
    valid: EG2011_P2_VALID,
    null_blank: EG2011_P2_CAST - EG2011_P2_VALID,
    null_blank_pct: 8.19,
    turnout_pct: parseFloat(((EG2011_P2_CAST / EG2011_P2_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Ollanta Humala Tasso",
        short_name: "Humala",
        party: "Gana Perú",
        vote_pct: 51.45,
        votes: votes(51.45, EG2011_P2_VALID),
        ideology: "left",
        is_winner: true,
      },
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza 2011",
        vote_pct: 48.55,
        votes: votes(48.55, EG2011_P2_VALID),
        ideology: "right",
        is_keiko: true,
      },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// EG 2016
// ─────────────────────────────────────────────────────────────────────────────
const EG2016_P1_VALID = 15_966_062
const EG2016_P1_CAST  = 18_737_324
const EG2016_P1_REG   = 22_901_954

const EG2016_P2_VALID = 16_749_025
const EG2016_P2_CAST  = 18_744_263
const EG2016_P2_REG   = 22_901_954

const EG2016: ElectionCycle = {
  year: 2016,
  label: "EG 2016",
  p2_winner: "PPK",
  p2_margin_pp: 0.24,
  p1: {
    code: "EG2016-P1",
    year: 2016,
    round: 1,
    round_label: "Primera Vuelta",
    date: "2016-04-10",
    registered: EG2016_P1_REG,
    cast: EG2016_P1_CAST,
    valid: EG2016_P1_VALID,
    null_blank: EG2016_P1_CAST - EG2016_P1_VALID,
    null_blank_pct: 14.79,
    turnout_pct: parseFloat(((EG2016_P1_CAST / EG2016_P1_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza Popular",
        vote_pct: 39.86,
        votes: votes(39.86, EG2016_P1_VALID),
        ideology: "right",
        is_keiko: true,
        is_finalist: true,
        is_winner: true,
      },
      {
        name: "Pedro Pablo Kuczynski",
        short_name: "PPK",
        party: "Peruanos por el Kambio",
        vote_pct: 21.05,
        votes: votes(21.05, EG2016_P1_VALID),
        ideology: "center-right",
        is_finalist: true,
      },
      {
        name: "Verónika Mendoza Frisch",
        short_name: "Mendoza",
        party: "Frente Amplio",
        vote_pct: 19.94,
        votes: votes(19.94, EG2016_P1_VALID),
        ideology: "left",
      },
      {
        name: "Alfredo Barnechea García",
        short_name: "Barnechea",
        party: "Acción Popular",
        vote_pct: 7.24,
        votes: votes(7.24, EG2016_P1_VALID),
        ideology: "center",
      },
      {
        name: "Alan García Pérez",
        short_name: "García",
        party: "APRA",
        vote_pct: 5.83,
        votes: votes(5.83, EG2016_P1_VALID),
        ideology: "center-right",
      },
      {
        name: "Otros candidatos",
        short_name: "Otros",
        party: "Varios",
        vote_pct: 6.08,
        votes: votes(6.08, EG2016_P1_VALID),
      },
    ],
  },
  p2: {
    code: "EG2016-P2",
    year: 2016,
    round: 2,
    round_label: "Segunda Vuelta",
    date: "2016-06-05",
    registered: EG2016_P2_REG,
    cast: EG2016_P2_CAST,
    valid: EG2016_P2_VALID,
    null_blank: EG2016_P2_CAST - EG2016_P2_VALID,
    null_blank_pct: 10.64,
    turnout_pct: parseFloat(((EG2016_P2_CAST / EG2016_P2_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Pedro Pablo Kuczynski",
        short_name: "PPK",
        party: "Peruanos por el Kambio",
        vote_pct: 50.12,
        votes: votes(50.12, EG2016_P2_VALID),
        ideology: "center-right",
        is_winner: true,
      },
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza Popular",
        vote_pct: 49.88,
        votes: votes(49.88, EG2016_P2_VALID),
        ideology: "right",
        is_keiko: true,
      },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// GP 2021
// ─────────────────────────────────────────────────────────────────────────────
const GP2021_P1_VALID = 15_597_232
const GP2021_P1_CAST  = 18_742_556
const GP2021_P1_REG   = 25_287_954

const GP2021_P2_VALID = 16_597_223
const GP2021_P2_CAST  = 19_048_441
const GP2021_P2_REG   = 25_287_954

const GP2021: ElectionCycle = {
  year: 2021,
  label: "EG 2021",
  p2_winner: "Castillo",
  p2_margin_pp: 0.26,
  p1: {
    code: "GP2021-P1",
    year: 2021,
    round: 1,
    round_label: "Primera Vuelta",
    date: "2021-04-11",
    registered: GP2021_P1_REG,
    cast: GP2021_P1_CAST,
    valid: GP2021_P1_VALID,
    null_blank: GP2021_P1_CAST - GP2021_P1_VALID,
    null_blank_pct: 16.77,
    turnout_pct: parseFloat(((GP2021_P1_CAST / GP2021_P1_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Pedro Castillo Terrones",
        short_name: "Castillo",
        party: "Perú Libre",
        vote_pct: 18.92,
        votes: votes(18.92, GP2021_P1_VALID),
        ideology: "left",
        is_finalist: true,
        is_winner: true,
      },
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza Popular",
        vote_pct: 13.41,
        votes: votes(13.41, GP2021_P1_VALID),
        ideology: "right",
        is_keiko: true,
        is_finalist: true,
      },
      {
        name: "Rafael López Aliaga",
        short_name: "López Aliaga",
        party: "Renovación Popular",
        vote_pct: 11.08,
        votes: votes(11.08, GP2021_P1_VALID),
        ideology: "right",
      },
      {
        name: "Hernando de Soto Polar",
        short_name: "De Soto",
        party: "Avanza País",
        vote_pct: 11.62,
        votes: votes(11.62, GP2021_P1_VALID),
        ideology: "right",
      },
      {
        name: "George Forsyth Sommer",
        short_name: "Forsyth",
        party: "Victoria Nacional",
        vote_pct: 10.40,
        votes: votes(10.40, GP2021_P1_VALID),
        ideology: "center-right",
      },
      {
        name: "Yonhy Lescano Ancieta",
        short_name: "Lescano",
        party: "Acción Popular",
        vote_pct: 9.14,
        votes: votes(9.14, GP2021_P1_VALID),
        ideology: "center",
      },
      {
        name: "Daniel Urresti Elera",
        short_name: "Urresti",
        party: "Podemos Perú",
        vote_pct: 7.97,
        votes: votes(7.97, GP2021_P1_VALID),
        ideology: "center-right",
      },
      {
        name: "Otros candidatos",
        short_name: "Otros",
        party: "Varios",
        vote_pct: 17.46,
        votes: votes(17.46, GP2021_P1_VALID),
      },
    ],
  },
  p2: {
    code: "GP2021-P2",
    year: 2021,
    round: 2,
    round_label: "Segunda Vuelta",
    date: "2021-06-06",
    registered: GP2021_P2_REG,
    cast: GP2021_P2_CAST,
    valid: GP2021_P2_VALID,
    null_blank: GP2021_P2_CAST - GP2021_P2_VALID,
    null_blank_pct: 12.86,
    turnout_pct: parseFloat(((GP2021_P2_CAST / GP2021_P2_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Pedro Castillo Terrones",
        short_name: "Castillo",
        party: "Perú Libre",
        vote_pct: 50.13,
        votes: votes(50.13, GP2021_P2_VALID),
        ideology: "left",
        is_winner: true,
      },
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza Popular",
        vote_pct: 49.87,
        votes: votes(49.87, GP2021_P2_VALID),
        ideology: "right",
        is_keiko: true,
      },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// EG 2026
// Vote counts are EXACT figures from ONPE API (100% actas procesadas, 18/05/2026)
// ─────────────────────────────────────────────────────────────────────────────
const EG2026_P1_VALID = 16_738_039
const EG2026_P1_CAST  = 20_167_745
const EG2026_P1_REG   = 27_327_636

const EG2026: ElectionCycle = {
  year: 2026,
  label: "EG 2026",
  p1: {
    code: "EG2026-P1",
    year: 2026,
    round: 1,
    round_label: "Primera Vuelta",
    date: "2026-04-11",
    registered: EG2026_P1_REG,
    cast: EG2026_P1_CAST,
    valid: EG2026_P1_VALID,
    null_blank: EG2026_P1_CAST - EG2026_P1_VALID,
    null_blank_pct: 17.01,
    turnout_pct: parseFloat(((EG2026_P1_CAST / EG2026_P1_REG) * 100).toFixed(2)),
    candidates: [
      {
        name: "Keiko Fujimori Higuchi",
        short_name: "Fujimori",
        party: "Fuerza Popular",
        vote_pct: 17.19,
        votes: 2_877_678,
        ideology: "right",
        is_keiko: true,
        is_finalist: true,
      },
      {
        name: "Roberto Sánchez Palomino",
        short_name: "Sánchez",
        party: "Juntos por el Perú",
        vote_pct: 12.04,
        votes: 2_015_114,
        ideology: "center-left",
        is_finalist: true,
      },
      {
        name: "Rafael López Aliaga Cazorla",
        short_name: "López Aliaga",
        party: "Renovación Popular",
        vote_pct: 11.91,
        votes: 1_993_905,
        ideology: "right",
      },
      {
        name: "Jorge Nieto Montesinos",
        short_name: "Nieto",
        party: "Buen Gobierno",
        vote_pct: 10.98,
        votes: 1_837_517,
        ideology: "center",
      },
      {
        name: "Ricardo Belmont Cassinelli",
        short_name: "Belmont",
        party: "Cívico Obras",
        vote_pct: 10.15,
        votes: 1_698_903,
        ideology: "center-right",
      },
      {
        name: "Carlos Álvarez Loayza",
        short_name: "Álvarez",
        party: "País para Todos",
        vote_pct: 7.93,
        votes: 1_326_717,
        ideology: "center-left",
      },
      {
        name: "Pablo López Chau Nava",
        short_name: "López Chau",
        party: "Ahora Nación",
        vote_pct: 7.30,
        votes: 1_221_272,
        ideology: "center-left",
      },
      {
        name: "María Soledad Pérez Tello",
        short_name: "Pérez Tello",
        party: "Primero la Gente",
        vote_pct: 3.41,
        votes: 571_170,
        ideology: "center-right",
      },
      {
        name: "Alfonso Espa y Garces-Alvear",
        short_name: "Espa",
        party: "SICREO",
        vote_pct: 3.35,
        votes: 560_792,
        ideology: "center",
      },
      {
        name: "Luis Fernando Olivera Vega",
        short_name: "Olivera",
        party: "Frente Esperanza 2021",
        vote_pct: 1.84,
        votes: 307_880,
        ideology: "left",
      },
      {
        name: "José León Luna Gálvez",
        short_name: "Luna",
        party: "Podemos Perú",
        vote_pct: 1.59,
        votes: 266_768,
        ideology: "center",
      },
      {
        name: "Yonhy Lescano Ancieta",
        short_name: "Lescano",
        party: "Cooperación Popular",
        vote_pct: 1.28,
        votes: 214_779,
        ideology: "center-left",
      },
      {
        name: "César Acuña Peralta",
        short_name: "Acuña",
        party: "Alianza para el Progreso",
        vote_pct: 1.15,
        votes: 192_516,
        ideology: "center-right",
      },
      {
        // 23 remaining candidates with <1% each (exact remainder to 16,738,039)
        name: "Otros candidatos",
        short_name: "Otros",
        party: "Varios",
        vote_pct: 9.88,
        votes: 1_653_028,
      },
    ],
  },
  p2: null,   // Segunda vuelta pendiente
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
export const ELECTION_CYCLES: ElectionCycle[] = [EG2011, EG2016, GP2021, EG2026]

export const CYCLES_BY_YEAR: Record<number, ElectionCycle> = {
  2011: EG2011,
  2016: EG2016,
  2021: GP2021,
  2026: EG2026,
}

// Convenience: all cycles that have a completed P2
export const CYCLES_WITH_P2 = ELECTION_CYCLES.filter(
  (c): c is ElectionCycle & { p2: Round } => c.p2 !== null
)

// ─────────────────────────────────────────────────────────────────────────────
// 2026 P2 vote-transfer scenarios (second round is pending — June 2026)
// Each tuple: [% to Fujimori, % to Sánchez, % null/blank/abstain]
//
// METHODOLOGY NOTE — these are editorial estimates, NOT Goodman regression output.
// No district-level P2 data exists yet (P2 has not occurred).
// Rates are calibrated against:
//   1. Historical Goodman β from 2011/2016/2021 (see vote-flows.ts / vote_transfers_goodman.json)
//   2. Declared ideology of each party/candidate
//   3. Known coalition dynamics (López Aliaga right-wing alignment, Olivera left-wing)
// Once P2 results are published, run compute_vote_transfers.py for 2026 to replace these.
// ─────────────────────────────────────────────────────────────────────────────
export interface TransferScenario {
  label: string
  description: string
  transfers: Record<string, [number, number, number]>
}

export const TRANSFER_SCENARIOS: TransferScenario[] = [
  {
    label: "Consolidación derechista",
    description: "Los votos de López Aliaga van masivamente a Fujimori; los de centro se dividen",
    transfers: {
      // [% → Fujimori, % → Sánchez, % → abstención/nulo]
      "López Aliaga": [72, 18, 10],  // derecha, base histórica fujimorista
      "Nieto":        [45, 45, 10],  // centro, equiprobable
      "Belmont":      [55, 35, 10],  // centro-derecha
      "Álvarez":      [25, 65, 10],  // centro-izquierda
      "López Chau":   [20, 70, 10],  // centro-izquierda
      "Pérez Tello":  [60, 30, 10],  // centro-derecha, ex PPK
      "Espa":         [50, 40, 10],  // centro
      "Olivera":      [10, 80, 10],  // izquierda, fuerte anti-fujimorismo
      "Luna":         [55, 35, 10],  // centro-derecha populista
      "Lescano":      [30, 60, 10],  // centro-izquierda, patrón 2016
      "Acuña":        [55, 35, 10],  // centro-derecha populista
      "Otros":        [35, 45, 20],  // heterogéneo (<1% c/u)
    },
  },
  {
    label: "Coalición anti-Fujimori",
    description: "Patrón histórico: el electorado se moviliza para bloquear el retorno del fujimorismo",
    transfers: {
      "López Aliaga": [60, 28, 12],
      "Nieto":        [38, 52, 10],
      "Belmont":      [45, 44, 11],
      "Álvarez":      [18, 72, 10],
      "López Chau":   [15, 75, 10],
      "Pérez Tello":  [45, 45, 10],
      "Espa":         [38, 52, 10],
      "Olivera":      [5,  85, 10],
      "Luna":         [42, 48, 10],
      "Lescano":      [20, 70, 10],
      "Acuña":        [40, 50, 10],
      "Otros":        [28, 52, 20],
    },
  },
  {
    label: "Fragmentación máxima",
    description: "Alta abstención de votantes de candidatos eliminados; elección muy cerrada",
    transfers: {
      "López Aliaga": [55, 20, 25],
      "Nieto":        [30, 40, 30],
      "Belmont":      [38, 32, 30],
      "Álvarez":      [12, 58, 30],
      "López Chau":   [10, 60, 30],
      "Pérez Tello":  [40, 28, 32],
      "Espa":         [32, 38, 30],
      "Olivera":      [5,  65, 30],
      "Luna":         [38, 32, 30],
      "Lescano":      [18, 52, 30],
      "Acuña":        [38, 32, 30],
      "Otros":        [20, 35, 45],
    },
  },
]

export function computeProjection(scenario: TransferScenario): {
  keiko: number; sanchez: number; other: number; keiko_pct: number; sanchez_pct: number
} {
  const p1 = EG2026.p1
  let keiko_votes  = 2_877_678
  let sanchez_votes = 2_015_114
  let other_votes  = 0

  for (const c of p1.candidates) {
    if (c.is_keiko || c.is_finalist) continue
    const transfer = scenario.transfers[c.short_name] ?? [30, 50, 20]
    const v = c.votes
    keiko_votes   += v * transfer[0] / 100
    sanchez_votes += v * transfer[1] / 100
    other_votes   += v * transfer[2] / 100
  }

  const total = keiko_votes + sanchez_votes
  return {
    keiko:      Math.round(keiko_votes),
    sanchez:    Math.round(sanchez_votes),
    other:      Math.round(other_votes),
    keiko_pct:  (keiko_votes / total) * 100,
    sanchez_pct: (sanchez_votes / total) * 100,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Keiko's trajectory across all elections — for the pattern analysis page
// KeikoEntry: type of one item in KEIKO_TRAJECTORY (exported for chart components)
export type KeikoEntry = {
  year: number
  label: string
  p1_pct: number
  p1_votes: number
  p2_pct: number | null
  p2_votes: number | null
  opponent_short: string | null
  opponent_p2_pct: number | null
  margin_pp: number | null
  won: boolean | null
  p2_pending: boolean
}
export const KEIKO_TRAJECTORY = ELECTION_CYCLES.map((c) => {
  const p1_candidate = c.p1.candidates.find((x) => x.is_keiko)
  const p2_candidate = c.p2?.candidates.find((x) => x.is_keiko)
  const winner = c.p2?.candidates.find((x) => x.is_winner)
  return {
    year: c.year,
    label: c.label,
    p1_pct: p1_candidate?.vote_pct ?? 0,
    p1_votes: p1_candidate?.votes ?? 0,
    p2_pct: p2_candidate?.vote_pct ?? null,
    p2_votes: p2_candidate?.votes ?? null,
    opponent_short: winner?.short_name ?? null,
    opponent_p2_pct: winner?.vote_pct ?? null,
    margin_pp: c.p2_margin_pp != null
      ? (p2_candidate ? -c.p2_margin_pp : null)   // negative = lost
      : null,
    won: c.p2 === null ? null : (p2_candidate?.is_winner === true),
    p2_pending: c.p2 === null,
  }
})
