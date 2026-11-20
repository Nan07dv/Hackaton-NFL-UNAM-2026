// Strategies de idioma (patron Strategy): textos y formato de unidades para cada interfaz.
export type Lang = 'es' | 'en'
type Key = 'week' | 'prev' | 'next' | 'play' | 'playResult' | 'passResult' | 'description' | 'yards'
  | 'direction' | 'right' | 'left' | 'offense' | 'defense' | 'box' | 'loading' | 'error' | 'games'

export interface LocaleStrategy {
  code: Lang
  t: Record<Key, string>
  pass: Record<string, string>
  date: (d: string) => string // games.csv usa MM/DD/YYYY
  height: (h: string) => string // players.csv usa "6-1" (pies-pulgadas)
  weight: (lb: number) => string
  description: (d: string) => string // traduce playDescription
}

const parseHeight = (h: string) => {
  if (!h.includes('-')) { const tot = Number(h); return { ft: Math.floor(tot / 12), inch: tot % 12 } }
  const [ft, inch] = h.split('-').map(Number)
  return { ft, inch: inch || 0 }
}

// Diccionario de frases frecuentes en playDescription (se aplica de la frase mas larga a la mas corta)
const DESC_ES: Record<string, string> = {
  'pass incomplete': 'pase incompleto', 'pass': 'pase',
  'short right': 'corto a la derecha', 'short left': 'corto a la izquierda', 'short middle': 'corto por el centro',
  'deep right': 'profundo a la derecha', 'deep left': 'profundo a la izquierda', 'deep middle': 'profundo por el centro',
  'sacked ob at': 'capturado (sack) fuera del campo en', 'sacked at': 'capturado (sack) en',
  'pushed ob at': 'empujado fuera del campo en', 'ran ob at': 'sali\u00f3 del campo en',
  'scrambles': 'escapa', 'up the middle': 'por el centro', 'right end': 'por el extremo derecho', 'left end': 'por el extremo izquierdo',
  'right guard': 'por el guardia derecho', 'left guard': 'por el guardia izquierdo', 'right tackle': 'por el tackle derecho', 'left tackle': 'por el tackle izquierdo',
  'PENALTY on': 'CASTIGO a', 'Penalty on': 'Castigo a', 'enforced between downs': 'aplicado entre downs', 'enforced at': 'aplicado en',
  'No Play': 'Jugada anulada', 'was injured during the play': 'se lesion\u00f3 durante la jugada', 'His return is Questionable': 'Su regreso es dudoso',
  'His return is Probable': 'Su regreso es probable', 'FUMBLES': 'SUELTA EL BAL\u00d3N', 'RECOVERED by': 'RECUPERADO por', 'recovered by': 'recuperado por',
  'and recovers at': 'y recupera en', 'INTERCEPTED by': 'INTERCEPTADO por', 'intended for': 'dirigido a', 'declined': 'rechazado', 'offsetting': 'compensados',
  'Defensive Pass Interference': 'Interferencia de pase defensiva', 'Offensive Pass Interference': 'Interferencia de pase ofensiva',
  'Offensive Holding': 'Sujeci\u00f3n ofensiva', 'Defensive Holding': 'Sujeci\u00f3n defensiva', 'Roughing the Passer': 'Rudeza contra el pasador',
  'Defensive Offside': 'Fuera de lugar defensivo', 'Unnecessary Roughness': 'Rudeza innecesaria', 'Illegal Use of Hands': 'Uso ilegal de las manos',
  'Face Mask': 'Agarre de m\u00e1scara', 'Illegal Contact': 'Contacto ilegal', 'Illegal Formation': 'Formaci\u00f3n ilegal',
  'Intentional Grounding': 'Lanzamiento intencional al suelo', 'Taunting': 'Provocaci\u00f3n', 'False Start': 'Salida en falso', 'Delay of Game': 'Retraso de juego',
  'Neutral Zone Infraction': 'Invasi\u00f3n de zona neutral', 'Illegal Block Above the Waist': 'Bloqueo ilegal arriba de la cintura',
  'Encroachment': 'Invasi\u00f3n', 'Illegal Shift': 'Movimiento ilegal', 'Illegal Motion': 'Movimiento ilegal', 'Ineligible Downfield Pass': 'Jugador inelegible adelantado',
  'reported in as eligible': 'se report\u00f3 como elegible', 'and the play was REVERSED': 'y la jugada fue REVOCADA', 'and the play was Upheld': 'y la jugada se mantuvo',
  'The ruling on the field stands': 'La decisi\u00f3n en el campo se mantiene', 'The Replay Official reviewed': 'El oficial de repetici\u00f3n revis\u00f3',
  'the pass completion ruling': 'la decisi\u00f3n de pase completo', 'the pass incomplete ruling': 'la decisi\u00f3n de pase incompleto',
  'TWO-POINT CONVERSION ATTEMPT': 'INTENTO DE CONVERSI\u00d3N DE DOS PUNTOS', 'ATTEMPT FAILS': 'INTENTO FALLIDO', 'ATTEMPT SUCCEEDS': 'INTENTO EXITOSO',
  'ball out of bounds at': 'bal\u00f3n fuera del campo en', 'is complete': 'es completo', 'is incomplete': 'es incompleto', 'touched at': 'tocado en',
  'Caught at': 'Atrapado en', 'for no gain': 'sin ganancia', 'yards': 'yardas', 'yard': 'yarda', 'for': 'por', 'at': 'en', 'and': 'y', 'to': 'para',
  'kneels': 'se arrodilla', 'spiked the ball': 'clav\u00f3 el bal\u00f3n', 'Touchback': 'Touchback',
}
const escRe = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const DESC_RE = new RegExp(`\\b(${Object.keys(DESC_ES).sort((a, b) => b.length - a.length).map(escRe).join('|')})\\b`, 'g')
const translateEs = (d: string) => d
  .replace(/\bto (?=[A-Z]{2,3} -?\d|-?\d)/g, 'hasta ') // "to TB 45" = hasta la yarda
  .replace(DESC_RE, (m) => DESC_ES[m])

const es: LocaleStrategy = {
  code: 'es',
  t: {
    week: 'Semana', prev: '\u25c0 Anterior', next: 'Siguiente \u25b6', play: 'Jugada',
    playResult: 'Resultado de la jugada', passResult: 'Resultado del pase', description: 'Descripci\u00f3n',
    yards: 'yardas', direction: 'Direcci\u00f3n', right: '\u2192 derecha', left: '\u2190 izquierda',
    offense: 'Ataque', defense: 'Defensa', box: 'caja', loading: 'Cargando\u2026', error: 'No se pudo cargar el juego', games: 'Juegos',
  },
  pass: { C: 'Completo', I: 'Incompleto', S: 'Sack', IN: 'Intercepci\u00f3n', R: 'Scramble' },
  date: (d) => { const [m, day, y] = d.split('/'); return `${day}/${m}/${y}` },
  height: (h) => { const { ft, inch } = parseHeight(h); return `${Math.round((ft * 12 + inch) * 2.54)} cm` },
  weight: (lb) => `${Math.round(lb * 0.4536)} kg`,
  description: translateEs,
}

const en: LocaleStrategy = {
  code: 'en',
  t: {
    week: 'Week', prev: '\u25c0 Previous', next: 'Next \u25b6', play: 'Play',
    playResult: 'Play result', passResult: 'Pass result', description: 'Description',
    yards: 'yards', direction: 'Direction', right: '\u2192 right', left: '\u2190 left',
    offense: 'Offense', defense: 'Defense', box: 'box', loading: 'Loading\u2026', error: 'Could not load the game', games: 'Games',
  },
  pass: { C: 'Complete', I: 'Incomplete', S: 'Sack', IN: 'Interception', R: 'Scramble' },
  date: (d) => d,
  height: (h) => { const { ft, inch } = parseHeight(h); return `${ft}.${inch} ft` },
  weight: (lb) => `${lb} lb`,
  description: (d) => d,
}

export const localeStrategies: Record<Lang, LocaleStrategy> = { es, en }
