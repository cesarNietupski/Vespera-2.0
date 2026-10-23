import { describe, it, expect } from "vitest";
import { generateStage, openSecret, exploreCells } from "../src/game/exploration";
import { validateLayout, findPath, walkable } from "../src/game/procedural";
import { grantLoot, losePhaseLoot, phaseState, parsePhase, spendPhaseLoot } from "../src/game/loot";
import { freshSave, newRun, parseSave, finishRun } from "../src/game/save";

describe("Fases com percurso, objetivos e passagens", () => {
  for (let i = 0; i < 60; i++) it(`seed ${i}: rota longa conectada, cinco objetivos e segredo opcional`, () => {
    const layout = generateStage(`FASE-${i}`);
    expect(layout).toEqual(generateStage(`FASE-${i}`));
    expect(validateLayout(layout)).toBe(true);
    expect(findPath(layout, layout.spawn, layout.exit).length).toBeGreaterThan(45);
    expect(layout.objectives).toHaveLength(5);
    expect(layout.relays).toHaveLength(4);
    expect(layout.props.filter(p => p.kind === "chest")).toHaveLength(6);
    expect(walkable(layout, layout.secretChest!.x, layout.secretChest!.y)).toBe(false);
    expect(findPath(layout, layout.spawn, layout.secretChest!)).toHaveLength(0);
    const original = findPath(layout, layout.spawn, layout.exit).length;
    openSecret(layout);
    expect(findPath(layout, layout.spawn, layout.secretChest!).length).toBeGreaterThan(0);
    expect(findPath(layout, layout.spawn, layout.exit).length).toBe(original);
  });
  it("chefes mantêm arena válida, com baú e portal alcançável", () => {
    const layout = generateStage("CHEFE", true);
    expect(validateLayout(layout)).toBe(true);
    expect(layout.relays).toHaveLength(0);
    expect(layout.props.some(p => p.kind === "chest")).toBe(true);
  });
  it("exploração não revela pisos secretos fechados nem duplica células", () => {
    const layout = generateStage("FOG"), known = exploreCells(layout, layout.spawn, []);
    expect(exploreCells(layout, layout.spawn, known)).toEqual(known);
    expect(known.length).toBeGreaterThan(0);
    expect(known).not.toContain(27 * layout.width + 6);
  });
});
describe("Saque, persistência e perda parcial", () => {
  it("consumir saque novo remove seu risco sem descontar o estoque anterior na morte", () => {
    const save = freshSave(), run = newRun("CONSUME", "blade", 120);
    grantLoot(save, run, { water: 2 });
    save.provisions.water -= 2; spendPhaseLoot(run, "water", 2);
    expect(phaseState(run).collected.water).toBe(2);
    expect(losePhaseLoot(save, run)).toEqual({});
    expect(save.provisions.water).toBe(2);
  });
  it("concede todos os tipos de recurso uma única vez e registra total da fase", () => {
    const save = freshSave(), run = newRun("LOOT", "blade", 120);
    const packet = { iron: 4, grain: 3, water: 1, echoes: 2, coins: 8 };
    expect(grantLoot(save, run, packet, "chest:1")).toEqual(packet);
    expect(grantLoot(save, run, packet, "chest:1")).toEqual({});
    expect(save.materials.iron).toBe(8);
    expect(save.provisions.water).toBe(3);
    expect(run.coins).toBe(8);
    expect(phaseState(run).collected).toEqual(packet);
  });
  it("perde 30% arredondado para cima apenas do saque atual em risco", () => {
    const save = freshSave(), run = newRun("LOSS", "blade", 120);
    grantLoot(save, run, { iron: 10, grain: 4, tea: 1, echoes: 10, coins: 8 });
    expect(losePhaseLoot(save, run)).toEqual({ iron: 3, grain: 2, tea: 1, echoes: 3 });
    expect(save.materials.iron).toBe(11);
    expect(save.survivalMaterials.grain).toBe(8);
    expect(losePhaseLoot(save, run)).toEqual({});
  });
  it("recursos guardados no Farol e de fases anteriores não sofrem perda", () => {
    const save = freshSave(), run = newRun("BANK", "blade", 120);
    grantLoot(save, run, { iron: 10 }); phaseState(run).atRisk = {};
    expect(losePhaseLoot(save, run)).toEqual({});
    run.current = 1;
    grantLoot(save, run, { iron: 3 });
    expect(phaseState(run).collected).toEqual({ iron: 3 });
    expect(losePhaseLoot(save, run)).toEqual({ iron: 1 });
    expect(save.materials.iron).toBe(16);
  });
  it("continuação preserva baús, marcos, segredo e totais sem reabrir saque", () => {
    const save = freshSave(), run = newRun("SAVE", "blade", 120);
    grantLoot(save, run, { glass: 5 }, "prop:2");
    Object.assign(phaseState(run), { relays: [0, 1], explored: [11, 12], secretOpened: true });
    save.run = run;
    const restored = parseSave(JSON.stringify(save));
    expect(restored.run!.phase).toEqual(run.phase);
    expect(grantLoot(restored, restored.run!, { glass: 5 }, "prop:2")).toEqual({});
  });
  it("migra saves antigos e limita ledger corrompido aos recursos coletados", () => {
    expect(parsePhase(null, 0)).toBeUndefined();
    const data = parsePhase({ room: 0, collected: { iron: 2 }, atRisk: { iron: 999, glass: 8 }, relays: [0, 0, 99], claimed: ["ok", 7], explored: [2, -1] }, 0)!;
    expect(data.atRisk).toEqual({ iron: 2, glass: 0 });
    expect(data.relays).toEqual([0]);
    expect(data.claimed).toEqual(["ok"]);
  });
  it("morte registra perdas e encaminha ao refúgio sem apagar roupas ou habilidades", () => {
    const save = freshSave(), run = newRun("DEATH", "blade", 120);
    save.wardrobe.push("cloak"); save.clothing = "cloak";
    grantLoot(save, run, { iron: 5 }); finishRun(save, run, "death");
    expect(save.lastLoss).toEqual({ iron: 2 });
    expect(save.recovering).toBe(true);
    expect(save.run).toBeNull();
    expect(save.clothing).toBe("cloak");
  });
});
