"""Procesamiento del juego con patron Strategy: cada estrategia produce una parte de la respuesta."""
import re
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np
import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"
GAME_ID = 2021090900


def clean(v):
    """Convierte NaN y tipos numpy a tipos JSON."""
    if isinstance(v, np.integer):
        return int(v)
    if isinstance(v, np.floating):
        return None if np.isnan(v) else float(v)
    return None if pd.isna(v) else v


class Strategy(ABC):
    key: str

    @abstractmethod
    def process(self, ctx: dict): ...


class GameInfoStrategy(Strategy):
    key = "game"

    def process(self, ctx):
        g = ctx["games"].loc[ctx["games"].gameId == ctx["gameId"]].iloc[0]
        return {k: clean(g[k]) for k in ["gameDate", "gameTimeEastern", "homeTeamAbbr", "visitorTeamAbbr", "week", "season"]}


class RosterStrategy(Strategy):
    key = "players"

    def process(self, ctx):
        t, p = ctx["tracking"], ctx["players"]
        info = t.dropna(subset=["nflId"]).groupby("nflId")[["jerseyNumber", "team"]].first()
        out = {}
        for r in p[p.nflId.isin(info.index)].itertuples():
            j = info.loc[r.nflId]
            out[str(int(r.nflId))] = {"name": r.displayName, "pos": r.officialPosition, "height": r.height,
                                      "weight": clean(r.weight), "college": clean(r.collegeName),
                                      "jersey": clean(j.jerseyNumber), "team": j.team}
        return out


class PlaysStrategy(Strategy):
    key = "plays"
    FIELDS = ["playId", "quarter", "down", "yardsToGo", "possessionTeam", "defensiveTeam", "gameClock",
              "preSnapHomeScore", "preSnapVisitorScore", "passResult", "playResult", "offenseFormation",
              "personnelO", "personnelD", "defendersInBox", "pff_passCoverage", "pff_passCoverageType",
              "dropBackType", "absoluteYardlineNumber"]

    def process(self, ctx):
        pl = ctx["plays"]
        pl = pl[(pl.gameId == ctx["gameId"]) & pl.playId.isin(ctx["tracking"].playId.unique())].sort_values("playId")
        out = []
        for _, r in pl.iterrows():
            d = {k: clean(r[k]) for k in self.FIELDS}
            # Quita el texto entre parentesis de la descripcion
            d["description"] = re.sub(r"\s+", " ", re.sub(r"\([^)]*\)", "", r.playDescription)).strip()
            out.append(d)
        return out


class TrackingStrategy(Strategy):
    """Por jugada: ids (0 = balon), equipos, direccion, frames [[x,y,s,a,o] por jugador] y eventos."""
    key = "tracks"

    def process(self, ctx):
        t = ctx["tracking"].copy()
        t["nflId"] = t["nflId"].fillna(0).astype(int)
        out = {}
        for pid, g in t.groupby("playId"):
            ids = sorted(g.nflId.unique())
            frames = [np.round(f.set_index("nflId").reindex(ids)[["x", "y", "s", "a", "o"]].fillna(0).to_numpy(), 1).tolist()
                      for _, f in g.groupby("frameId")]
            ev = g[g.event != "None"].drop_duplicates("frameId")
            out[str(int(pid))] = {"ids": [int(i) for i in ids],
                                  "teams": g.drop_duplicates("nflId").set_index("nflId").reindex(ids).team.tolist(),
                                  "direction": g.playDirection.iloc[0], "frames": frames,
                                  "events": [[int(r.frameId) - 1, r.event] for r in ev.itertuples()]}
        return out


STRATEGIES: list[Strategy] = [GameInfoStrategy(), RosterStrategy(), PlaysStrategy(), TrackingStrategy()]


def build_game(game_id: int = GAME_ID) -> dict:
    ctx = {"gameId": game_id,
           "games": pd.read_csv(DATA / "games.csv"),
           "players": pd.read_csv(DATA / "players.csv"),
           "plays": pd.read_csv(DATA / "plays.csv", na_values=["NA"]),
           "tracking": pd.read_csv(DATA / "tracking" / f"tracking_{game_id}.csv")}
    return {s.key: s.process(ctx) for s in STRATEGIES}
