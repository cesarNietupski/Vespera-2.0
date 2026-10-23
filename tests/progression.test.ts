import { describe, it, expect } from "vitest";
import { freshSave, parseSave, newRun, finishRun } from "../src/game/save";
import {
  SKILLS,
  learnSkill,
  skillStats,
  skillRank,
  resetSkills,
  skillRefund,
} from "../src/data/skills";
import {
  craftWeapon,
  progressionStats,
  awardRoomSalvage,
} from "../src/game/crafting";
import { weaponRecord } from "../src/game/weapons";
function funded() {
  const s = freshSave();
  s.echoes = 10000;
  s.weaponXP.blade = 500;
  s.materials = { iron: 1000, glass: 1000, ember: 1000 };
  return s;
}
describe("Árvore de habilidades permanente", () => {
  it("bloqueia ramificações sem pré-requisitos sem gastar Ecos", () => {
    const s = funded(),
      before = structuredClone(s);
    expect(learnSkill(s, "shell")).toContain("Requer");
    expect(s).toEqual(before);
    expect(learnSkill(s, "unknown")).toContain("desconhecida");
  });
  it("desbloqueia os dois caminhos e exige ambos para o talento final", () => {
    const s = funded();
    expect(learnSkill(s, "vitality")).toBe("");
    for (let i = 0; i < 2; i++) expect(learnSkill(s, "shell")).toBe("");
    for (let i = 0; i < 2; i++) expect(learnSkill(s, "resolve")).toBe("");
    expect(learnSkill(s, "dawnheart")).toContain("Fonte interior");
    for (let i = 0; i < 2; i++) learnSkill(s, "siphon");
    learnSkill(s, "sanctuary");
    expect(learnSkill(s, "dawnheart")).toBe("");
    expect(skillStats(s)).toMatchObject({
      hp: 65,
      heal: 10,
      killHeal: 2,
      regen: 0.2,
    });
  });
  it("aplica custos crescentes, limite de níveis e recusa compras sem fundos", () => {
    const s = funded();
    let spent = 0;
    for (let rank = 0; rank < 5; rank++) {
      expect(learnSkill(s, "power")).toBe("");
      spent += 12 + rank * 10;
    }
    expect(s.echoes).toBe(10000 - spent);
    expect(skillStats(s).damage).toBeCloseTo(0.4);
    const last = s.echoes;
    expect(learnSkill(s, "power")).toContain("maximizada");
    expect(s.echoes).toBe(last);
    s.echoes = 0;
    expect(learnSkill(s, "grace")).toContain("insuficientes");
  });
  it("todas as ramificações são alcançáveis e seus efeitos se acumulam", () => {
    const s = funded();
    for (const n of SKILLS)
      for (let i = 0; i < n.max; i++) expect(learnSkill(s, n.id)).toBe("");
    expect(skillStats(s)).toMatchObject({
      startingCharge: 25,
      special: 0.25,
      killHeal: 2,
    });
    expect(skillStats(s).hp).toBe(125);
    expect(skillStats(s).armor).toBeCloseTo(0.18);
    expect(skillStats(s).attackSpeed).toBeCloseTo(0.1);
    expect(skillStats(s).cooldown).toBeCloseTo(0.12);
  });
  it("redistribui com devolução exata, inclusive talentos do save anterior", () => {
    const s = funded();
    for (const id of ["power", "power", "charged", "grace"]) learnSkill(s, id);
    const spent = 10000 - s.echoes;
    expect(skillRefund(s)).toBe(spent);
    expect(resetSkills(s)).toBe(spent);
    expect(s.echoes).toBe(10000);
    expect(skillRank(s, "power")).toBe(0);
    expect(s.skills).toEqual({});
    expect(resetSkills(s)).toBe(0);
  });
});
describe("Receitas, aprimoramentos e infusões", () => {
  it("forja uma arma consumindo a receita uma única vez", () => {
    const s = funded();
    expect(craftWeapon(s, "hammer", "forge")).toBe("");
    expect(s.echoes).toBe(9988);
    expect(s.materials.iron).toBe(994);
    expect(s.materials.ember).toBe(999);
    const before = structuredClone(s);
    expect(craftWeapon(s, "hammer", "forge")).toContain("já forjada");
    expect(s).toEqual(before);
  });
  it("não consome parte dos recursos quando faltam materiais ou Ecos", () => {
    const s = freshSave();
    s.echoes = 100;
    const before = structuredClone(s);
    expect(craftWeapon(s, "hammer", "forge")).toContain("Falta");
    expect(s).toEqual(before);
    s.materials.iron = 100;
    s.echoes = 0;
    s.weaponXP.blade = 60;
    const broke = structuredClone(s);
    expect(craftWeapon(s, "blade", "upgrade")).toContain("Ecos");
    expect(s).toEqual(broke);
  });
  it("exige propriedade, limita +3 e mantém aprimoramentos separados por arma", () => {
    const s = funded();
    expect(craftWeapon(s, "crossbow", "upgrade")).toContain("primeiro");
    for (let i = 0; i < 3; i++)
      expect(craftWeapon(s, "blade", "upgrade")).toBe("");
    const before = structuredClone(s);
    expect(craftWeapon(s, "blade", "upgrade")).toContain("máximo");
    expect(s).toEqual(before);
    expect(s.weaponLevels.bow).toBe(0);
    expect(progressionStats(s, "blade").damage).toBeCloseTo(0.36);
  });
  it("infusão exige +1, substitui o efeito anterior e não devolve reagentes", () => {
    const s = funded();
    expect(craftWeapon(s, "blade", "infuse", "ember")).toContain("+1");
    craftWeapon(s, "blade", "upgrade");
    expect(craftWeapon(s, "blade", "infuse", "ember")).toBe("");
    expect(progressionStats(s, "blade").burn).toBe(4);
    expect(craftWeapon(s, "blade", "infuse", "glass")).toBe("");
    expect(progressionStats(s, "blade").burn).toBeUndefined();
    expect(progressionStats(s, "blade").crit).toBe(0.06);
    const resources = { ...s.materials };
    expect(craftWeapon(s, "blade", "infuse", "none")).toBe("");
    expect(s.materials).toEqual(resources);
    expect(progressionStats(s, "blade").crit).toBe(0);
  });
  it("combina habilidade, forja e infusão sem multiplicar o mesmo bônus duas vezes", () => {
    const s = funded();
    learnSkill(s, "power");
    learnSkill(s, "precision");
    craftWeapon(s, "blade", "upgrade");
    craftWeapon(s, "blade", "infuse", "glass");
    const stats = progressionStats(s, "blade");
    expect(stats.damage).toBeCloseTo(0.2);
    expect(stats.attackSpeed).toBeCloseTo(0.03);
    expect(stats.crit).toBeCloseTo(0.09);
  });
  it("recusa identificadores desconhecidos sem alterar o inventário", () => {
    const s = funded(),
      before = structuredClone(s);
    expect(craftWeapon(s, "x" as any, "forge")).toContain("desconhecida");
    expect(craftWeapon(s, "blade", "x" as any)).toContain("desconhecida");
    expect(s).toEqual(before);
  });
});
describe("Persistência e obtenção de materiais", () => {
  it("a recompensa da câmara é permanente e não pode ser repetida", () => {
    const s = freshSave(),
      run = newRun("crafting", "blade", 120);
    const loot = awardRoomSalvage(s, run.nodes[0], run.visited);
    expect(loot).not.toBeNull();
    expect(s.materials.iron).toBe(7);
    expect(s.materials.glass).toBe(4);
    expect(s.echoes).toBe(2);
    const before = structuredClone(s);
    expect(awardRoomSalvage(s, run.nodes[0], run.visited)).toBeNull();
    expect(s).toEqual(before);
  });
  it("Vigias e Forjas fornecem brasas e a morte preserva todo o equipamento", () => {
    const s = funded(),
      run = newRun("crafting", "blade", 120);
    craftWeapon(s, "blade", "upgrade");
    craftWeapon(s, "blade", "infuse", "ember");
    learnSkill(s, "vitality");
    expect(awardRoomSalvage(s, run.nodes[6], run.visited)?.ember).toBe(4);
    const materials = { ...s.materials };
    finishRun(s, run, "death");
    expect(s.materials).toEqual(materials);
    expect(s.weaponLevels.blade).toBe(1);
    expect(s.infusions.blade).toBe("ember");
    expect(s.talents.vitality).toBe(1);
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it("migra o save v2 antigo sem perder talentos, armas ou campanha", () => {
    const legacy = {
      version: 2,
      echoes: 40,
      talents: { vitality: 2, power: 1, grace: 0 },
      unlocked: ["hammer"],
      run: newRun("legacy", "hammer", 150),
    };
    const s = parseSave(JSON.stringify(legacy));
    expect(s.talents.vitality).toBe(2);
    expect(s.unlocked).toEqual(["blade", "bow", "hammer"]);
    expect(s.run?.seed).toBe("legacy");
    expect(s.weaponLevels).toEqual(weaponRecord(() => 0));
    expect(s.materials).toEqual({ iron: 4, glass: 2, ember: 0 });
    expect(s.skills).toEqual({});
  });
  it("descarta habilidades órfãs e valores de inventário inválidos", () => {
    const s = parseSave(
      JSON.stringify({
        version: 2,
        skills: { shell: 9, dawnheart: 1, unknown: 100 },
        materials: { iron: -5, glass: 2.6, ember: "99" },
        weaponLevels: { blade: 99, hammer: 3 },
        infusions: { blade: "hacked", hammer: "ember" },
        equipped: "hammer",
      }),
    );
    expect(s.skills).toEqual({});
    expect(s.materials).toEqual({ iron: 0, glass: 2, ember: 0 });
    expect(s.weaponLevels).toEqual({ ...weaponRecord(() => 0), blade: 3 });
    expect(s.infusions.blade).toBe("none");
    expect(s.infusions.hammer).toBe("none");
    expect(s.equipped).toBe("blade");
  });
});
