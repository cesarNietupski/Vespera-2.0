import { test, expect, type Page } from "@playwright/test";
import { freshSave } from "../../src/game/save";
import { openNpc } from "./helpers";
const snapshot = (p: Page) =>
  p.evaluate(() => (window as any).vesperaTest.snapshotFull());
const stored = (p: Page) =>
  p.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
async function boot(p: Page) {
  const s = freshSave();
  s.echoes = 200;
  s.materials = { iron: 100, glass: 100, ember: 100 };
  s.survivalMaterials = {
    grain: 50,
    herb: 50,
    rawWater: 50,
    fiber: 50,
    hide: 50,
  };
  await p.addInitScript((s) => {
    if (!localStorage.getItem("vespera.save.v2"))
      localStorage.setItem("vespera.save.v2", JSON.stringify(s));
  }, s);
  await p.goto("/?test=1");
  await p.locator('[data-action="hub"]').click();
}
test("seis moradores e acesso à forja e árvore exigem conversa e proximidade", async ({
  page,
}) => {
  await boot(page);
  expect((await snapshot(page)).hubNpcs).toHaveLength(6);
  expect((await snapshot(page)).hubNpcs.every((n: any) => n.walkable)).toBe(
    true,
  );
  await expect(page.locator(".hub-tools")).toHaveCount(0);
  await expect(page.locator('[data-action="armory"]')).toHaveCount(0);
  await expect(page.locator('[data-action="talents"]')).toHaveCount(0);
  const before = await stored(page);
  await page.evaluate(() => {
    (window as any).vesperaTest.tryService("armory");
    (window as any).vesperaTest.tryService("craft", "hammer:forge:none");
  });
  expect((await snapshot(page)).screen).toBe("play");
  expect((await stored(page)).materials).toEqual(before.materials);
  await openNpc(page, "orren");
  await expect(
    page.getByRole("heading", { name: "Metal que ainda se lembra" }),
  ).toBeVisible();
  await page.evaluate(() => (window as any).vesperaTest.portal());
  await page.locator('.forge-card[data-weapon="hammer"] button').click();
  expect((await stored(page)).unlocked).not.toContain("hammer");
  await page.keyboard.press("Escape");
  await openNpc(page, "salvia");
  await expect(page.locator(".skill-tree")).toBeVisible();
  await page.screenshot({ path: "test-results/salvia-habilidades.png" });
});
test("andar até Lume, falar e preparar comida; Caio purifica e Íria confecciona", async ({
  page,
}) => {
  test.setTimeout(90000);
  await boot(page);
  await page.keyboard.down("d");
  await page.keyboard.down("s");
  await expect(page.locator("#interaction")).toContainText("LUME");
  await page.keyboard.up("d");
  await page.keyboard.up("s");
  await page.keyboard.press("e");
  await page.locator('[data-action="npcService"][data-value="lume"]').click();
  const before = (await stored(page)).provisions.ration;
  await page.locator('[data-recipe="ration"] button').click();
  expect((await stored(page)).provisions.ration).toBe(before + 1);
  await page.screenshot({ path: "test-results/lume-cozinha.png" });
  await page.keyboard.press("Escape");
  await openNpc(page, "caio");
  await page.locator('[data-recipe="tea"] button').click();
  expect((await stored(page)).provisions.tea).toBe(1);
  await page.screenshot({ path: "test-results/caio-bebidas.png" });
  await page.keyboard.press("Escape");
  await openNpc(page, "iria");
  await page.locator('[data-recipe="cloak"] button').click();
  await page.locator('[data-recipe="coat"] button').click();
  expect((await stored(page)).clothing).toBe("coat");
  await page.screenshot({ path: "test-results/iria-vestimentas.png" });
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  expect((await stored(page)).clothing).toBe("coat");
  await page.screenshot({ path: "test-results/farol-seis-npcs.png" });
});
test("necessidades têm efeitos, param em pausa e provisões restauram durante a expedição", async ({
  page,
}) => {
  test.setTimeout(90000);
  await boot(page);
  await page.evaluate(() => {
    (window as any).vesperaTest.scenario(1);
    (window as any).vesperaTest.objective("purify");
    (window as any).vesperaTest.clearEncounter();
    (window as any).vesperaTest.setNeeds(90, 90, 95);
  });
  await expect
    .poll(async () => (await snapshot(page)).needsEffects.damage)
    .toBe(0.75);
  expect((await snapshot(page)).needsEffects.attackRate).toBe(0.85);
  await page.keyboard.press("Escape");
  const paused = (await snapshot(page)).needs;
  await page.evaluate(() => (window as any).vesperaTest.step(20));
  expect((await snapshot(page)).needs).toEqual(paused);
  await page.keyboard.press("Escape");
  await page.keyboard.press("r");
  await page.keyboard.press("t");
  await expect
    .poll(async () => (await snapshot(page)).needs.hunger)
    .toBeLessThan(55);
  await expect
    .poll(async () => (await snapshot(page)).needs.thirst)
    .toBeLessThan(50);
  await page.locator('[data-action="provisions"]').click();
  await expect(page.locator(".needs-summary")).toBeVisible();
  await expect(page.locator("#announcement")).toBeHidden();
  await page.screenshot({ path: "test-results/necessidades-provisoes.png" });
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    (window as any).vesperaTest.setNeeds(100, 100, 100);
    (window as any).vesperaTest.step(6);
  });
  await expect
    .poll(() => page.evaluate(() => (window as any).vesperaTest.snapshot().hp))
    .toBeLessThan(120);
  const saved = (await snapshot(page)).needs;
  await page.keyboard.press("Escape");
  await page.reload();
  await page.locator('[data-action="continue"]').click();
  expect((await snapshot(page)).needs.hunger).toBeCloseTo(saved.hunger, 0);
});
