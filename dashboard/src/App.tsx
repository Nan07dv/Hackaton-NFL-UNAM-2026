import { useEffect, useState } from 'react'
import { headerStrategy as Header, sectionStrategies } from './strategies/display'
import { localeStrategies, type Lang } from './strategies/locale'
import { END_PAUSE_MS, FRAME_MS, stepStrategies } from './strategies/step'
import type { GameData, GameSummary, ViewModel } from './types'

export default function App() {
  const [data, setData] = useState<GameData | null>(null)
  const [error, setError] = useState(false)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [frameIdx, setFrameIdx] = useState(0)
  const [lang, setLang] = useState<Lang>('es')
  const [games, setGames] = useState<GameSummary[]>([])
  const [gameId, setGameId] = useState(2021090900)
  const loc = localeStrategies[lang]
  const n = data?.plays.length ?? 0
  const len = data ? data.tracks[String(data.plays[idx].playId)].frames.length : 0

  useEffect(() => {
    fetch('api/games').then((r) => r.json()).then(setGames).catch(() => setError(true))
  }, [])

  // Al cambiar de juego se reinicia la reproduccion y se carga su tracking
  useEffect(() => {
    setData(null); setIdx(0); setPlaying(false); setError(false)
    fetch(`api/game/${gameId}`).then((r) => { if (!r.ok) throw new Error(); return r.json() }).then(setData).catch(() => setError(true))
  }, [gameId])

  // Animacion de la jugada actual (una sola vez, se queda en el ultimo cuadro)
  useEffect(() => {
    if (!len) return
    setFrameIdx(0)
    const t = setInterval(() => setFrameIdx((f) => Math.min(f + 1, len - 1)), FRAME_MS)
    return () => clearInterval(t)
  }, [len, idx])

  // En reproduccion: al terminar la animacion pasa a la siguiente jugada; en la ultima se detiene
  useEffect(() => {
    if (!playing || !len || frameIdx < len - 1) return
    if (idx >= n - 1) { setPlaying(false); return }
    const t = setTimeout(() => setIdx((i) => stepStrategies.auto(i, n)), END_PAUSE_MS)
    return () => clearTimeout(t)
  }, [playing, frameIdx, len, idx, n])

  const sidebar = (
    <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-950 p-3">
      <h2 className="mb-2 text-lg font-bold">{loc.t.games}</h2>
      <div className="flex flex-col gap-2">
        {games.map((g) => (
          <button key={g.gameId} onClick={() => setGameId(g.gameId)}
            className={`rounded-lg p-2 text-left text-sm ${g.gameId === gameId ? 'bg-blue-900 ring-2 ring-blue-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <div className="text-xs text-slate-400">{loc.date(g.gameDate)} - {g.gameTimeEastern.slice(0, 5)} ET{' \u00b7 '}{loc.t.week} {g.week}</div>
            <div className="font-semibold"><span className="text-blue-400">{g.homeTeamAbbr}</span> vs <span className="text-red-400">{g.visitorTeamAbbr}</span></div>
          </button>
        ))}
      </div>
    </aside>
  )
  const shell = (content: JSX.Element) => (
    <div className="flex min-h-screen bg-slate-900 text-slate-200">{sidebar}<main className="flex-1">{content}</main></div>
  )

  if (error) return shell(<div className="p-6 text-red-400">{loc.t.error}</div>)
  if (!data) return shell(<div className="p-6">{loc.t.loading}</div>)
  const play = data.plays[idx]
  const track = data.tracks[String(play.playId)]
  const vm: ViewModel = { game: data.game, players: data.players, play, track, frameIdx, loc, frame: track.frames[Math.min(frameIdx, track.frames.length - 1)] }
  const btn = 'rounded-lg bg-slate-700 px-4 py-2 disabled:opacity-40'

  return shell(
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <div className="flex justify-end gap-2">
          {(Object.keys(localeStrategies) as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded px-3 py-1 text-sm ${l === lang ? 'bg-blue-600' : 'bg-slate-700'}`}>{l.toUpperCase()}</button>
          ))}
        </div>
        <Header vm={vm} />
        <div className="flex items-center justify-center gap-4">
          <button className={btn} onClick={() => setIdx((i) => stepStrategies.prev(i, n))} disabled={idx === 0}>{loc.t.prev}</button>
          <button className="rounded-lg bg-green-600 px-7 py-3 text-xl" onClick={() => setPlaying((p) => !p)}>{playing ? '\u23f8' : '\u25b6'}</button>
          <button className={btn} onClick={() => setIdx((i) => stepStrategies.next(i, n))} disabled={idx === n - 1}>{loc.t.next}</button>
        </div>
        <div className="text-center text-sm text-slate-400">{loc.t.play} {idx + 1} / {n}</div>
        {sectionStrategies.map(({ id, Component }) => <Component key={id} vm={vm} />)}
      </div>
  )
}
