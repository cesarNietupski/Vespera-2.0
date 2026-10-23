import type { EnemyKind, ObjectiveKind, Vec, WeaponId } from "../types";
import { ENEMIES } from "./config";
import { OBJECTIVES, type ObjectiveState } from "./objectives";
import { isWeapon } from "./weapons";

export interface EnemyCheckpoint {
  kind: EnemyKind; pos: Vec; hp: number; maxHP: number; boss: boolean; phase: number;
  lootKey: string; attackCount: number; burn: number; slow: number; burnDamage: number; slowAmount: number; lastHitWeapon?: WeaponId;
}
export interface MarkerCheckpoint { pos: Vec; progress: number; done: boolean; hp: number; }
export interface WorldCheckpoint {
  version: 1; room: number; pos: Vec; facing: number; elapsed: number; cleared: boolean; rewardPending: boolean;
  objective: { kind: ObjectiveKind; state: ObjectiveState; progress: number; target: number; elapsed: number; integrity: number; damageTaken: number; dashes: number; };
  enemies: EnemyCheckpoint[]; markers: MarkerCheckpoint[]; relays: number[]; stageZones: number[];
  pendingWave: number; waveTimer: number; spawnSerial: number;
  escort?: Vec; escortPath: Vec[]; escortLength: number; escortTravel: number;
  arrivals: { kind: EnemyKind; pos: Vec; remaining: number }[];
}
const n = (v: unknown, fallback = 0, max = 1e6, min = 0) => typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export const savedPosition = (v: unknown): Vec | undefined => {
  const p = v as Vec | undefined;
  return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= 10000 && p.y <= 10000 ? { x: p.x, y: p.y } : undefined;
};
export function parseWorldCheckpoint(raw: unknown, room: number): WorldCheckpoint | undefined {
  if (!raw || typeof raw !== "object") return;
  const x = raw as WorldCheckpoint, pos = savedPosition(x.pos), o = x.objective;
  if (x.version !== 1 || x.room !== room || !pos || !o || !Object.hasOwn(OBJECTIVES, o.kind) || !Array.isArray(x.enemies) || !Array.isArray(x.markers)) return;
  const indices = (a: unknown, max: number) => Array.isArray(a) ? [...new Set(a.filter(v => Number.isInteger(v) && v >= 0 && v < max))] as number[] : [];
  return {
    version: 1, room, pos, facing: n(x.facing, 0, Math.PI * 2, -Math.PI * 2), elapsed: n(x.elapsed), cleared: x.cleared === true, rewardPending: x.rewardPending === true,
    objective: { kind: o.kind, state: ["active", "pending", "completed", "failed"].includes(o.state) ? o.state : "active", target: n(o.target, OBJECTIVES[o.kind].target, 1000), progress: n(o.progress, 0, 1000), elapsed: n(o.elapsed), integrity: n(o.integrity, 100, 100), damageTaken: n(o.damageTaken), dashes: n(o.dashes) },
    enemies: x.enemies.slice(0, 100).flatMap((e, i) => {
      const p = savedPosition(e?.pos); if (!e || !p || !Object.hasOwn(ENEMIES, e.kind)) return [];
      const maxHP = n(e.maxHP, 100, 10000, 1);
      return [{ kind: e.kind, pos: p, hp: n(e.hp, maxHP, maxHP), maxHP, boss: e.boss === true, phase: Math.floor(n(e.phase, 1, 3, 1)), lootKey: /^enemy:\d+$/.test(e.lootKey) ? e.lootKey : `enemy:${i}`, attackCount: Math.floor(n(e.attackCount)), burn: n(e.burn, 0, 30), slow: n(e.slow, 0, 30), burnDamage: n(e.burnDamage, 0, 1000), slowAmount: n(e.slowAmount, 0, .9), ...(isWeapon(e.lastHitWeapon) ? { lastHitWeapon: e.lastHitWeapon } : {}) }];
    }),
    markers: x.markers.slice(0, 10).flatMap(m => { const p = savedPosition(m?.pos); return p ? [{ pos: p, progress: n(m.progress, 0, 1000), hp: n(m.hp, 100, 1000), done: m.done === true }] : []; }),
    relays: Array.isArray(x.relays) ? x.relays.slice(0, 4).map(v => n(v, 0, 1.4)) : [], stageZones: indices(x.stageZones, 5),
    pendingWave: Math.floor(n(x.pendingWave, 0, 20)), waveTimer: n(x.waveTimer, 0, 60), spawnSerial: Math.floor(n(x.spawnSerial)),
    escort: savedPosition(x.escort), escortPath: Array.isArray(x.escortPath) ? x.escortPath.slice(0, 3000).flatMap(p => savedPosition(p) ?? []) : [], escortLength: n(x.escortLength, 1, 1e6, 1), escortTravel: n(x.escortTravel),
    arrivals: Array.isArray(x.arrivals) ? x.arrivals.slice(0, 6).flatMap(a => { const p = savedPosition(a?.pos); return p && Object.hasOwn(ENEMIES, a.kind) ? [{ kind: a.kind, pos: p, remaining: n(a.remaining, 2, 2, .1) }] : []; }) : [],
  };
}
