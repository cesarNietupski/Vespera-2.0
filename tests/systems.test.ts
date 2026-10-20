import { describe, expect, it } from "vitest";
import {
  findPath,
  generateLayout,
  generateRun,
  project,
  reachable,
  unproject,
  validateLayout,
  walkable,
} from "../src/game/procedural";
import {
  AttackTimeline,
  Cooldown,
  damage,
  inArc,
  Vitality,
} from "../src/game/combat";
import { finishRun, freshSave, newRun, parseSave } from "../src/game/save";
import { Objective, OBJECTIVES } from "../src/game/objectives";
import { BOONS, boonStats } from "../src/data/boons";
import { TILE } from "../src/game/config";

describe("Gerador — 100 seeds × 36 câmaras", () => {
  for (let i = 0; i < 100; i++)
    it(`seed ${i}: conectividade, objetivos, spawn, portas, A* e determinismo`, () => {
      const seed = `AURORA-${i}`,
        nodes = generateRun(seed);
      expect(generateRun(seed)).toEqual(nodes);
      expect(nodes).toHaveLength(36);
      const seen = new Set<number>();
      const visit = (id: number) => {
        if (seen.has(id)) return;
        seen.add(id);
        nodes[id].next.forEach(visit);
      };
      visit(0);
      expect(seen.size).toBe(36);
      for (const n of nodes) {
        const l = generateLayout(n.seed, n.kind === "boss");
        expect(generateLayout(n.seed, n.kind === "boss")).toEqual(l);
        expect(validateLayout(l)).toBe(true);
        expect(l.fallback).toBe(false);
        expect(walkable(l, l.spawn.x, l.spawn.y, 25)).toBe(true);
        expect(walkable(l, l.exit.x, l.exit.y, 25)).toBe(true);
        const r = reachable(l, l.spawn);
        expect(
          r.has(
            `${Math.floor(l.exit.x / TILE)},${Math.floor(l.exit.y / TILE)}`,
          ),
        ).toBe(true);
        expect(findPath(l, l.spawn, l.exit).length).toBeGreaterThan(0);
        for (const p of l.objectives) {
          expect(walkable(l, p.x, p.y, 25)).toBe(true);
          expect(findPath(l, l.spawn, p).length).toBeGreaterThan(0);
        }
        for (const p of l.props.filter((p) => p.solid)) {
          expect(l.cells[Math.floor(p.y / TILE)][Math.floor(p.x / TILE)]).toBe(
            0,
          );
        }
      }
    });
  it("projeção reversível preserva coordenadas físicas", () => {
    for (const p of [
      { x: 0, y: 0 },
      { x: 154, y: 754 },
      { x: 980, y: 20 },
    ]) {
      const q = unproject(project(p));
      expect(q.x).toBeCloseTo(p.x);
      expect(q.y).toBeCloseTo(p.y);
    }
  });
});
describe("Combate", () => {
  it("dano não gera HP negativo ou NaN", () => {
    expect(damage(10, 100)).toBe(0);
    expect(damage(10, -10)).toBe(10);
    expect(damage(NaN, 1)).toBe(0);
    expect(damage(10, NaN)).toBe(10);
  });
  it("invulnerabilidade, morte, cura e ressurreição", () => {
    const v = new Vitality(100);
    expect(v.hit(30)).toBe(true);
    expect(v.hit(30)).toBe(false);
    v.tick(0.6);
    expect(v.hit(200)).toBe(true);
    expect(v.dead).toBe(true);
    v.heal(100);
    expect(v.hp).toBe(0);
    v.resurrect();
    expect(v.hp).toBe(100);
    expect(v.dead).toBe(false);
    expect(v.hit(30)).toBe(false);
  });
  it("hitboxes abrem nos frames ativos e fecham na recuperação", () => {
    const a = new AttackTimeline(10, 1, 3, 5, 0);
    expect(a.active).toBe(false);
    a.tick(0.35);
    expect(a.frame).toBe(3);
    expect(a.active).toBe(true);
    expect(a.cancellable).toBe(false);
    a.hit.add(5);
    expect(a.hit.has(5)).toBe(true);
    a.tick(0.3);
    expect(a.active).toBe(false);
    expect(a.cancellable).toBe(true);
    a.tick(0.4);
    expect(a.finished).toBe(true);
  });
  it("cooldowns bloqueiam usos consecutivos", () => {
    const c = new Cooldown(1);
    expect(c.use()).toBe(true);
    expect(c.use()).toBe(false);
    c.tick(0.6);
    expect(c.use()).toBe(false);
    c.tick(0.5);
    expect(c.use()).toBe(true);
  });
  it("hitbox depende de alcance e direção", () => {
    expect(inArc({ x: 0, y: 0 }, { x: 50, y: 0 }, 0, 100)).toBe(true);
    expect(inArc({ x: 0, y: 0 }, { x: -50, y: 0 }, 0, 100)).toBe(false);
    expect(inArc({ x: 0, y: 0 }, { x: 150, y: 0 }, 0, 100)).toBe(false);
  });
});
describe("Objetivos e progressão", () => {
  it("os oito objetivos têm estados e metas concluíveis", () => {
    expect(Object.keys(OBJECTIVES)).toHaveLength(8);
    for (const kind of Object.keys(OBJECTIVES) as (keyof typeof OBJECTIVES)[]) {
      const o = new Objective(kind);
      expect(o.state).toBe("pending");
      o.add(100);
      expect(o.progress).toBe(0);
      o.start();
      o.add(o.target);
      expect(o.state).toBe("completed");
      o.fail();
      expect(o.state).toBe("completed");
    }
  });
  it("falha impede progresso posterior", () => {
    const o = new Objective("defend");
    o.start();
    o.fail();
    o.add(100);
    expect(o.state).toBe("failed");
    expect(o.progress).toBe(0);
  });
  it("24 Juramentos produzem estatísticas de quatro escolas", () => {
    expect(BOONS).toHaveLength(24);
    expect(new Set(BOONS.map((b) => b.id)).size).toBe(24);
    expect(new Set(BOONS.map((b) => b.school)).size).toBe(4);
    expect(boonStats(["Cinza-0", "Cinza-5"]).burn).toBe(10);
    expect(boonStats(["Vidro-0", "Eco-0"])).toEqual({
      damage: 0.22,
      echo: 0.22,
    });
  });
  it("morte mantém apenas recursos, armas, memórias e talentos permanentes", () => {
    const s = freshSave(),
      run = newRun("test", "blade", 120);
    run.coins = 100;
    run.boons = ["Eco-0"];
    run.kills = 12;
    run.visited = [0, 1];
    s.run = run;
    s.unlocked.push("bow");
    s.memories.push("garden");
    s.talents.power = 2;
    finishRun(s, run, "death");
    expect(s.run).toBeNull();
    expect(s.echoes).toBe(12);
    expect(s.deaths).toBe(1);
    expect(s.unlocked).toContain("bow");
    expect(s.memories).toContain("garden");
    expect(s.talents.power).toBe(2);
  });
  it("salvamento valida versão, campos inválidos e campanha retomável", () => {
    expect(parseSave("{broken")).toEqual(freshSave());
    expect(parseSave('{"version":1}')).toEqual(freshSave());
    const s = freshSave();
    s.run = newRun("preserved", "blade", 120);
    s.run.current = 6;
    s.bosses = [0];
    s.endings = ["restore"];
    s.settings.music = 0.7;
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    const bad = parseSave(
      JSON.stringify({
        version: 2,
        echoes: -200,
        unlocked: ["hacked"],
        talents: { power: 99 },
        settings: { music: 10 },
      }),
    );
    expect(bad.echoes).toBe(0);
    expect(bad.unlocked).toEqual(["blade"]);
    expect(bad.talents.power).toBe(5);
    expect(bad.settings.music).toBe(1);
  });
});
