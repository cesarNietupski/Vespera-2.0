import type { Layout, Vec } from "../types";
import { TILE } from "./config";
import { rng } from "./procedural";

export type EnvironmentTheme = "village" | "gardens" | "forges" | "archive" | "eclipse";
export const LANDSCAPES: Record<EnvironmentTheme, { ground: string; edge: number; bank: number; haze: number; mote: number; props: string[] }> = {
  village: { ground: "#4c6b44", edge: 0x728453, bank: 0x49603c, haze: 0xf4dfaa, mote: 0xffdf91, props: ["tree", "tree", "bush", "rock", "fence"] },
  gardens: { ground: "#3d6050", edge: 0x61765a, bank: 0x3f5545, haze: 0xc3d9a0, mote: 0xd4e8a0, props: ["pine", "pine", "shrub", "roots", "stone"] },
  forges: { ground: "#67594b", edge: 0x8d7356, bank: 0x625044, haze: 0xe6ad73, mote: 0xffb568, props: ["rock", "pipes", "chimney", "scrap", "rock"] },
  archive: { ground: "#376c78", edge: 0x90aaac, bank: 0x496974, haze: 0xc9e1df, mote: 0xcce9ec, props: ["reeds", "reeds", "arch", "wall", "column"] },
  eclipse: { ground: "#626675", edge: 0xa1a0a5, bank: 0x626172, haze: 0xe3d3b4, mote: 0xf0dbad, props: ["rock", "rock", "column", "arch", "obelisk"] },
};
export interface LandscapeProp { pos: Vec; frame: string; scale: number; flip: boolean; }
export interface EnvironmentPlan { theme: EnvironmentTheme; props: LandscapeProp[]; }

export function environmentTheme(hub: boolean, biome: number): EnvironmentTheme {
  return hub ? "village" : (["gardens", "forges", "archive", "eclipse"] as const)[biome % 4];
}

export function planEnvironment(layout: Layout, theme: EnvironmentTheme, seed: string, reserved: Vec[] = []): EnvironmentPlan {
  const margin = 16, width = layout.width + margin * 2, height = layout.height + margin * 2;
  const distances = Array.from({ length: height }, () => Array<number>(width).fill(Infinity));
  const queue: [number, number][] = [];
  const reserve = (x: number, y: number) => { distances[y + margin][x + margin] = 0; queue.push([x + margin, y + margin]); };
  for (let y = 0; y < layout.height; y++) for (let x = 0; x < layout.width; x++) if (layout.cells[y][x]) reserve(x, y);
  for (const p of reserved) reserve(p.x, p.y);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || distances[ny][nx] <= distances[y][x] + 1) continue;
      distances[ny][nx] = distances[y][x] + 1; queue.push([nx, ny]);
    }
  }
  const r = rng(seed + ":landscape:" + theme), candidates: (LandscapeProp & { priority: number })[] = [];
  for (let y = -margin; y < layout.height + margin; y += 2) for (let x = -margin; x < layout.width + margin; x += 2) {
    const d = distances[y + margin][x + margin];
    if (d < 2 || d > 17 || r() > (theme === "village" || theme === "gardens" ? .62 : .46)) continue;
    const pos = { x: (x + .5) * TILE, y: (y + .5) * TILE };
    const forward = (pos.x - layout.exit.x + pos.y - layout.exit.y) / Math.SQRT2;
    const side = (pos.x - layout.exit.x - pos.y + layout.exit.y) / Math.SQRT2;
    // Leave the exit and its view clear; scenery is never a new playable route.
    if (forward > -3 * TILE && Math.abs(side) < 4 * TILE) continue;
    const options = LANDSCAPES[theme].props;
    candidates.push({ pos, frame: `${theme}-${options[Math.floor(r() * options.length)]}`, scale: .74 + r() * .35, flip: r() < .5, priority: d + r() * 10 });
  }
  candidates.sort((a, b) => a.priority - b.priority);
  return { theme, props: candidates.slice(0, 320).map(({ priority: _priority, ...p }) => p) };
}
