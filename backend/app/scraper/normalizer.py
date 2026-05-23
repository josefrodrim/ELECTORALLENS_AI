"""
Transforms raw ONPE JSON payloads into structured dicts ready for DB upsert.

ONPE's response schema varies by election. This module abstracts that variation
behind a canonical ResultPayload. Add a new parser function per election if the
schema changes.
"""
from dataclasses import dataclass, field


@dataclass
class CandidateVotes:
    candidate_code: str
    full_name: str
    party_name: str
    party_code: str
    votes: int
    vote_pct: float


@dataclass
class ResultPayload:
    ubigeo: str
    level: str
    actas_total: int | None
    actas_processed: int | None
    actas_pct: float | None
    registered_voters: int | None
    votes_cast: int | None
    valid_votes: int | None
    null_votes: int | None
    blank_votes: int | None
    candidates: list[CandidateVotes] = field(default_factory=list)

    # Derived — computed after parsing
    turnout_pct: float | None = None
    null_pct: float | None = None
    blank_pct: float | None = None
    winning_margin_pct: float | None = None
    leading_candidate_code: str | None = None

    def compute_derived(self) -> None:
        if self.registered_voters and self.votes_cast:
            self.turnout_pct = round(self.votes_cast / self.registered_voters * 100, 4)
        if self.votes_cast and self.null_votes is not None:
            self.null_pct = round(self.null_votes / self.votes_cast * 100, 4)
        if self.votes_cast and self.blank_votes is not None:
            self.blank_pct = round(self.blank_votes / self.votes_cast * 100, 4)

        sorted_candidates = sorted(self.candidates, key=lambda c: c.votes, reverse=True)
        if len(sorted_candidates) >= 2:
            self.leading_candidate_code = sorted_candidates[0].candidate_code
            self.winning_margin_pct = round(
                sorted_candidates[0].vote_pct - sorted_candidates[1].vote_pct, 4
            )
        elif len(sorted_candidates) == 1:
            self.leading_candidate_code = sorted_candidates[0].candidate_code


def parse_gp2021(raw: dict, ubigeo: str, level: str) -> ResultPayload | None:
    """
    Parser for Elecciones Generales 2021 (primera and segunda vuelta).
    ONPE JSON structure for this election:
    {
      "primerVuelta": {
        "listaResultados": [...],
        "totalVotos": int,
        "votosNulos": int,
        "votosBlancos": int,
        "totalActas": int,
        "actasProcesadas": int,
        "electores": int,
        "porcentajeActasProcesadas": float
      }
    }
    """
    block = raw.get("primerVuelta") or raw.get("segundaVuelta") or raw.get("resultados")
    if not block:
        return None

    candidates = []
    for item in block.get("listaResultados", []):
        candidates.append(CandidateVotes(
            candidate_code=str(item.get("codigoPartido", "")),
            full_name=item.get("nombreCandidato", ""),
            party_name=item.get("nombrePartido", ""),
            party_code=str(item.get("codigoPartido", "")),
            votes=int(item.get("totalVotos", 0)),
            vote_pct=float(item.get("porcentajeVotos", 0.0)),
        ))

    actas_total = block.get("totalActas")
    actas_processed = block.get("actasProcesadas")

    payload = ResultPayload(
        ubigeo=ubigeo,
        level=level,
        actas_total=actas_total,
        actas_processed=actas_processed,
        actas_pct=block.get("porcentajeActasProcesadas"),
        registered_voters=block.get("electores"),
        votes_cast=block.get("totalVotos"),
        valid_votes=block.get("votosValidos") or block.get("totalVotos"),
        null_votes=block.get("votosNulos"),
        blank_votes=block.get("votosBlancos"),
        candidates=candidates,
    )
    payload.compute_derived()
    return payload


# Registry: maps election_code -> parser function
# All ONPE elections share the same JSON schema (primerVuelta/segundaVuelta blocks)
PARSERS = {
    "EG2011-P1": parse_gp2021,
    "EG2011-P2": parse_gp2021,
    "EG2016-P1": parse_gp2021,
    "EG2016-P2": parse_gp2021,
    "GP2021-P1": parse_gp2021,
    "GP2021-P2": parse_gp2021,
    "EG2026-P1": parse_gp2021,
    "EG2026-P2": parse_gp2021,
}


def normalize(raw: dict, ubigeo: str, level: str, election_code: str) -> ResultPayload | None:
    parser = PARSERS.get(election_code)
    if not parser:
        raise ValueError(f"No parser registered for election_code '{election_code}'")
    return parser(raw, ubigeo, level)
