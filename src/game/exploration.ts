import type { Layout, Prop, Vec } from "../types";
import { TILE } from "./config";
import { placeHiddenKey, placeTerminalGate, type KeyHiding, type TerminalGate } from "./gates";
import { stageDesign, roomPlan, type StageDesign } from "./stage-design";
import { generateLayout, rng, findPath } from "./procedural";

export interface StageLayout extends Layout {
  design: StageDesign;
  keyHiding: KeyHiding;
  gate: TerminalGate;
  relays: Vec[];
  zones: Vec[];
  secretCells: Vec[];
  secretDoor?: Vec;
  secretChest?: Vec;
  route: Vec[];
  entrances: Vec[];
  challenge: { name: string; instruction: string; kind: "thorns" | "vents" | "tide" | "eclipse"; hazards: Vec[]; period: number; offset: number };

}
export const cellCenter = (x: number, y: number): Vec => ({ x: (x + .5) * TILE, y: (y + .5) * TILE });
export function generateStage(seed: string, boss = false, biome = 0, chamber = 0): StageLayout {
  const design = stageDesign(biome, boss ? 6 : chamber);
  if (boss) {
    const base = generateLayout(seed, true);
    for (let y = 1; y < base.height - 1; y++) for (let x = 1; x < base.width - 1; x++) {
      const dx = x - 11, dy = y - 9;
      const inside = biome === 0 ? dx * dx / 121 + dy * dy / 64 < 1.15 : biome === 1 ? !((x < 5 || x > 18) && (y < 4 || y > 14)) : biome === 2 ? !((x >= 10 && x <= 12) && (y <= 4 || y >= 14)) : Math.abs(dx) < 6 || Math.abs(dy) < 4;
      base.cells[y][x] = inside ? 1 : 0;
    }
    const pads = [base.spawn, base.exit, ...base.objectives, ...base.enemies, cellCenter(6, 6), cellCenter(18, 12)];
    for (const p of pads) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) base.cells[Math.floor(p.y / TILE) + dy][Math.floor(p.x / TILE) + dx] = 1;
    base.props = base.props.filter(p => base.cells[Math.floor(p.y / TILE)]?.[Math.floor(p.x / TILE)]);
    base.props.push({ ...cellCenter(6, 6), kind: "chest", solid: false }, { ...cellCenter(18, 12), kind: "barrel", solid: false });
    const gate = placeTerminalGate(base, base.exit);
    return { ...base, gate, design, keyHiding: placeHiddenKey(base, seed), entrances: base.enemies, challenge: { name: design.title, instruction: design.brief, kind: "eclipse", hazards: [], period: 6, offset: 0 }, relays: [], zones: [], secretCells: [], route: [base.spawn, base.exit] };
  }
  const r = rng(seed + ":exploration-1"), width = 41, height = 33;
  const cells = Array.from({ length: height }, () => Array(width).fill(0));
  const centers = roomPlan(biome, chamber).map(([x, y], i) => [x + (i && i < 4 ? Math.floor(r() * 3) - 1 : 0), y + (i && i < 4 ? Math.floor(r() * 3) - 1 : 0)]);
  const variant = chamber % 3;

  const carve = (x: number, y: number, rx: number, ry: number) => {
    for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++)
      if (cells[y + dy]?.[x + dx] !== undefined) cells[y + dy][x + dx] = 1 + Math.floor(r() * 4);
  };
  for (const [cx, cy] of centers) {
    const compact = design.rule === "islands" || design.rule === "ordered", rx = compact ? 3 : design.rule === "guarded" ? 5 : biome === 1 ? 4 : 4 + Math.floor(r() * 2), ry = compact ? 2 : design.rule === "guarded" ? 4 : biome === 1 ? 2 + variant : 3;
    if (biome === 0 || biome === 3) {
      for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++)
        if (biome === 0 ? dx * dx / (rx * rx) + dy * dy / (ry * ry) <= 1.25 : Math.abs(dx) / rx + Math.abs(dy) / ry <= 1.35) carve(cx + dx, cy + dy, 0, 0);
    } else carve(cx, cy, rx, ry);
  }
  const link = (from: number[], to: number[], narrow = false) => {
    let [x, y] = from; const [tx, ty] = to;
    const radius = narrow ? 0 : 1;
    while (x !== tx || y !== ty) {
      carve(x, y, radius, radius);
      if (narrow || biome === 1 || biome === 2 || design.rule === "ordered") {
        if (variant === 1 ? y !== ty : x === tx) y += Math.sign(ty - y);
        else x += Math.sign(tx - x);
      } else { x += Math.sign(tx - x); y += Math.sign(ty - y); }
    }
    carve(tx, ty, radius, radius);
  };
  for (let i = 1; i < centers.length; i++) {
    const from = design.rule === "rest" && i > 1 ? centers[1] : centers[i - 1], to = centers[i];
    const narrow = ["islands", "timing", "guarded"].includes(design.rule);
    if (design.rule === "timing") {
      const bend = [from[0] + 5, Math.max(4, Math.min(28, to[1] - 4))];
      link(from, bend, true); link(bend, to, true);
    } else link(from, to, narrow);
  }
  if (design.rule === "paired") link(centers[1], centers[4]);
  if (design.rule === "ordered" || design.rule === "treasure") {
    for (const [from, to] of [[centers[1], [24, 13]], [centers[3], [23, 27]], [centers[2], [36, 15]]]) { link(from, to, true); carve(to[0], to[1], 1, 1); }
  }
  carve(3, centers[0][1], 1, 1);
  const secretCells: Vec[] = [];
  for (let y = 16; y <= 29; y++) for (let x = 2; x <= 10; x++)
    if ((y <= 23 && x >= 5 && x <= 7) || y >= 23) secretCells.push({ x, y });
  for (let y = centers[0][1]; y <= 15; y++) carve(6, y, 1, 1);
  const props: Prop[] = [];
  for (const [cx, cy] of centers) {
    for (const [dx, dy, kind] of [[-3, -2, "crate"], [3, 2, "barrel"], [2, -2, "urn"], [-3, 2, "tree"]] as const) {
      let x = cx + dx, y = cy + dy;
      while (!cells[y]?.[x]) { x -= Math.sign(x - cx); y -= Math.sign(y - cy); }
      props.push({ ...cellCenter(x, y), kind: kind === "tree" ? (["tree", "column", "crystal", "mirror"] as const)[biome % 4] : kind, solid: false });
    }
    if (design.rule === "rest") carve(cx, cy, 2, 2);
    props.push({ ...cellCenter(cx, cy - 2), kind: "chest", solid: false });
  }
  const secretDoor = cellCenter(6, 16), secretChest = cellCenter(6, 27);
  props.push({ ...secretDoor, kind: "secret-wall", solid: false }, { ...secretChest, kind: "chest", solid: false });
  const route = centers.map(([x, y]) => cellCenter(x, y));
  const spawn = cellCenter(3, centers[0][1]);
  const last = centers[4], exit = biome < 2 ? cellCenter(last[0] + 3, last[1]) : cellCenter(last[0], last[1] + 3);
  carve(Math.floor(exit.x / TILE), Math.floor(exit.y / TILE), 1, 1);
  const base = { design, width, height, cells, props, spawn, exit, objectives: route.slice(1).map(p => ({ x: p.x + TILE, y: p.y - TILE })).concat([cellCenter(last[0] + 1, last[1] + 1)]), enemies: route.map(p => ({ x: p.x + TILE, y: p.y })), fallback: false, relays: route.slice(1), zones: route.slice(1), secretCells, secretDoor, secretChest, route };
  const hazards = (design.rule === "rest" ? [] : route.slice(1)).map((p, i) => { const path = findPath(base, route[i], p); return path[Math.floor(path.length * .52)] ?? p; });
  if (biome === 0) hazards.forEach(p => props.push({ ...p, kind: "flower", solid: false }));
  const gate = placeTerminalGate(base, route[4], secretCells);
  const instructions = ["Raízes ferem e prendem os passos. Destrua as flores para limpar a passagem permanentemente.", "Válvulas avisam antes de liberar calor. Sintonize cada marco para fechar sua válvula.", "Marés frias desaceleram e aumentam o frio. Cruze na vazante e leve roupas isolantes.", "Raios em cruz varrem as pontes alternadamente. Atravesse depois do pulso ou esquive."];
  return { ...base, gate, design, keyHiding: placeHiddenKey(base, seed), entrances: route.slice(1).map(p => ({ x: p.x - 2 * TILE, y: p.y + TILE })), challenge: { name: design.title, instruction: `${design.brief} ${design.rule === "rest" ? "" : instructions[biome % 4]}`, kind: (["thorns", "vents", "tide", "eclipse"] as const)[biome % 4], hazards, period: design.rule === "timing" ? 4.9 : design.rule === "islands" ? 7.2 : 6.5 - variant * .35, offset: r() * 2 } };

}
export function openSecret(layout: StageLayout): void {
  for (const p of layout.secretCells) layout.cells[p.y][p.x] = 1;
}
export function exploreCells(layout: Layout, pos: Vec, known: number[]): number[] {
  const out = new Set(known), x = Math.floor(pos.x / TILE), y = Math.floor(pos.y / TILE);
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++)
    if (layout.cells[y + dy]?.[x + dx]) out.add((y + dy) * layout.width + x + dx);
  return [...out];
}
export function navigationPath(layout: Layout, from: Vec, goal: Vec): Vec[] {
  return [from, ...findPath(layout, from, goal)];
}
