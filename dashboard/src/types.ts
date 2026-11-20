import type { LocaleStrategy } from './strategies/locale'
export type Frame = [number, number, number, number, number][] // x, y, s, a, o por jugador
export interface Game { gameDate: string; gameTimeEastern: string; homeTeamAbbr: string; visitorTeamAbbr: string; week: number; season: number }
export interface Player { name: string; pos: string; height: string; weight: number; college: string | null; jersey: number; team: string }
export interface Play {
  playId: number; quarter: number; down: number; yardsToGo: number; possessionTeam: string; defensiveTeam: string
  gameClock: string; preSnapHomeScore: number; preSnapVisitorScore: number; passResult: string | null; playResult: number
  offenseFormation: string | null; personnelO: string | null; personnelD: string | null; defendersInBox: number | null
  pff_passCoverage: string | null; pff_passCoverageType: string | null; dropBackType: string | null
  absoluteYardlineNumber: number; description: string
}
export interface Track { ids: number[]; teams: string[]; direction: 'left' | 'right'; frames: Frame[]; events: [number, string][] }
export interface GameData { game: Game; players: Record<string, Player>; plays: Play[]; tracks: Record<string, Track> }
export interface ViewModel { game: Game; players: Record<string, Player>; play: Play; track: Track; frame: Frame; frameIdx: number; loc: LocaleStrategy }

export interface GameSummary { gameId: number; week: number; gameDate: string; gameTimeEastern: string; homeTeamAbbr: string; visitorTeamAbbr: string }
