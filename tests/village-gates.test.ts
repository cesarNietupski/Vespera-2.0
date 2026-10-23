import { describe, it, expect } from "vitest";
import { generateVillage, houseAt } from "../src/game/village";
import { generateStage, openSecret } from "../src/game/exploration";
import { gateBlock, gateCollides, revealGateKey, collectGateKey } from "../src/game/gates";
import { walkable, findPath } from "../src/game/procedural";
import { HUB_NPCS } from "../src/data/npcs";
import { freshSave, newRun, parseSave } from "../src/game/save";
import { phaseState } from "../src/game/loot";
import { TILE } from "../src/game/config";

describe("Vila organizada com casas acessíveis", () => {
  const v = generateVillage();
  it("constrói seis lotes próprios, praça, ruas e saída", () => {
    expect(v.houses).toHaveLength(6); expect(v.paths.length).toBeGreaterThan(100);
    expect(new Set(v.houses.map(h => h.name)).size).toBe(6);
    expect(walkable(v, v.spawn.x, v.spawn.y, 25)).toBe(true);
    expect(findPath(v, v.spawn, v.exit).length).toBeGreaterThan(0);
    expect(generateVillage()).toEqual(v);
  });
  for (const n of HUB_NPCS) it(`${n.name}: rua, porta e interior são alcançáveis`, () => {
    const h = v.houses.find(h => h.npc === n.id)!, pos = { x: (n.x + .5) * TILE, y: (n.y + .5) * TILE };
    expect(walkable(v, pos.x, pos.y)).toBe(true);
    expect(findPath(v, v.spawn, h.door).length).toBeGreaterThan(0);
    expect(findPath(v, h.door, pos).length).toBeGreaterThan(0);
    expect(houseAt(v, pos)?.npc).toBe(n.id);
    expect(walkable(v, (n.houseX - 1.5) * TILE, (n.houseY + .5) * TILE)).toBe(false);
  });
});

describe("Portões no limite final e colisão física", () => {
  for (let id = 0; id < 36; id++) it(`fase ${id}: nenhum piso ou conteúdo além do portão, mesmo com o segredo aberto`, () => {
    for (let seed = 0; seed < 6; seed++) {
      const l = generateStage(`TERMINAL:${seed}:${id}`, id % 9 === 6, Math.floor(id / 9), id % 9);
      openSecret(l);
      const end = Math.floor(l.exit.x / TILE) + Math.floor(l.exit.y / TILE);
      for (let y = 0; y < l.height; y++) for (let x = 0; x < l.width; x++) if (l.cells[y][x]) expect(x + y).toBeLessThanOrEqual(end);
      for (const p of [...l.props, ...l.objectives, ...l.enemies, ...l.relays, ...l.entrances, ...l.challenge.hazards]) {
        expect(p.x + p.y).toBeLessThan(l.exit.x + l.exit.y - 2 * TILE);
      }
      expect(findPath(l, l.spawn, l.gate.approach).length).toBeGreaterThan(0);
      expect(walkable(l, l.gate.approach.x, l.gate.approach.y, 14)).toBe(true);
      expect(gateCollides(l.exit, l.gate.approach, 14, false)).toBe(false);
      // No walking around the leaves via a side cell of the terminal passage.
      for (let t = -120; t <= 120; t += 4) {
        const p = { x: l.exit.x + t / Math.SQRT2, y: l.exit.y - t / Math.SQRT2 };
        if (walkable(l, p.x, p.y, 14)) expect(gateCollides(l.exit, p, 14, false)).toBe(true);
      }
    }
  });
  it("folhas fechadas bloqueiam os dois lados; a passagem abre e os pilares continuam sólidos", () => {
    const exit = { x: 100, y: 100 };
    for (const sign of [-1, 1]) {
      const p = { x: 100 + sign * 15, y: 100 + sign * 15 };
      expect(gateCollides(exit, p, 14, false)).toBe(true);
      expect(gateCollides(exit, p, 14, true)).toBe(false);
    }
    expect(gateCollides(exit, { x: 135, y: 65 }, 14, true)).toBe(true);
    expect(gateCollides(exit, { x: 60, y: 60 }, 14, false)).toBe(false);
  });
});
describe("Chave escondida e portão por fase", () => {
  for (let id = 0; id < 36; id++) it(`câmara ${id}: esconderijo determinístico e alcançável sem abrir o segredo`, () => {
    for (let s = 0; s < 6; s++) {
      const l = generateStage(`KEY:${s}:${id}`, id % 9 === 6, Math.floor(id / 9), id % 9);
      const p = l.props[l.keyHiding.prop];
      expect(["crate", "barrel", "urn"]).toContain(p.kind);
      expect(findPath(l, l.spawn, l.keyHiding.pos).length).toBeGreaterThan(0);
      expect(walkable(l, l.keyHiding.pos.x, l.keyHiding.pos.y)).toBe(true);
      expect(l.keyHiding.hint).toContain("bronze");
      expect(l.keyHiding).toEqual(generateStage(`KEY:${s}:${id}`, id % 9 === 6, Math.floor(id / 9), id % 9).keyHiding);
    }
  });
  it("exige revelar, recolher, restaurar e resolver a recompensa", () => {
    const r = newRun("gate", "blade", 120);
    expect(gateBlock(r, true, false)).toContain("chave");
    expect(collectGateKey(r)).toBe(false); expect(revealGateKey(r)).toBe(true);
    expect(collectGateKey(r)).toBe(true); expect(collectGateKey(r)).toBe(false);
    expect(gateBlock(r, false, false)).toContain("objetivos");
    expect(gateBlock(r, true, true)).toContain("recompensa"); expect(gateBlock(r, true, false)).toBe("");
  });
  it("chave não passa à fase seguinte e descoberta persiste ao recarregar", () => {
    const s = freshSave(), r = newRun("save-key", "blade", 120); s.run = r;
    revealGateKey(r); collectGateKey(r); phaseState(r).gateOpened = true;
    const restored = parseSave(JSON.stringify(s)); expect(restored.run!.phase).toMatchObject({ keyFound: true, keyRevealed: true, gateOpened: true });
    r.current = 1; expect(phaseState(r)).toMatchObject({ keyFound: false, keyRevealed: false, gateOpened: false });
  });
  it("preserva passagem já liberada em saves anteriores e não libera novas fases sem chave", () => {
    const r = newRun("legacy-key", "blade", 120); r.visited = [0];
    expect(phaseState(r).gateOpened).toBe(true);
    r.current = 1; phaseState(r); r.visited.push(1);
    expect(phaseState(r).gateOpened).toBe(false);
  });
});
