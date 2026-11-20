import { useEffect, useState } from 'react'
import { headerStrategy as Header, sectionStrategies } from './strategies/display'
import { AUTO_ADVANCE_MS, FRAME_MS, stepStrategies } from './strategies/step'
import type { GameData, ViewModel } from './types'

export default function App() {
  const [data, setData] = useState<GameData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [frameIdx, setFrameIdx] = useState(0)
  const n = data?.plays.length ?? 0

  useEffect(() => {
    fetch('api/game').then((r) => r.json()).then(setData).catch(() => setError('No se pudo cargar el juego'))
  }, [])

  useEffect(() => {
    if (!playing || !n) return
    const t = setInterval(() => setIdx((i) => stepStrategies.auto(i, n)), AUTO_ADVANCE_MS)
    return () => clearInterval(t)
  }, [playing, n])

  // Al llegar a la ultima jugada se detiene la reproduccion
  useEffect(() => { if (playing && idx === n - 1) setPlaying(false) }, [playing, idx, n])

  useEffect(() => {
    if (!data) return
    setFrameIdx(0)
    const len = data.tracks[String(data.plays[idx].playId)].frames.length
    const t = setInterval(() => setFrameIdx((f) => Math.min(f + 1, len - 1)), FRAME_MS)
    return () => clearInterval(t)
  }, [data, idx])

  if (error) return <main className="p-6 text-red-400">{error}</main>
  if (!data) return <main className="p-6">Cargando</main>
  const play = data.plays[idx]
  const track = data.tracks[String(play.playId)]
  const vm: ViewModel = { game: data.game, players: data.players, play, track, frameIdx, frame: track.frames[Math.min(frameIdx, track.frames.length - 1)] }
  const btn = 'rounded-lg bg-slate-700 px-4 py-2 disabled:opacity-40'

  return (
    <main className="min-h-screen bg-slate-900 text-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <Header vm={vm} />
        <div className="flex items-center justify-center gap-4">
          <button className={btn} onClick={() => setIdx((i) => stepStrategies.prev(i, n))} disabled={idx === 0}>◀ Anterior</button>
          <button className="rounded-lg bg-green-600 px-7 py-3 text-xl" onClick={() => setPlaying((p) => !p)}>{playing ? '⏸' : '▶'}</button>
          <button className={btn} onClick={() => setIdx((i) => stepStrategies.next(i, n))} disabled={idx === n - 1}>Siguiente ▶</button>
        </div>
        <div className="text-center text-sm text-slate-400">Jugada {idx + 1} / {n}</div>
        {sectionStrategies.map(({ id, Component }) => <Component key={id} vm={vm} />)}
      </div>
    </main>
  )
}
