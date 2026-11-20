// Strategies de avance entre jugadas (patron Strategy): cada una calcula el siguiente indice.
export type StepStrategy = (i: number, n: number) => number
export const stepStrategies: Record<'next' | 'prev' | 'auto', StepStrategy> = {
  next: (i, n) => Math.min(i + 1, n - 1),
  prev: (i) => Math.max(i - 1, 0),
  auto: (i, n) => Math.min(i + 1, n - 1), // al llegar al final se queda en la ultima
}
export const END_PAUSE_MS = 1000 // pausa al terminar la animacion antes de pasar a la siguiente jugada
export const FRAME_MS = 100 // tracking real a 10 fps
