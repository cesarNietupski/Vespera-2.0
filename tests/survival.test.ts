import { describe, it, expect } from "vitest";
import {
  freshNeeds,
  tickNeeds,
  survivalEffects,
  consumeProvision,
  craftSurvival,
  grantSurvivalLoot,
} from "../src/game/survival";
import { freshSave, parseSave, newRun, finishRun } from "../src/game/save";
import { Vitality } from "../src/game/combat";
import { HUB_NPCS } from "../src/data/npcs";
describe("Fome, sede e exposição ao frio", () => {
  it("aumenta necessidades com o tempo de jogo e não ultrapassa 100", () => {
    const n = freshNeeds();
    tickNeeds(n, 100, 0, "none");
    expect(n.hunger).toBeCloseTo(9);
    expect(n.thirst).toBeCloseTo(14);
    expect(n.cold).toBeCloseTo(3.5);
    tickNeeds(n, 10000, 3, "none");
    expect(n.hunger).toBe(100);
    expect(n.thirst).toBe(100);
    expect(n.cold).toBe(100);
  });
  it("o Farol aquece sem aumentar fome ou sede", () => {
    const n = { hunger: 60, thirst: 70, cold: 80, strain: 2 };
    expect(tickNeeds(n, 20, 0, "none", true)).toBe(0);
    expect(n).toEqual({ hunger: 60, thirst: 70, cold: 40, strain: 0 });
  });
  it("Forjas aumentam a sede e aquecem, enquanto a Cúpula acumula frio", () => {
    const hot = { ...freshNeeds(), cold: 40 },
      cold = freshNeeds();
    tickNeeds(hot, 100, 1, "none");
    tickNeeds(cold, 100, 3, "none");
    expect(hot.thirst).toBeGreaterThan(cold.thirst);
    expect(hot.cold).toBeCloseTo(22);
    expect(cold.cold).toBeCloseTo(21);
  });
  it("manto e casaco reduzem exposição em 45% e 75%", () => {
    const a = freshNeeds(),
      b = freshNeeds(),
      c = freshNeeds();
    tickNeeds(a, 100, 3, "none");
    tickNeeds(b, 100, 3, "cloak");
    tickNeeds(c, 100, 3, "coat");
    expect(b.cold / a.cold).toBeCloseTo(0.55);
    expect(c.cold / a.cold).toBeCloseTo(0.25);
  });
  it("uma fogueira aquece mesmo na região mais fria", () => {
    const n = { ...freshNeeds(), cold: 20 };
    tickNeeds(n, 20, 3, "none", false, true);
    expect(n.cold).toBe(0);
  });
  it("penalidades afetam dano, movimento e velocidade de ataque nos limiares", () => {
    expect(survivalEffects(freshNeeds())).toEqual({
      damage: 1,
      speed: 1,
      attackRate: 1,
    });
    expect(
      survivalEffects({ hunger: 60, thirst: 60, cold: 0, strain: 0 }),
    ).toEqual({ damage: 0.88, speed: 0.9, attackRate: 1 });
    expect(
      survivalEffects({ hunger: 90, thirst: 90, cold: 95, strain: 0 }),
    ).toEqual({ damage: 0.75, speed: 0.68, attackRate: 0.85 });
  });
  it("necessidades críticas causam dano por pulsos e preservam imunidade de combate", () => {
    const n = { hunger: 100, thirst: 100, cold: 100, strain: 0 };
    let amount = 0;
    for (let i = 0; i < 125; i++) amount += tickNeeds(n, 0.04, 3, "none");
    expect(amount).toBeGreaterThan(0);
    const hp = new Vitality(120);
    hp.immune = 5;
    expect(hp.hit(amount, 0, true)).toBe(true);
    expect(hp.hp).toBeLessThan(120);
    expect(hp.immune).toBe(5);
  });
  it("não causa dano abaixo do estado crítico e recusa tempo inválido", () => {
    const n = { hunger: 80, thirst: 80, cold: 80, strain: 0 };
    expect(tickNeeds(n, 1, 0, "none")).toBe(0);
    const before = { ...n };
    tickNeeds(n, NaN, 0, "none");
    expect(n).toEqual(before);
  });
});
describe("Alimentos, bebidas e vestimentas", () => {
  it("comer reduz fome, consome um item e salva a necessidade", () => {
    const s = freshSave(),
      n = { ...freshNeeds(), hunger: 80 };
    expect(consumeProvision(s, n, "ration")).toBe("");
    expect(n.hunger).toBe(40);
    expect(s.provisions.ration).toBe(1);
    expect(s.needs.hunger).toBe(40);
  });
  it("chá aquece e ensopado recupera múltiplas necessidades", () => {
    const s = freshSave();
    s.provisions.tea = 1;
    s.provisions.stew = 1;
    const n = { hunger: 80, thirst: 80, cold: 80, strain: 0 };
    consumeProvision(s, n, "tea");
    expect(n).toEqual({ hunger: 80, thirst: 50, cold: 45, strain: 0 });
    consumeProvision(s, n, "stew");
    expect(n).toEqual({ hunger: 15, thirst: 35, cold: 30, strain: 0 });
  });
  it("não gasta itens sem necessidade ou quando a mochila está vazia", () => {
    const s = freshSave(),
      before = structuredClone(s);
    expect(consumeProvision(s, freshNeeds(), "ration")).toContain("ainda não");
    expect(s).toEqual(before);
    expect(consumeProvision(s, { ...freshNeeds(), cold: 60 }, "tea")).toContain(
      "não possui",
    );
  });
  it("prepara alimentos e purifica água consumindo os ingredientes exatos", () => {
    const s = freshSave();
    expect(craftSurvival(s, "ration")).toBe("");
    expect(s.survivalMaterials.grain).toBe(4);
    expect(s.survivalMaterials.herb).toBe(3);
    expect(s.provisions.ration).toBe(3);
    expect(craftSurvival(s, "water")).toBe("");
    expect(s.survivalMaterials.rawWater).toBe(6);
    expect(s.provisions.water).toBe(3);
  });
  it("vestimentas exigem materiais e progressão, não podem ser forjadas duas vezes", () => {
    const s = freshSave();
    expect(craftSurvival(s, "coat")).toContain("manto");
    expect(craftSurvival(s, "cloak")).toBe("");
    expect(s.clothing).toBe("cloak");
    const before = structuredClone(s);
    expect(craftSurvival(s, "cloak")).toContain("já confeccionada");
    expect(s).toEqual(before);
    expect(craftSurvival(s, "coat")).toContain("Faltam");
  });
  it("receita insuficiente ou desconhecida não altera nenhum recurso", () => {
    const s = freshSave();
    s.survivalMaterials.herb = 0;
    const before = structuredClone(s);
    expect(craftSurvival(s, "stew")).toContain("Faltam");
    expect(craftSurvival(s, "xyz")).toContain("desconhecida");
    expect(s).toEqual(before);
  });
  it("cada função pertence a um dos seis moradores", () => {
    expect(HUB_NPCS).toHaveLength(6);
    expect(new Set(HUB_NPCS.map((n) => n.service)).size).toBe(6);
    expect(HUB_NPCS.find((n) => n.service === "forge")!.id).toBe("orren");
    expect(HUB_NPCS.find((n) => n.service === "skills")!.id).toBe("salvia");
  });
});
describe("Saque e migração de sobrevivência", () => {
  it("câmaras concedem ingredientes e materiais de costura", () => {
    const s = freshSave(),
      node = newRun("food", "blade", 120).nodes[0];
    grantSurvivalLoot(s, node);
    expect(s.survivalMaterials).toEqual({
      grain: 9,
      herb: 5,
      rawWater: 11,
      fiber: 10,
      hide: 3,
    });
  });
  it("save anterior recebe kit inicial e necessidades válidas", () => {
    const s = parseSave(
      JSON.stringify({
        version: 2,
        echoes: 42,
        talents: { power: 2 },
        run: { ...newRun("old", "blade", 120), needs: undefined },
      }),
    );
    expect(s.echoes).toBe(42);
    expect(s.talents.power).toBe(2);
    expect(s.provisions.ration).toBe(2);
    expect(s.run!.needs).toEqual(freshNeeds());
  });
  it("necessidades inválidas e roupas não possuídas são corrigidas", () => {
    const s = parseSave(
      JSON.stringify({
        version: 2,
        needs: { hunger: 400, thirst: -8, cold: "x" },
        clothing: "coat",
        wardrobe: ["hacked"],
        provisions: { ration: -1, water: 2.5 },
        survivalMaterials: { grain: -8, fiber: 3.4 },
      }),
    );
    expect(s.needs).toEqual({ hunger: 100, thirst: 0, cold: 0, strain: 0 });
    expect(s.clothing).toBe("none");
    expect(s.provisions.water).toBe(2);
    expect(s.survivalMaterials.grain).toBe(0);
    expect(s.survivalMaterials.fiber).toBe(3);
  });
  it("morrer preserva estoque e roupas e estabiliza as necessidades no Farol", () => {
    const s = freshSave();
    craftSurvival(s, "cloak");
    const run = newRun("death", "blade", 120);
    run.needs = { hunger: 90, thirst: 95, cold: 99, strain: 4 };
    const bag = structuredClone(s.provisions);
    finishRun(s, run, "death");
    expect(s.needs).toEqual({ hunger: 40, thirst: 40, cold: 0, strain: 0 });
    expect(s.clothing).toBe("cloak");
    expect(s.provisions).toEqual(bag);
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});
