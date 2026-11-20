// Strategies de visualizacion (patron Strategy): cada seccion y cada tipo de punto define como se muestra.
import type { FC } from 'react'
import { ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import type { ViewModel } from '../types'

type Side = 'home' | 'away' | 'ball'
interface PointStrategy { color: string; r: number }
export const pointStrategies: Record<Side, PointStrategy> = {
  home: { color: '#2563eb', r: 5 },
  away: { color: '#dc2626', r: 5 },
  ball: { color: '#facc15', r: 3 },
}
const dot = (s: PointStrategy) => (p: { cx?: number; cy?: number }) =>
  <circle cx={p.cx} cy={p.cy} r={s.r} fill={s.color} stroke="#fff" strokeWidth={0.5} />

const card = 'rounded-xl bg-slate-800 p-4'
const label = 'text-xs uppercase text-slate-400'

const Header: FC<{ vm: ViewModel }> = ({ vm }) => (
  <section className={card}>
    <div className="flex justify-around text-sm text-slate-400">
      <span>{vm.game.gameDate} - {vm.game.gameTimeEastern} ET</span><span>Semana {vm.game.week}</span>
    </div>
    <div className="text-center text-3xl font-bold">Q{vm.play.quarter} · {vm.play.gameClock}</div>
    <div className="mt-2 flex justify-around text-center">
      <div><div className="text-2xl font-bold text-blue-500">{vm.game.homeTeamAbbr}</div><div className="text-4xl font-extrabold">{vm.play.preSnapHomeScore}</div></div>
      <div><div className="text-2xl font-bold text-red-500">{vm.game.visitorTeamAbbr}</div><div className="text-4xl font-extrabold">{vm.play.preSnapVisitorScore}</div></div>
    </div>
  </section>
)

const Field: FC<{ vm: ViewModel }> = ({ vm }) => {
  const { track, frame, play, game } = vm
  const pts: Record<Side, { x: number; y: number }[]> = { home: [], away: [], ball: [] }
  track.ids.forEach((_, i) => {
    const t = track.teams[i]
    const side: Side = t === 'football' ? 'ball' : t === game.homeTeamAbbr ? 'home' : 'away'
    pts[side].push({ x: frame[i][0], y: frame[i][1] })
  })
  const ev = track.events.filter(([f]) => f <= vm.frameIdx).map((e) => e[1]).pop()
  return (
    <section className={card}>
      <div className="mb-2 flex justify-between text-sm text-slate-400">
        <span>Dirección: {track.direction === 'right' ? '→ derecha' : '← izquierda'}</span>{ev && <span className="font-semibold text-yellow-300">Evento: {ev}</span>}
      </div>
      <div className="rounded-lg bg-green-800">
        <ResponsiveContainer width="100%" aspect={2.2}>
          <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis type="number" dataKey="x" domain={[0, 120]} hide />
            <YAxis type="number" dataKey="y" domain={[0, 53.3]} hide />
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110].map((v) => <ReferenceLine key={v} x={v} stroke="#ffffff55" />)}
            <ReferenceLine x={play.absoluteYardlineNumber} stroke="#38bdf8" strokeWidth={2} />
            {(Object.keys(pts) as Side[]).map((k) => (
              <Scatter key={k} data={pts[k]} shape={dot(pointStrategies[k])} isAnimationActive={false} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

const PASS: Record<string, string> = { C: 'Completo', I: 'Incompleto', S: 'Sack', IN: 'Intercepción', R: 'Scramble' }
const Results: FC<{ vm: ViewModel }> = ({ vm }) => (
  <section className={`${card} grid grid-cols-3 gap-4`}>
    <div><div className={label}>Resultado de la jugada</div>{vm.play.playResult} yardas</div>
    <div><div className={label}>Resultado del pase</div>{(vm.play.passResult && PASS[vm.play.passResult]) ?? vm.play.passResult ?? '—'}</div>
    <div><div className={label}>Descripción</div>{vm.play.description}</div>
  </section>
)

const TeamPanel: FC<{ vm: ViewModel; side: 'home' | 'away' }> = ({ vm, side }) => {
  const abbr = side === 'home' ? vm.game.homeTeamAbbr : vm.game.visitorTeamAbbr
  const { color } = pointStrategies[side]
  const p = vm.play
  const scheme = p.possessionTeam === abbr
    ? `Ataque: ${p.offenseFormation ?? '—'} · ${p.personnelO ?? '—'} · ${p.dropBackType ?? '—'}`
    : `Defensa: ${p.personnelD ?? '—'} · ${p.pff_passCoverage ?? '—'} (${p.pff_passCoverageType ?? '—'}) · caja: ${p.defendersInBox ?? '—'}`
  return (
    <section className={card}>
      <h3 className="mb-1 text-lg font-bold" style={{ color }}>{abbr}</h3>
      <div className="mb-2 text-sm text-slate-300">{scheme}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {vm.track.ids.map((id, i) => {
          if (vm.track.teams[i] !== abbr) return null
          const pl = vm.players[String(id)]
          const [x, y, s, a] = vm.frame[i]
          return (
            <div key={id} className="rounded-lg border-l-4 bg-slate-900 p-2 text-xs" style={{ borderColor: color }}>
              <b className="text-sm">#{pl?.jersey} {pl?.name}</b><br />
              {pl?.pos} · {pl?.height} · {pl?.weight} lb<br />{pl?.college}<br />
              x {x} · y {y}<br />vel {s} yd/s · acel {a}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const Teams: FC<{ vm: ViewModel }> = ({ vm }) => (
  <div className="grid grid-cols-2 gap-4"><TeamPanel vm={vm} side="home" /><TeamPanel vm={vm} side="away" /></div>
)

// Para agregar o quitar una vista basta con editar estas listas.
export const headerStrategy = Header
export const sectionStrategies: { id: string; Component: FC<{ vm: ViewModel }> }[] = [
  { id: 'field', Component: Field },
  { id: 'results', Component: Results },
  { id: 'teams', Component: Teams },
]
