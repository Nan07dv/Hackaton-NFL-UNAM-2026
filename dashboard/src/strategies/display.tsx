// Strategies de visualizacion (patron Strategy): cada seccion y cada tipo de punto define como se muestra.
import type { FC } from 'react'
import { ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
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
const DASH = '\u2014'
const SEP = ' \u00b7 '

const Header: FC<{ vm: ViewModel }> = ({ vm }) => (
  <section className={card}>
    <div className="flex justify-around text-sm text-slate-400">
      <span>{vm.loc.date(vm.game.gameDate)} - {vm.game.gameTimeEastern} ET</span><span>{vm.loc.t.week} {vm.game.week}</span>
    </div>
    <div className="text-center text-3xl font-bold">Q{vm.play.quarter}{SEP}{vm.play.gameClock}</div>
    <div className="mt-2 flex justify-around text-center">
      <div><div className="text-2xl font-bold text-blue-500">{vm.game.homeTeamAbbr}</div><div className="text-4xl font-extrabold">{vm.play.preSnapHomeScore}</div></div>
      <div><div className="text-2xl font-bold text-red-500">{vm.game.visitorTeamAbbr}</div><div className="text-4xl font-extrabold">{vm.play.preSnapVisitorScore}</div></div>
    </div>
  </section>
)

interface Pt { x: number; y: number; jersey?: number; color: string }
// Tooltip: numero del jugador con el color de su equipo (el balon no muestra nada)
const PlayerTip = ({ active, payload }: { active?: boolean; payload?: readonly { payload?: Pt }[] }) => {
  const pt = payload?.[0]?.payload
  if (!active || !pt || pt.jersey == null) return null
  return <div className="rounded px-2 py-1 text-sm font-bold text-white shadow" style={{ background: pt.color }}>#{pt.jersey}</div>
}

const Field: FC<{ vm: ViewModel }> = ({ vm }) => {
  const { track, frame, play, game, loc } = vm
  const pts: Record<Side, Pt[]> = { home: [], away: [], ball: [] }
  track.ids.forEach((_, i) => {
    const t = track.teams[i]
    const side: Side = t === 'football' ? 'ball' : t === game.homeTeamAbbr ? 'home' : 'away'
    pts[side].push({ x: frame[i][0], y: frame[i][1], jersey: vm.players[String(track.ids[i])]?.jersey, color: pointStrategies[side].color })
  })
  return (
    <section className={card}>
      <div className="mb-2 text-sm text-slate-400">
        {loc.t.direction}: {track.direction === 'right' ? loc.t.right : loc.t.left}
      </div>
      <div className="rounded-lg bg-green-800">
        <ResponsiveContainer width="100%" aspect={2.2}>
          <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis type="number" dataKey="x" domain={[0, 120]} hide />
            <YAxis type="number" dataKey="y" domain={[0, 53.3]} hide />
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110].map((v) => <ReferenceLine key={v} x={v} stroke="#ffffff55" />)}
            <ReferenceLine x={play.absoluteYardlineNumber} stroke="#38bdf8" strokeWidth={2} />
            <Tooltip cursor={false} isAnimationActive={false} content={PlayerTip} />
            {(Object.keys(pts) as Side[]).map((k) => (
              <Scatter key={k} data={pts[k]} shape={dot(pointStrategies[k])} isAnimationActive={false} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

const Results: FC<{ vm: ViewModel }> = ({ vm }) => {
  const { play: p, loc } = vm
  return (
    <section className={`${card} grid grid-cols-3 gap-4`}>
      <div><div className={label}>{loc.t.playResult}</div>{p.playResult} {loc.t.yards}</div>
      <div><div className={label}>{loc.t.passResult}</div>{(p.passResult && loc.pass[p.passResult]) ?? p.passResult ?? DASH}</div>
      <div><div className={label}>{loc.t.description}</div>{loc.description(p.description)}</div>
    </section>
  )
}

const TeamPanel: FC<{ vm: ViewModel; side: 'home' | 'away' }> = ({ vm, side }) => {
  const abbr = side === 'home' ? vm.game.homeTeamAbbr : vm.game.visitorTeamAbbr
  const { color } = pointStrategies[side]
  const { play: p, loc } = vm
  const v = (x: string | number | null) => x ?? DASH
  const scheme = p.possessionTeam === abbr
    ? `${loc.t.offense}: ${v(p.offenseFormation)}${SEP}${v(p.personnelO)}${SEP}${v(p.dropBackType)}`
    : `${loc.t.defense}: ${v(p.personnelD)}${SEP}${v(p.pff_passCoverage)} (${v(p.pff_passCoverageType)})${SEP}${loc.t.box}: ${v(p.defendersInBox)}`
  return (
    <section className={card}>
      <h3 className="mb-1 text-lg font-bold" style={{ color }}>{abbr}</h3>
      <div className="mb-2 text-sm text-slate-300">{scheme}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {vm.track.ids.map((id, i) => {
          if (vm.track.teams[i] !== abbr) return null
          const pl = vm.players[String(id)]
          if (!pl) return null
          return (
            <div key={id} className="rounded-lg border-l-4 bg-slate-900 p-2 text-xs" style={{ borderColor: color }}>
              <b className="text-sm">#{pl.jersey} {pl.name}</b><br />
              {pl.pos}<br />
              {loc.height(pl.height)}{SEP}{loc.weight(pl.weight)}<br />
              {pl.college}<br />
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
