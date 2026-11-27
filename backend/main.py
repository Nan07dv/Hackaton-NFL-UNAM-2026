"""API de la plantilla. Ejecuta: .venv/Scripts/uvicorn backend.main:app --reload"""
""" Despliegue en Render - Arreglo Error de Cors"""
from fastapi import FastAPI, HTTPException

from backend.processing import DATA, GAME_ID, base_tables, build_game, list_games

app = FastAPI(title="Hackathon NFL UNAM")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hackaton-nfl-unam-2026-front.onrender.com"],
    allow_methods=["GET"],
)

@app.on_event("startup")
def warmup() -> None:
    base_tables()  # lee los CSV comunes al arrancar, sin escribir a disco


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/games")
def games() -> list[dict]:
    return list_games()


@app.get("/api/game")
@app.get("/api/game/{game_id}")
def game(game_id: int = GAME_ID) -> dict:
    if not (DATA / "tracking" / f"tracking_{game_id}.csv").exists():
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    return build_game(game_id)
