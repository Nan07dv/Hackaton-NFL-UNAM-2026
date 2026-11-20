"""EDA rapido: games, players, plays y primer archivo de tracking."""
from pathlib import Path
import numpy as np
import pandas as pd

D = Path(__file__).parent / "data"
games = pd.read_csv(D / "games.csv")
players = pd.read_csv(D / "players.csv")
plays = pd.read_csv(D / "plays.csv", na_values=["NA"])
tr_file = sorted((D / "tracking").glob("*.csv"))[0]
tracking = pd.read_csv(tr_file)


def resumen(nombre, df):
    print(f"\n===== {nombre} {df.shape} =====")
    print(df.dtypes.to_string())
    nulos = df.isna().mean().mul(100).round(1)
    print("\n% nulos (>0):\n", nulos[nulos > 0].to_string() or "ninguno")
    print("\nNumericas:\n", df.describe().T.round(2).to_string())


for n, d in [("games", games), ("players", players), ("plays", plays), (f"tracking ({tr_file.name})", tracking)]:
    resumen(n, d)

# Players: altura a pulgadas
h = players["height"].str.split("-", expand=True).astype(float)
players["height_in"] = np.where(players["height"].str.contains("-"), h[0] * 12 + h[1], pd.to_numeric(players["height"], errors="coerce"))
print("\nPosiciones:\n", players["officialPosition"].value_counts().to_string())
print("\nPeso/altura medio por posicion:\n", players.groupby("officialPosition")[["weight", "height_in"]].mean().round(1).to_string())

# Plays
print("\nResultado de pase:\n", plays["passResult"].value_counts(dropna=False).to_string())
print("\nYardas promedio por formacion:\n", plays.groupby("offenseFormation")["playResult"].agg(["count", "mean"]).round(2).to_string())
print("\nYardas por cobertura:\n", plays.groupby("pff_passCoverage")["playResult"].agg(["count", "mean"]).round(2).to_string())
print("\nYardas por down:\n", plays.groupby("down")["playResult"].agg(["count", "mean"]).round(2).to_string())
print("\nPlay action vs no:\n", plays.groupby("pff_playAction")["playResult"].agg(["count", "mean"]).round(2).to_string())
print("\nDefenders in box vs yardas:", plays[["defendersInBox", "playResult"]].corr().iloc[0, 1].round(3))

# Tracking
print("\nEventos:\n", tracking["event"].value_counts().to_string())
print("\nJugadas:", tracking["playId"].nunique(), "| jugadores:", tracking["nflId"].nunique(), "| frames max:", tracking["frameId"].max())
vel = tracking[tracking["team"] != "football"].merge(players[["nflId", "displayName", "officialPosition"]], on="nflId", how="left")
print("\nTop velocidad maxima (yd/s):\n", vel.groupby(["displayName", "officialPosition"])["s"].max().nlargest(10).to_string())
print("\nDistancia recorrida por posicion:\n", vel.groupby("officialPosition")["dis"].sum().sort_values(ascending=False).round(1).to_string())
