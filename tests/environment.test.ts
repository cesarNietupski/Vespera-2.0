import { expect, it } from "vitest";
import { generateRun } from "../src/game/procedural";
import { generateStage } from "../src/game/exploration";
import { environmentTheme, planEnvironment, LANDSCAPES } from "../src/game/environment";
import { TILE } from "../src/game/config";

for (const node of generateRun("AMBIENTE-QA")) it(`cenário ${node.id}: ambiente determinístico sem bloquear fase, segredo ou portão`, () => {
  const layout = generateStage(node.seed, node.kind === "boss", node.biome, node.id % 9), before = structuredClone(layout);
  const reserved = layout.secretCells;
  const theme = environmentTheme(false, node.biome), plan = planEnvironment(layout, theme, node.seed, reserved);
  expect(plan).toEqual(planEnvironment(layout, theme, node.seed, reserved));
  expect(layout).toEqual(before); expect(plan.props.length).toBeGreaterThan(0); expect(plan.props.length).toBeLessThanOrEqual(320);
  for (const prop of plan.props) {
    const x = Math.floor(prop.pos.x / TILE), y = Math.floor(prop.pos.y / TILE);
    expect(layout.cells[y]?.[x] ?? 0).toBe(0);
    expect(reserved.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) < 2)).toBe(false);
    const forward = (prop.pos.x - layout.exit.x + prop.pos.y - layout.exit.y) / Math.SQRT2;
    const side = (prop.pos.x - layout.exit.x - prop.pos.y + layout.exit.y) / Math.SQRT2;
    expect(forward > -3 * TILE && Math.abs(side) < 4 * TILE).toBe(false);
    expect(prop.frame.startsWith(theme)).toBe(true);
  }
});
it("cinco ambientes têm paletas e elementos próprios", () => {
  expect(environmentTheme(true, 0)).toBe("village"); expect(new Set(Object.values(LANDSCAPES).map(t => t.ground)).size).toBe(5);
});
