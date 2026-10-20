import { describe, it, expect } from "vitest";
import { obscuresActor, approachAlpha } from "../src/game/presentation";

describe("Sobreposição de cenário isométrico", () => {
  const column = { x: 200, y: 300, halfWidth: 30, height: 160 };
  it("um pilar à frente do personagem deve revelar seu corpo", () => {
    expect(obscuresActor(column, { x: 200, y: 270 })).toBe(true);
  });
  it("passar à frente do pilar mantém a arquitetura opaca", () => {
    expect(obscuresActor(column, { x: 200, y: 310 })).toBe(false);
  });
  it("não torna transparente um pilar ao lado ou distante do ator", () => {
    expect(obscuresActor(column, { x: 260, y: 270 })).toBe(false);
    expect(obscuresActor(column, { x: 200, y: 100 })).toBe(false);
  });
  it("a transição tem a mesma duração em 30 ou 60 FPS e não ultrapassa o alvo", () => {
    let a = 1,
      b = 1;
    for (let i = 0; i < 30; i++) a = approachAlpha(a, 0.22, 1 / 30);
    for (let i = 0; i < 60; i++) b = approachAlpha(b, 0.22, 1 / 60);
    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeGreaterThanOrEqual(0.22);
    expect(a).toBeLessThan(0.23);
  });
});
