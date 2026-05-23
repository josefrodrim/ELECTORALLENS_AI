export type GeoLevel = "national" | "department" | "province" | "district"

export interface Election {
  id: number
  election_code: string
  name: string
  election_type: string
  round: number
  election_date: string
}

export interface CandidateResult {
  candidate_code: string
  full_name: string
  party_name: string
  votes: number
  vote_pct: number | null
}

export interface ResultItem {
  ubigeo: string
  geo_name: string
  level: GeoLevel
  actas_total: number | null
  actas_processed: number | null
  actas_pct: number | null
  registered_voters: number | null
  votes_cast: number | null
  valid_votes: number | null
  null_votes: number | null
  blank_votes: number | null
  turnout_pct: number | null
  null_pct: number | null
  blank_pct: number | null
  winning_margin_pct: number | null
  leading_candidate_code: string | null
  scraped_at: string | null
  candidates: CandidateResult[]
}

export interface ResultList {
  election_code: string
  election_name: string
  level: GeoLevel
  total: number
  items: ResultItem[]
}

export interface GeoUnit {
  ubigeo: string
  name: string
  level: GeoLevel
  parent_ubigeo: string | null
}

export interface GeoChildren {
  ubigeo: string
  name: string
  level: GeoLevel
  children: GeoUnit[]
}
