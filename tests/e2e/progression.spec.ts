import { openNpc } from "./helpers";
import { test, expect, type Page } from "@playwright/test";
import { freshSave } from "../../src/game/save";
async function boot(page: Page, funded = true) {
  if (funded) {
    const s = freshSave();
    s.echoes = 400;
    s.materials = { iron: 100, glass: 100, ember: 100 };
    await page.addInitScript((s) => {
      if (!localStorage.getItem("vespera.save.v2"))
        localStorage.setItem("vespera.save.v2", JSON.stringify(s));
    }, s);
  }
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
}
const save = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
const full = (page: Page) =>
  page.evaluate(() => (window as any).vesperaTest.snapshotFull());
test("árvore respeita requisitos, aplica atributos e permite redistribuir após recarregar", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await openNpc(page, "salvia");
  await expect(page.locator('[data-skill="shell"] button')).toBeDisabled();
  await page.locator('[data-skill="vitality"] button').click();
  await expect(page.locator('[data-skill="shell"] button')).toBeEnabled();
  await page.locator('[data-skill="shell"] button').click();
  await expect(page.locator('[data-skill="resolve"] button')).toBeDisabled();
  expect((await full(page)).playerMaxHP).toBe(135);
  expect((await full(page)).combatStats.armor).toBeCloseTo(0.04);
  expect((await save(page)).echoes).toBe(374);
  await page.locator(".panel").evaluate((el) => (el.scrollTop = 350));
  await page.screenshot({ path: "test-results/skilltree.png" });
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  await openNpc(page, "salvia");
  await expect(
    page.locator('[data-skill="shell"] .skill-node-head b'),
  ).toHaveText("1/3");
  await page.locator('[data-action="respec"]').click();
  expect((await save(page)).echoes).toBe(400);
  expect((await full(page)).playerMaxHP).toBe(120);
  await expect(page.locator('[data-skill="shell"] button')).toBeDisabled();
  expect(errors).toEqual([]);
});
test("oficina forja, aprimora e infunde arma persistente com efeito real no combate", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await openNpc(page, "orren");
  const hammer = page.locator('.forge-card[data-weapon="hammer"]');
  await hammer
    .getByRole("button", { name: "Forjar arma", exact: true })
    .click();
  expect((await save(page)).unlocked).toContain("hammer");
  await page.locator('[data-action="forgeMode"][data-value="upgrade"]').click();
  await hammer
    .getByRole("button", { name: "Aprimorar para +1", exact: true })
    .click();
  await expect(hammer.locator("h3")).toHaveText("Âncora Solar +1");
  await page.screenshot({ path: "test-results/crafting-aprimorar.png" });
  await page.locator('[data-action="forgeMode"][data-value="infuse"]').click();
  await page
    .locator('[data-action="infusionChoice"][data-value="ember"]')
    .click();
  await hammer
    .getByRole("button", { name: "Infundir Brasa", exact: true })
    .click();
  await expect(
    hammer.getByRole("button", { name: "Infundir Brasa", exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: "test-results/crafting-infusoes.png" });
  await page.locator('[data-action="forgeMode"][data-value="forge"]').click();
  await hammer.getByRole("button", { name: "Equipar", exact: true }).click();
  const s = await save(page);
  expect(s.materials).toEqual({ iron: 86, glass: 98, ember: 96 });
  expect(s.echoes).toBe(374);
  expect(s.infusions.hammer).toBe("ember");
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  await openNpc(page, "orren");
  await expect(
    hammer.getByRole("button", { name: "Equipada", exact: true }),
  ).toBeDisabled();
  await page.locator(".close-button").click();
  await page.evaluate(() => (window as any).vesperaTest.start("FORJA-REAL"));
  await page.evaluate(() => (window as any).vesperaTest.prepareCombat(100000));
  expect((await full(page)).combatStats.damage).toBeCloseTo(0.12);
  expect((await full(page)).combatStats.burn).toBe(4);
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
  await page.mouse.click(aim.x, aim.y);
  await expect
    .poll(async () => (await full(page)).targets[0].burn)
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await full(page)).targets[0].hp)
    .toBeLessThan(100000);
  expect(errors).toEqual([]);
});
test("materiais de uma câmara restaurada sobrevivem à morte e ao recarregamento", async ({
  page,
}) => {
  test.setTimeout(90000);
  await boot(page, false);
  await page.evaluate(() => {
    (window as any).vesperaTest.start("SALVAGE");
    (window as any).vesperaTest.prepareCombat();
  });
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
  await page.mouse.click(aim.x, aim.y);
  await expect(page.locator('[data-action="boon"]').first()).toBeVisible();
  const found = await save(page);
  expect(found.materials).toEqual({ iron: 7, glass: 4, ember: 0 });
  expect(found.echoes).toBe(2);
  await page.locator('[data-action="boon"]').first().click();
  await page.evaluate(() => (window as any).vesperaTest.lethal());
  await page.getByRole("button", { name: "Ressurgir no Farol →" }).click();
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  await openNpc(page, "orren");
  expect((await save(page)).materials).toEqual(found.materials);
  await expect(page.locator('[data-material="iron"]')).toHaveText("7");
});
