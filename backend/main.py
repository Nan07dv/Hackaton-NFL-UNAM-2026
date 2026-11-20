"""API de la plantilla. Ejecuta: .venv/Scripts/uvicorn backend.main:app --reload"""
from functools import lru_cache

from fastapi import FastAPI

from backend.processing import build_game

app = FastAPI(title="Hackathon NFL UNAM")


@lru_cache(maxsize=1)
def game_data() -> dict:
    return build_game()


@app.on_event("startup")
def warmup() -> None:
    game_data()  # calcula al arrancar, sin escribir a disco


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/game")
def game() -> dict:
    return game_data()
