import { it, expect } from "vitest";
import { rng, generateRun } from "../src/game/procedural";
it("a seed varia objetivos enquanto mantém todos os objetivos especiais alcançáveis", () => {
  const a = generateRun("A"),
    b = generateRun("B");
  expect(
    a.filter((n) => n.kind === "objective").map((n) => n.objective),
  ).not.toEqual(
    b.filter((n) => n.kind === "objective").map((n) => n.objective),
  );
  expect(
    new Set(a.filter((n) => n.kind === "objective").map((n) => n.objective))
      .size,
  ).toBe(7);
  const x = rng("same"),
    y = rng("same");
  for (let i = 0; i < 50; i++) expect(x()).toBe(y());
});
