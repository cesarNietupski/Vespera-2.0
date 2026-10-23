import type { Run, Save, WeaponId } from "../types";
import { generateRun } from "./procedural";
import { parsePhase, losePhaseLoot, cleanLoot } from "./loot";
import { WEAPON_IDS, isWeapon, weaponRecord, validLoadout } from "./weapons";
import { masteryTree, UPGRADE_XP } from "./mastery";
import { BOONS } from "../data/boons";
import { SKILLS, skillRank } from "../data/skills";
import { INFUSIONS, MATERIALS } from "./crafting";
import {
  freshNeeds,
  SURVIVAL_MATERIALS,
  CONSUMABLES,
  CLOTHING,
} from "./survival";
import type { Needs } from "../types";
import { parseWorldCheckpoint, savedPosition } from "./checkpoint";
const KEY = "vespera.save.v2";
export const CAMPAIGNS_KEY = "vespera.campaigns.v1";
export interface Campaign { id: string; name: string; createdAt: number; updatedAt: number; data: Save; }
const campaignName = (name: string) => name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 40) || "Nova campanha";
export function freshSave(): Save {
  return {
    version: 2,
    echoes: 0,
    deaths: 0,
    victories: 0,
    talents: { vitality: 0, power: 0, grace: 0 },
    skills: {},
    materials: { iron: 4, glass: 2, ember: 0 },
    weaponLevels: weaponRecord(() => 0),
    infusions: weaponRecord(() => "none"),
    weaponXP: weaponRecord(() => 0),
    weaponMastery: weaponRecord(() => []),
    loadout: { melee: "blade", ranged: "bow" },
    equipped: "blade",
    needs: freshNeeds(),
    survivalMaterials: { grain: 6, herb: 4, rawWater: 8, fiber: 8, hide: 2 },
    provisions: { ration: 2, stew: 0, water: 2, tea: 0 },
    wardrobe: ["none"],
    clothing: "none",
    unlocked: ["blade", "bow"],
    memories: [],
    bosses: [],
    achievements: [],
    endings: [],
    history: [],
    settings: { music: 0.35, sfx: 0.65, quality: "high", shake: 0.6, voice: .85, voiceAuto: true },
    run: null,
    recovering: false,
    lastLoss: {},
  };
}
const finite = (x: unknown, d: number, min = 0, max = 999999): number =>
  typeof x === "number" && Number.isFinite(x)
    ? Math.min(max, Math.max(min, x))
    : d;
const strings = (a: unknown): string[] =>
  Array.isArray(a)
    ? a.filter((x): x is string => typeof x === "string").slice(0, 200)
    : [];
export function parseNeeds(x: unknown): Needs {
  const raw = x && typeof x === "object" ? (x as Record<string, unknown>) : {};
  return {
    hunger: finite(raw.hunger, 0, 0, 100),
    thirst: finite(raw.thirst, 0, 0, 100),
    cold: finite(raw.cold, 0, 0, 100),
    strain: finite(raw.strain, 0, 0, 4.999),
  };
}
export function parseSave(raw: string | null): Save {
  const d = freshSave();
  try {
    const x = JSON.parse(raw ?? "null");
    if (!x || x.version !== 2) return d;
    d.recovering = x.recovering === true;
    d.lastLoss = cleanLoot(x.lastLoss);
    if (x.location?.area === "hub" || x.location?.area === "expedition") d.location = { area: x.location.area, pos: savedPosition(x.location.pos) };
    d.echoes = finite(x.echoes, 0);
    d.deaths = finite(x.deaths, 0);
    d.victories = finite(x.victories, 0);
    for (const k of ["vitality", "power", "grace"] as const)
      d.talents[k] = Math.floor(finite(x.talents?.[k], 0, 0, 5));
    d.unlocked = [
      "blade", "bow",
      ...strings(x.unlocked).filter(isWeapon),
    ];
    d.unlocked = [...new Set(d.unlocked)];
    for (const n of SKILLS.filter(
      (n) => !["vitality", "power", "grace"].includes(n.id),
    ))
      if (x.skills?.[n.id])
        d.skills[n.id] = Math.floor(finite(x.skills[n.id], 0, 0, n.max));
    for (let pass = 0; pass < 4; pass++)
      for (const n of SKILLS)
        if (
          d.skills[n.id] &&
          n.requires.some(([id, rank]) => skillRank(d, id) < rank)
        )
          delete d.skills[n.id];
    if (x.materials && typeof x.materials === "object")
      for (const m of MATERIALS)
        d.materials[m.id] = Math.floor(finite(x.materials[m.id], 0));
    for (const id of WEAPON_IDS) {
      d.weaponLevels[id] = d.unlocked.includes(id)
        ? Math.floor(finite(x.weaponLevels?.[id], 0, 0, 3))
        : 0;
      if (
        d.weaponLevels[id] > 0 &&
        INFUSIONS.some((i) => i.id === x.infusions?.[id])
      )
        d.infusions[id] = x.infusions[id];
    }
    if (d.unlocked.includes(x.equipped)) d.equipped = x.equipped;
    d.loadout = validLoadout(x.loadout, d.unlocked, d.equipped);
    for (const id of WEAPON_IDS) {
      d.weaponXP[id] = Math.floor(finite(x.weaponXP?.[id], UPGRADE_XP[d.weaponLevels[id]]));
      const requested = strings(x.weaponMastery?.[id]);
      for (const n of masteryTree(id)) if (d.unlocked.includes(id) && requested.includes(n.id) && d.weaponXP[id] >= n.xp && n.requires.every(r => d.weaponMastery[id].includes(r))) d.weaponMastery[id].push(n.id);
    }
    d.needs = parseNeeds(x.needs);
    if (x.survivalMaterials && typeof x.survivalMaterials === "object")
      for (const m of SURVIVAL_MATERIALS)
        d.survivalMaterials[m.id] = Math.floor(
          finite(x.survivalMaterials[m.id], 0),
        );
    if (x.provisions && typeof x.provisions === "object")
      for (const item of CONSUMABLES)
        d.provisions[item.id] = Math.floor(
          finite(x.provisions[item.id], 0, 0, 999),
        );
    d.wardrobe = [
      "none",
      ...CLOTHING.filter(
        (c) => c.id !== "none" && strings(x.wardrobe).includes(c.id),
      ).map((c) => c.id),
    ];
    if (d.wardrobe.includes(x.clothing)) d.clothing = x.clothing;
    d.memories = strings(x.memories);
    d.achievements = strings(x.achievements);
    d.endings = strings(x.endings);
    d.bosses = Array.isArray(x.bosses)
      ? x.bosses.filter(
          (b: unknown) =>
            Number.isInteger(b) && Number(b) >= 0 && Number(b) <= 3,
        )
      : [];
    d.settings = {
      music: finite(x.settings?.music, 0.35, 0, 1),
      sfx: finite(x.settings?.sfx, 0.65, 0, 1),
      shake: finite(x.settings?.shake, 0.6, 0, 1),
      voice: finite(x.settings?.voice, .85, 0, 1),
      voiceAuto: x.settings?.voiceAuto !== false,
      quality: ["low", "medium", "high"].includes(x.settings?.quality)
        ? x.settings.quality
        : "high",
    };
    d.history = Array.isArray(x.history)
      ? x.history
          .filter(
            (h: { seed: unknown; result: unknown; rooms: unknown }) =>
              typeof h?.seed === "string" &&
              typeof h?.result === "string" &&
              Number.isFinite(h?.rooms),
          )
          .slice(-20)
      : [];
    if (
      x.run &&
      typeof x.run.seed === "string" &&
      isWeapon(x.run.weapon) && d.unlocked.includes(x.run.weapon) &&
      Number.isInteger(x.run.current) &&
      x.run.current >= 0 &&
      x.run.current < 36 &&
      Number.isFinite(x.run.hp) &&
      x.run.hp > 0
    ) {
      d.run = {
        ...x.run,
        loadout: validLoadout(x.run.loadout ?? d.loadout, d.unlocked, x.run.weapon),
        nodes: generateRun(x.run.seed),
        visited: (Array.isArray(x.run.visited) ? x.run.visited : []).filter(
          (n: unknown) =>
            Number.isInteger(n) && Number(n) >= 0 && Number(n) < 36,
        ),
        boons: [
          ...new Set(
            strings(x.run.boons).filter((id) => BOONS.some((b) => b.id === id)),
          ),
        ],
        coins: finite(x.run.coins, 0),
        kills: finite(x.run.kills, 0),
        charge: finite(x.run.charge, 0, 0, 100),
        needs: parseNeeds(x.run.needs ?? x.needs),
        hp: finite(x.run.hp, 120, 1, 999),
        started: finite(x.run.started, Date.now(), 0, Number.MAX_SAFE_INTEGER),
        phase: parsePhase(x.run.phase, x.run.current),
        checkpoint: parseWorldCheckpoint(x.run.checkpoint, x.run.current),
      };
    }
    return d;
  } catch {
    return d;
  }
}
export class SaveStore {
  data: Save;
  available = true;
  campaigns: Campaign[] = [];
  activeId = "campaign-legacy";
  savedAt = 0;
  get activeCampaign(): Campaign { return this.campaigns.find(c => c.id === this.activeId)!; }
  constructor() {
    let raw = null;
    let archiveRaw = null;
    try { raw = localStorage.getItem(KEY); archiveRaw = localStorage.getItem(CAMPAIGNS_KEY); }
    catch { this.available = false; }
    try {
      const archive = JSON.parse(archiveRaw ?? "null");
      if (archive?.version === 1 && Array.isArray(archive.campaigns)) {
        const ids = new Set<string>();
        for (const c of archive.campaigns.slice(0, 6)) {
          if (!c || typeof c.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(c.id) || ids.has(c.id) || c.data?.version !== 2) continue;
          ids.add(c.id); this.campaigns.push({ id: c.id, name: campaignName(typeof c.name === "string" ? c.name : "Campanha"), createdAt: finite(c.createdAt, Date.now(), 0, Number.MAX_SAFE_INTEGER), updatedAt: finite(c.updatedAt, 0, 0, Number.MAX_SAFE_INTEGER), data: parseSave(JSON.stringify(c.data)) });
        }
        if (this.campaigns.some(c => c.id === archive.activeId)) this.activeId = archive.activeId;
        else if (this.campaigns.length) this.activeId = this.campaigns[0].id;
      }
    } catch {
      // A corrupt campaign index does not invalidate the legacy active save.
    }
    let validRaw = false;
    try { validRaw = JSON.parse(raw ?? "null")?.version === 2; } catch { /* Use the campaign copy if the active mirror is corrupt. */ }
    this.data = validRaw ? parseSave(raw) : this.activeCampaign?.data ?? freshSave();
    if (!this.campaigns.length) this.campaigns.push({ id: this.activeId, name: "Campanha 1", createdAt: Date.now(), updatedAt: 0, data: structuredClone(this.data) });
    this.savedAt = this.activeCampaign.updatedAt;
  }
  write(): void {
    this.savedAt = Date.now();
    this.activeCampaign.updatedAt = this.savedAt; this.activeCampaign.data = structuredClone(this.data);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify({ version: 1, activeId: this.activeId, campaigns: this.campaigns }));
      this.available = true;
    } catch {
      this.available = false;
    }
  }
  createCampaign(name: string, imported?: Save): void {
    if (this.campaigns.length >= 6) throw new Error("Os seis espaços estão ocupados. Exclua uma campanha antiga para liberar um espaço.");
    this.write();
    const data = imported ? parseSave(JSON.stringify(imported)) : freshSave();
    if (!imported) data.settings = { ...this.data.settings };
    const id = `campaign-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.campaigns.push({ id, name: campaignName(name), createdAt: Date.now(), updatedAt: Date.now(), data });
    this.activeId = id; this.data = data; this.write();
  }
  selectCampaign(id: string): boolean {
    const target = this.campaigns.find(c => c.id === id); if (!target) return false;
    this.write(); this.activeId = id; this.data = parseSave(JSON.stringify(target.data)); this.write(); return true;
  }
  deleteCampaign(id: string): boolean {
    if (id === this.activeId || !this.campaigns.some(c => c.id === id)) return false;
    this.campaigns = this.campaigns.filter(c => c.id !== id); this.write(); return true;
  }
}
export function newRun(seed: string, weapon: WeaponId, maxHP: number): Run {
  return {
    seed,
    nodes: generateRun(seed),
    current: 0,
    visited: [],
    boons: [],
    coins: 0,
    kills: 0,
    started: Date.now(),
    weapon,
    loadout: validLoadout(undefined, WEAPON_IDS, weapon),
    hp: maxHP,
    charge: 0,
    needs: freshNeeds(),
  };
}
export function finishRun(save: Save, run: Run, result: string): void {
  if (result === "death") {
    save.lastLoss = losePhaseLoot(save, run);
    save.recovering = true;
  }
  save.needs = {
    hunger: Math.min(40, run.needs.hunger),
    thirst: Math.min(40, run.needs.thirst),
    cold: 0,
    strain: 0,
  };
  save.echoes += Math.max(
    4,
    Math.floor(run.kills / 2) + run.visited.length * 3,
  );
  save.history.push({ seed: run.seed, result, rooms: run.visited.length });
  save.history = save.history.slice(-20);
  if (result === "death") save.deaths++;
  else save.victories++;
  save.run = null;
  save.location = { area: "hub" };
}
