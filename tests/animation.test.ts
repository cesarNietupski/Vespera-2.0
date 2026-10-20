import { describe, it, expect } from "vitest";
import {
  ANIMATIONS,
  HERO_FRAMES,
  animationFrame,
  framesFor,
  BOSS_PATTERNS,
} from "../src/game/animation";
import { AttackBuffer, COMBOS, comboMove } from "../src/game/combos";
import { AttackTimeline } from "../src/game/combat";
describe("Animações e combos 32 bits", () => {
  it("cada arma possui seis movimentos com animação e janelas de impacto válidas", () => {
    for (const weapon of ["blade", "hammer", "bow"] as const) {
      const moves = COMBOS[weapon];
      expect(moves).toHaveLength(6);
      expect(new Set(moves.map((x) => x.name)).size).toBe(6);
      expect(new Set(moves.map((x) => x.animation)).size).toBe(6);
      for (const m of moves) {
        const n = HERO_FRAMES[m.animation];
        expect(n).toBeGreaterThanOrEqual(8);
        const a = new AttackTimeline(
          n,
          m.duration,
          m.activeStart,
          m.activeEnd,
          0,
          m.power,
          m.animation,
        );
        expect(a.active).toBe(false);
        a.tick((m.duration * (m.activeStart + 0.1)) / n);
        expect(a.active).toBe(true);
        a.tick(m.duration);
        expect(a.finished).toBe(true);
        expect(m.activeEnd).toBeLessThan(n - 1);
      }
      expect(comboMove(weapon, 7)).toEqual(moves[0]);
    }
  });
  it("cliques durante recuperação são preservados e consumidos uma única vez", () => {
    const b = new AttackBuffer();
    b.request();
    b.tick(0.7);
    expect(b.take()).toBe(false);
    expect(b.take()).toBeNull();
    b.request(true);
    expect(b.take()).toBe(true);
    b.request();
    b.tick(1);
    expect(b.take()).toBeNull();
    b.request();
    b.clear();
    expect(b.take()).toBeNull();
  });
  it("ataques, morte, dano e ressurreição terminam no último frame sem repetir", () => {
    for (const state of [
      "attack1",
      "attack6",
      "charged",
      "death",
      "hurt",
      "resurrect",
    ])
      expect(animationFrame("eira", state, 50)).toBe(HERO_FRAMES[state] - 1);
  });
  it("ciclos de corrida e idle se repetem e as contagens seguem o mesmo contrato dos assets", () => {
    expect(animationFrame("eira", "run", 0.65)).toBe(0);
    expect(animationFrame("guardian", "idle", 1.2)).toBe(0);
    expect(framesFor("nim", "interact")).toBe(ANIMATIONS.npc.interact);
    for (const pattern of BOSS_PATTERNS)
      expect(framesFor("boss3", pattern)).toBeGreaterThan(8);
  });
  it("arco alterna tiros gêmeos, leque e perfuração em movimentos próprios", () => {
    expect(COMBOS.bow[2].arrows).toHaveLength(2);
    expect(COMBOS.bow[4].arrows).toHaveLength(3);
    expect(COMBOS.bow[5].pierce).toBe(2);
    expect(COMBOS.hammer[5].arc).toBe(Math.PI);
  });
});
