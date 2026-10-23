import type { Layout, Run, Vec } from "../types";
import { rng, walkable } from "./procedural";
import { TILE } from "./config";
import { phaseState } from "./loot";
export interface KeyHiding { prop: number; pos: Vec; search: Vec; hint: string; }
export interface TerminalGate { approach: Vec; }

export function placeTerminalGate(layout: Layout, from: Vec, reserved: Vec[] = []): TerminalGate {
  let lastRow = 0;
  for (let y = 0; y < layout.height; y++) for (let x = 0; x < layout.width; x++)
    if (layout.cells[y][x]) lastRow = Math.max(lastRow, x + y);
  for (const p of reserved) lastRow = Math.max(lastRow, p.x + p.y);
  const sx = Math.floor(from.x / TILE), sy = Math.floor(from.y / TILE);
  // A narrow causeway ends beyond all existing floor, including the optional secret.
  // Its diagonal direction matches the front of the gate in the isometric view.
  const length = Math.max(5, Math.ceil((lastRow + 5 - sx - sy) / 2));
  const ex = sx + length, ey = sy + length, end = ex + ey;
  layout.width = Math.max(layout.width, ex + 2); layout.height = Math.max(layout.height, ey + 2);
  layout.cells = Array.from({ length: layout.height }, (_, y) => Array.from({ length: layout.width }, (_, x) => layout.cells[y]?.[x] ?? 0));
  for (let i = 0; i <= length; i++) for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const x = sx + i + dx, y = sy + i + dy;
    if (x >= 0 && y >= 0 && x + y <= end) layout.cells[y][x] = 1;
  }
  // The final crosspiece supports both stone jambs, with no floor past its edge.
  layout.cells[ey + 1][ex - 1] = 1; layout.cells[ey - 1][ex + 1] = 1;
  layout.exit = { x: (ex + .5) * TILE, y: (ey + .5) * TILE };
  return { approach: { x: (ex - .5) * TILE, y: (ey - .5) * TILE } };
}

export function gateCollides(exit: Vec, point: Vec, radius: number, opened: boolean): boolean {
  const normal = ((point.x - exit.x) + (point.y - exit.y)) / Math.SQRT2;
  const tangent = ((point.x - exit.x) - (point.y - exit.y)) / Math.SQRT2;
  if (Math.abs(normal) >= 12 + radius) return false;
  // The stone jambs remain solid after the leaves open.
  return Math.abs(tangent) < 60 + radius && (!opened || Math.abs(tangent) + radius > 32);
}

export function placeHiddenKey(layout: Layout, seed: string): KeyHiding {
  const candidates = layout.props.map((p, i) => ({ p, i })).filter(({ p }) => ["crate", "barrel", "urn"].includes(p.kind) && walkable(layout, p.x, p.y) && Math.hypot(p.x - layout.spawn.x, p.y - layout.spawn.y) > 5 * TILE && Math.hypot(p.x - layout.exit.x, p.y - layout.exit.y) > 2 * TILE);
  // Every generated stage has reachable containers, including boss arenas.
  const chosen = candidates[Math.floor(rng(seed + ":gate-key")() * candidates.length)] ?? layout.props.map((p, i) => ({ p, i })).find(({ p }) => ["crate", "barrel", "urn"].includes(p.kind) && walkable(layout, p.x, p.y))!;
  const x = chosen.p.x / (layout.width * TILE), y = chosen.p.y / (layout.height * TILE);
  const region = `${y < .4 ? "norte" : y > .63 ? "sul" : "centro"}${x < .36 ? "-oeste" : x > .65 ? "-leste" : ""}`;
  return { prop: chosen.i, pos: { x: chosen.p.x, y: chosen.p.y }, search: [...layout.objectives].sort((a, b) => Math.hypot(a.x - chosen.p.x, a.y - chosen.p.y) - Math.hypot(b.x - chosen.p.x, b.y - chosen.p.y))[0] ?? layout.spawn, hint: `Procure um nicho marcado em bronze no ${region} da fase.` };
}
export function revealGateKey(run: Run): boolean {
  const phase = phaseState(run); if (phase.keyRevealed || phase.keyFound) return false;
  phase.keyRevealed = true; return true;
}
export function collectGateKey(run: Run): boolean {
  const phase = phaseState(run); if (!phase.keyRevealed || phase.keyFound) return false;
  phase.keyFound = true; return true;
}
export function gateBlock(run: Run, cleared: boolean, rewardPending: boolean): string {
  if (!phaseState(run).keyFound) return "Encontre a chave escondida nesta fase";
  if (!cleared) return "Cumpra os objetivos e restaure a fase";
  if (rewardPending) return "Escolha a recompensa antes de abrir o portão";
  return "";
}
