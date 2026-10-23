import { describe, it, expect } from "vitest";
import { freshSave, parseSave, newRun } from "../src/game/save";
import { WEAPONS, WEAPON_IDS, equipWeapon, validLoadout } from "../src/game/weapons";
import { awardWeaponXP, learnMastery, masteryTree, masteryStats } from "../src/game/mastery";
import { craftWeapon, progressionStats } from "../src/game/crafting";
import { generateStage, openSecret } from "../src/game/exploration";
import { validateLayout, findPath, walkable } from "../src/game/procedural";

describe("Arsenal duplo e domínio por arma", () => {
  it("fornece dez armas novas, dois espaços válidos e não equipa armas bloqueadas", () => {
    const s = freshSave(); expect(WEAPON_IDS).toHaveLength(13);
    expect(s.loadout).toEqual({ melee: "blade", ranged: "bow" });
    expect(equipWeapon(s, "axe")).toBe(false);
    s.unlocked.push("axe", "staff");
    expect(equipWeapon(s, "axe")).toBe(true); expect(s.loadout).toEqual({ melee: "axe", ranged: "bow" });
    equipWeapon(s, "staff"); expect(s.loadout).toEqual({ melee: "axe", ranged: "staff" });
    expect(validLoadout({ melee: "staff", ranged: "hammer" }, s.unlocked)).toEqual({ melee: "blade", ranged: "bow" });
  });
  for (const id of WEAPON_IDS) it(`${id}: árvore própria exige uso, materiais e pré-requisitos`, () => {
    const s = freshSave(); if (!s.unlocked.includes(id)) s.unlocked.push(id);
    s.echoes = 1000; s.materials = { iron: 1000, glass: 1000, ember: 1000 };
    const before = structuredClone(s);
    expect(craftWeapon(s, id, "upgrade")).toContain("60 XP"); expect(s).toEqual(before);
    expect(learnMastery(s, id, "grip")).toContain("30 XP");
    awardWeaponXP(s, id, 60); expect(craftWeapon(s, id, "upgrade")).toBe("");
    expect(learnMastery(s, id, "grip")).toBe("");
    expect(learnMastery(s, id, "rhythm")).toContain("anterior");
    expect(learnMastery(s, id, "edge")).toContain("80 XP");
    awardWeaponXP(s, id, 500);
    for (const n of masteryTree(id).slice(1)) expect(learnMastery(s, id, n.id)).toBe("");
    expect(s.weaponMastery[id]).toHaveLength(7); expect(s.weaponXP[id]).toBe(560);
    expect(masteryStats(s, id).damage).toBeGreaterThanOrEqual(.05);
    expect(progressionStats(s, id).attackSpeed).toBeGreaterThanOrEqual(.11);
    const other = id === "blade" ? "bow" : "blade"; expect(s.weaponXP[other]).toBe(0); expect(s.weaponMastery[other]).toEqual([]);
    expect(parseSave(JSON.stringify(s)).weaponMastery).toEqual(s.weaponMastery);
  });
  it("migra armas antigas e conserva domínio, árvore e equipamento da expedição", () => {
    const legacy = { version: 2, unlocked: ["blade", "hammer"], weaponLevels: { hammer: 2 }, equipped: "hammer", run: newRun("old", "hammer", 120) };
    const s = parseSave(JSON.stringify(legacy)); expect(s.weaponXP.hammer).toBe(180);
    expect(s.loadout).toEqual({ melee: "hammer", ranged: "bow" });
    expect(s.run!.loadout).toEqual({ melee: "hammer", ranged: "bow" });
    s.weaponXP.blade = Number.NaN; s.weaponMastery.blade = ["signature", "unknown"];
    const parsed = parseSave(JSON.stringify(s)); expect(parsed.weaponXP.blade).toBe(0); expect(parsed.weaponMastery.blade).toEqual([]);
  });
});
describe("Arquitetura e desafios dos quatro biomas", () => {
  for (let b = 0; b < 4; b++) for (let room = 0; room < 9; room++) it(`bioma ${b}, câmara ${room}: todos destinos acessíveis e segredo opcional`, () => {
    for (let seed = 0; seed < 4; seed++) {
      const l = generateStage(`DESIGN-${seed}`, room === 6, b, room);
      expect(validateLayout(l)).toBe(true);
      for (const p of [...l.props.filter(p => p.kind !== "secret-wall" && !(l.secretChest && p.x === l.secretChest.x && p.y === l.secretChest.y)), ...l.objectives, ...l.relays, ...l.enemies, ...l.challenge.hazards, ...l.entrances]) {
        expect(walkable(l, p.x, p.y, 14)).toBe(true);
        expect(findPath(l, l.spawn, p).length).toBeGreaterThan(0);
      }
      if (room !== 6) {
        expect(findPath(l, l.spawn, l.exit).length).toBeGreaterThan(18);
        expect(findPath(l, l.spawn, l.secretChest!).length).toBe(0);
        const length = findPath(l, l.spawn, l.exit).length; openSecret(l);
        expect(findPath(l, l.spawn, l.secretChest!).length).toBeGreaterThan(0);
        expect(findPath(l, l.spawn, l.exit).length).toBe(length);
      }
    }
  });
  it("mesma seed produz plantas e desafios diferentes em cada bioma", () => {
    const layouts = [0, 1, 2, 3].map(b => generateStage("same", false, b));
    expect(new Set(layouts.map(l => JSON.stringify(l.cells))).size).toBe(4);
    expect(new Set(layouts.map(l => l.challenge.kind)).size).toBe(4);
    expect(WEAPON_IDS.filter(id => WEAPONS[id].slot === "ranged")).toHaveLength(5);
  });
  it("as 36 câmaras possuem identidade e geometria diferentes na mesma campanha", () => {
    const layouts = Array.from({ length: 36 }, (_, id) => generateStage(`CAMPAIGN:${id}`, id % 9 === 6, Math.floor(id / 9), id % 9));
    expect(new Set(layouts.map(l => l.design.id)).size).toBe(36);
    // Compare walkable space, excluding the randomly varied floor artwork.
    expect(new Set(layouts.map(l => l.cells.map(row => row.map(c => c ? 1 : 0).join("")).join("/"))).size).toBe(36);
    expect(new Set(layouts.map(l => l.design.rule)).size).toBe(9);
  });
});
