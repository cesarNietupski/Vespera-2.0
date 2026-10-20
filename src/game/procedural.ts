import type { Layout, ObjectiveKind, RoomKind, RoomNode, Vec } from "../types";
import { CONTENT_VERSION, TILE } from "./config";
export function rng(seed: string): () => number {
  let n = 2166136261;
  for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T>(r: () => number, a: readonly T[]): T =>
  a[Math.floor(r() * a.length)];
export function generateRun(seed: string): RoomNode[] {
  const r = rng(seed + CONTENT_VERSION);
  const nodes: RoomNode[] = [];
  const objectives: ObjectiveKind[] = [
    "purify",
    "escort",
    "defend",
    "chains",
    "collect",
    "seal",
    "puzzle",
  ];
  for (let i = objectives.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [objectives[i], objectives[j]] = [objectives[j], objectives[i]];
  }
  const regionTitles = [
    [
      "Vestíbulo das raízes",
      "O pátio esquecido",
      "Entre os ponteiros",
      "A vigília silenciosa",
      "Memória partida",
      "O último santuário",
      "O coração do fragmento",
    ],
    [
      "A garganta da fornalha",
      "Válvulas sem dono",
      "Ferro de um sol morto",
      "O peso do almirante",
      "Caldeira dos esquecidos",
      "Santuário das brasas",
      "O coração da forja",
    ],
    [
      "O átrio submerso",
      "Tinta que ainda respira",
      "Um índice de ausências",
      "A guarda dos manuscritos",
      "Palavras ao fundo",
      "A sala das últimas páginas",
      "O mar entre as palavras",
    ],
    [
      "A ponte sem horizonte",
      "Órbita dos ausentes",
      "O relógio dos astros",
      "A vigília do eclipse",
      "A câmara sem amanhã",
      "A última constelação",
      "A plataforma do Tear",
    ],
  ];
  for (let b = 0; b < 4; b++) {
    const base = b * 9;
    for (let i = 0; i < 7; i++) {
      const kind: RoomKind =
        i === 6
          ? "boss"
          : i === 5
            ? "reward"
            : i === 3
              ? "elite"
              : i === 2
                ? pick(r, ["shop", "event", "explore"] as const)
                : i === 1 || i === 4
                  ? "objective"
                  : "combat";
      const next = i === 6 ? (b < 3 ? [(b + 1) * 9] : []) : [base + i + 1];
      if (i === 1) next.push(base + 7);
      if (i === 3) next.push(base + 8);
      nodes.push({
        id: base + i,
        biome: b,
        kind,
        objective:
          kind === "objective"
            ? objectives[(b * 2 + (i === 4 ? 1 : 0)) % 7]
            : kind === "explore"
              ? "collect"
              : "eliminate",
        next,
        seed: `${seed}:${b}:${i}:${CONTENT_VERSION}`,
        title: regionTitles[b][i],
      });
    }
    nodes.push({
      id: base + 7,
      biome: b,
      kind: "secret",
      objective: "collect",
      next: [base + 2],
      seed: `${seed}:${b}:secret`,
      title: "Uma lembrança fora do tempo",
    });
    nodes.push({
      id: base + 8,
      biome: b,
      kind: "challenge",
      objective: pick(r, ["defend", "seal", "chains"] as const),
      next: [base + 4],
      seed: `${seed}:${b}:challenge`,
      title: "O juramento dos ausentes",
    });
  }
  return nodes.sort((a, b) => a.id - b.id);
}
export function project(p: Vec): Vec {
  return { x: 960 + (p.x - p.y) * 0.94, y: 40 + (p.x + p.y) * 0.48 };
}
export function unproject(p: Vec): Vec {
  const x = (p.x - 960) / 0.94,
    y = (p.y - 40) / 0.48;
  return { x: (x + y) / 2, y: (y - x) / 2 };
}
export function walkable(
  l: Layout,
  x: number,
  y: number,
  radius = 14,
): boolean {
  for (const dx of [-radius, radius])
    for (const dy of [-radius, radius]) {
      const tx = Math.floor((x + dx) / TILE),
        ty = Math.floor((y + dy) / TILE);
      if (!l.cells[ty]?.[tx]) return false;
    }
  return true;
}
export function reachable(l: Layout, from: Vec): Set<string> {
  const start = { x: Math.floor(from.x / TILE), y: Math.floor(from.y / TILE) };
  const seen = new Set([`${start.x},${start.y}`]);
  const q = [start];
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    for (const d of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const x = p.x + d.x,
        y = p.y + d.y,
        k = `${x},${y}`;
      if (l.cells[y]?.[x] && !seen.has(k)) {
        seen.add(k);
        q.push({ x, y });
      }
    }
  }
  return seen;
}
export function validateLayout(l: Layout): boolean {
  const seen = reachable(l, l.spawn);
  return (
    walkable(l, l.spawn.x, l.spawn.y, 25) &&
    [l.exit, ...l.objectives, ...l.enemies].every(
      (p) =>
        seen.has(`${Math.floor(p.x / TILE)},${Math.floor(p.y / TILE)}`) &&
        walkable(l, p.x, p.y),
    )
  );
}
export function generateLayout(seed: string, boss = false): Layout {
  const r = rng(seed);
  const width = 23,
    height = 19;
  const center = (x: number, y: number): Vec => ({
    x: (x + 0.5) * TILE,
    y: (y + 0.5) * TILE,
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    const leftWing = 3 + Math.floor(r() * 3),
      rightWing = 17 + Math.floor(r() * 3),
      splitGap = 10 + Math.floor(r() * 3),
      lowerCut = 3 + Math.floor(r() * 3);
    const cells = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) return 0;
        if (boss)
          return (x < 3 || x > width - 4) && (y < 3 || y > height - 4)
            ? 0
            : 1 + Math.floor(r() * 4);
        // A main gallery joins independently sized northern and southern wings.
        const gallery = y >= 7 && y <= 11 && x >= 2 && x <= 21;
        const north =
          y >= 2 &&
          y <= 8 &&
          x >= leftWing &&
          x <= rightWing &&
          !(y < 5 && x === splitGap);
        const south =
          y >= 11 &&
          y <= 16 &&
          x >= lowerCut &&
          x <= 20 &&
          !(y > 14 && x === splitGap - 1);
        return gallery || north || south ? 1 + Math.floor(r() * 4) : 0;
      }),
    );
    const props: Layout["props"] = [];
    // BSP partitions contribute paired pillars rather than enclosing unconnected rooms.
    function split(
      x: number,
      y: number,
      w: number,
      h: number,
      depth: number,
    ): void {
      if (depth === 0 || w < 7 || h < 7) {
        if (!boss && r() > 0.25) {
          const px = x + 2 + Math.floor(r() * (w - 4)),
            py = y + 2 + Math.floor(r() * (h - 4));
          if (Math.abs(py - 9) > 2 && px > 4 && px < 19) {
            cells[py][px] = 0;
            props.push({
              ...center(px, py),
              kind: pick(r, ["column", "tree"] as const),
              solid: true,
            });
          }
        }
        return;
      }
      if (w > h) {
        const d = Math.floor(w * (0.4 + r() * 0.2));
        split(x, y, d, h, depth - 1);
        split(x + d, y, w - d, h, depth - 1);
      } else {
        const d = Math.floor(h * (0.4 + r() * 0.2));
        split(x, y, w, d, depth - 1);
        split(x, y + d, w, h - d, depth - 1);
      }
    }
    split(2, 2, width - 4, height - 4, 3);
    for (let n = 0; n < 32; n++) {
      const x = 2 + Math.floor(r() * (width - 4)),
        y = 2 + Math.floor(r() * (height - 4));
      if (cells[y][x] && Math.abs(y - 9) > 2 && x > 4 && x < 20)
        props.push({
          ...center(x, y),
          kind: pick(r, [
            "rubble",
            "urn",
            "crystal",
            "flower",
            "mirror",
          ] as const),
          solid: false,
        });
    }
    const layout: Layout = {
      width,
      height,
      cells,
      props,
      spawn: center(3, 9),
      exit: center(20, 9),
      objectives: [center(8, 5), center(14, 12), center(17, 6)],
      enemies: [
        center(11, 6),
        center(14, 9),
        center(13, 13),
        center(18, 9),
        center(8, 12),
        center(17, 4),
        center(18, 14),
      ],
      fallback: false,
    };
    // Reserve door, objective and encounter pads and two-cell corridors before validation.
    for (const p of [
      layout.spawn,
      layout.exit,
      ...layout.objectives,
      ...layout.enemies,
    ]) {
      const x = Math.floor(p.x / TILE),
        y = Math.floor(p.y / TILE);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (cells[y + dy]?.[x + dx] !== undefined) cells[y + dy][x + dx] = 1;
    }
    layout.props = props.filter(
      (p) => !p.solid || !cells[Math.floor(p.y / TILE)][Math.floor(p.x / TILE)],
    );
    if (validateLayout(layout)) return layout;
  }
  const cells = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x > 0 && y > 0 && x < width - 1 && y < height - 1 ? 1 : 0,
    ),
  );
  return {
    width,
    height,
    cells,
    props: [],
    spawn: center(3, 9),
    exit: center(20, 9),
    objectives: [center(8, 5), center(14, 12), center(17, 6)],
    enemies: [center(13, 9)],
    fallback: true,
  };
}
export function findPath(l: Layout, from: Vec, to: Vec): Vec[] {
  const sx = Math.floor(from.x / TILE),
    sy = Math.floor(from.y / TILE),
    tx = Math.floor(to.x / TILE),
    ty = Math.floor(to.y / TILE);
  const start = `${sx},${sy}`,
    goal = `${tx},${ty}`;
  const open = [{ x: sx, y: sy, g: 0, f: 0 }];
  const cost = new Map([[start, 0]]),
    prev = new Map<string, string>();
  let count = 0;
  while (open.length && count++ < 600) {
    open.sort((a, b) => a.f - b.f);
    const p = open.shift()!,
      key = `${p.x},${p.y}`;
    if (key === goal) {
      const path: Vec[] = [];
      let k = goal;
      while (k !== start) {
        const [x, y] = k.split(",").map(Number);
        path.unshift({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
        k = prev.get(k)!;
      }
      return path;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = p.x + dx,
        y = p.y + dy,
        k = `${x},${y}`,
        g = p.g + 1;
      if (l.cells[y]?.[x] && g < (cost.get(k) ?? Infinity)) {
        cost.set(k, g);
        prev.set(k, key);
        open.push({ x, y, g, f: g + Math.abs(tx - x) + Math.abs(ty - y) });
      }
    }
  }
  return [];
}
