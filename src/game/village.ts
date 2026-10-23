import type { Layout, NpcId, Vec } from "../types";
import { TILE } from "./config";
import { HUB_NPCS } from "../data/npcs";

export interface VillageHouse { npc: NpcId; name: string; center: Vec; door: Vec; }
export interface VillageLayout extends Layout { houses: VillageHouse[]; paths: number[]; plaza: Vec; lighthouse: Vec; }
const center = (x: number, y: number): Vec => ({ x: (x + .5) * TILE, y: (y + .5) * TILE });
export function generateVillage(): VillageLayout {
  const width = 35, height = 33;
  const cells: number[][] = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => x >= 2 && x <= 32 && y >= 2 && y <= 30 ? 2 : 0));
  const paths = new Set<number>();
  const pave = (x: number, y: number, radius = 1) => {
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++)
      if (cells[y + dy]?.[x + dx]) { cells[y + dy][x + dx] = 1; paths.add((y + dy) * width + x + dx); }
  };
  const line = (from: number[], to: number[]) => {
    let [x, y] = from; const [tx, ty] = to;
    while (x !== tx || y !== ty) { pave(x, y, 0); if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); }
    pave(tx, ty, 0);
  };
  for (let x = 3; x <= 32; x++) pave(x, 16);
  for (let y = 4; y <= 29; y++) pave(18, y);
  pave(18, 16, 3);
  const houses = HUB_NPCS.map(n => {
    const cx = n.houseX, cy = n.houseY;
    // Back walls stop movement; the two front faces and doorstep remain open.
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++)
      cells[y][x] = x === cx - 2 || y === cy - 2 ? 0 : 3;
    line([cx + 2, cy + 2], [cx + 4, cy + 2]);
    line([cx + 4, cy + 2], [cx + 4, 16]);
    line([cx + 1, cy + 1], [cx + 2, cy + 2]);
    return { npc: n.id, name: n.houseName, center: center(cx, cy), door: center(cx + 2, cy + 2) };
  });
  cells[12][18] = 0; cells[16][15] = 0;
  const spawn = center(18, 17), exit = center(31, 16);
  const props: Layout["props"] = [];
  for (const [x, y] of [[3, 4], [12, 3], [22, 3], [31, 5], [3, 28], [12, 29], [23, 29], [31, 29]]) props.push({ ...center(x, y), kind: "tree", solid: false });
  return { width, height, cells, props, spawn, exit, objectives: houses.map(h => h.door), enemies: [], fallback: false, houses, paths: [...paths], plaza: center(18, 16), lighthouse: center(18, 12) };
}
export function houseAt(layout: VillageLayout, pos: Vec): VillageHouse | undefined {
  return layout.houses.find(h => Math.abs(pos.x - h.center.x) < 2.6 * TILE && Math.abs(pos.y - h.center.y) < 2.3 * TILE);
}
