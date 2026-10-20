import data from "../data/animations.json";
export const ANIMATIONS = data;
export const HERO_FRAMES: Record<string, number> = data.hero;
export const BOSS_PATTERNS = ["rush", "volley", "eruption", "nova"] as const;
const looping = new Set(["idle", "walk", "run", "move", "phase"]);
export function framesFor(texture: string, state: string): number {
  const set: Record<string, number> = texture.startsWith("eira")
    ? data.hero
    : texture.startsWith("boss")
      ? data.boss
      : ["salvia", "orren", "nim", "lume", "caio", "iria"].includes(texture)
        ? data.npc
        : data.enemy;
  return set[state] ?? set.idle;
}
export function animationFrame(
  texture: string,
  state: string,
  time: number,
  duration?: number,
): number {
  const count = framesFor(texture, state),
    seconds =
      duration ?? (data.durations as Record<string, number>)[state] ?? 0.6;
  const f = Math.floor((Math.max(0, time) / Math.max(0.001, seconds)) * count);
  return looping.has(state) ? f % count : Math.min(count - 1, f);
}
