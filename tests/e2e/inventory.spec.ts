import { test, expect, type Page } from "@playwright/test";
import { freshSave, newRun } from "../../src/game/save";
import { BOONS } from "../../src/data/boons";

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
const full = (page: Page) => page.evaluate(() => (window as any).vesperaTest.snapshotFull());
async function boot(page: Page) {
  const s = freshSave();
  s.echoes = 123;
  s.materials = { iron: 17, glass: 0, ember: 9 };
  s.survivalMaterials = { grain: 11, herb: 7, rawWater: 3, fiber: 0, hide: 4 };
  s.provisions = { ration: 2, stew: 1, water: 2, tea: 1 };
  s.wardrobe = ["none", "cloak"];
  s.unlocked = ["blade", "hammer"];
  s.weaponLevels.blade = 1;
  s.run = newRun("INVENTARIO-SALVO", "blade", 120);
  s.run.coins = 37;
  s.run.boons = [BOONS[0].id];
  await page.addInitScript((s) => {
    if (!localStorage.getItem("vespera.save.v2")) localStorage.setItem("vespera.save.v2", JSON.stringify(s));
  }, s);
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
}

test("inventário pelo HUD, tecla I e pausa mostra todos os recursos e equipamento salvo", async ({ page }) => {
  await boot(page);
  await page.getByRole("button", { name: "I · Inventário" }).click();
  await expect(page.getByRole("heading", { name: "Inventário de Eira" })).toBeVisible();
  await expect(page.locator('[data-wallet="echoes"]')).toHaveText("123");
  await expect(page.locator('[data-wallet="coins"]')).toHaveText("37");
  await page.locator('[data-action="inventoryTab"][data-value="resources"]').click();
  const stocks = { grain: 11, herb: 7, rawWater: 3, fiber: 0, hide: 4, iron: 17, glass: 0, ember: 9 };
  await expect(page.locator("[data-stock]")).toHaveCount(8);
  for (const [id, amount] of Object.entries(stocks))
    await expect(page.locator(`[data-stock="${id}"] .item-count`)).toHaveText(String(amount));
  await page.screenshot({ path: "test-results/inventario-recursos.png" });
  const before = await stored(page);
  await expect(page.locator('[data-action="craftProvision"], [data-action="craft"], [data-action="talents"]')).toHaveCount(0);
  await page.evaluate(() => (window as any).vesperaTest.tryService("craftProvision", "ration"));
  expect((await stored(page)).survivalMaterials).toEqual(before.survivalMaterials);
  expect((await stored(page)).provisions).toEqual(before.provisions);
  await page.locator('[data-action="inventoryTab"][data-value="equipment"]').click();
  await expect(page.locator("[data-owned-weapon]")).toHaveCount(13);
  await expect(page.locator('[data-owned-weapon="blade"]')).toContainText("Fioferro +1");
  await expect(page.locator('[data-owned-weapon="bow"]')).toContainText("Quantidade: 1");
  await expect(page.locator(".inventory-list")).toContainText(BOONS[0].name);
  await page.keyboard.press("i");
  expect((await full(page)).screen).toBe("play");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Inventário · comidas, roupas e recursos" }).click();
  await expect(page.locator(".inventory-tabs")).toBeVisible();
  await page.getByRole("button", { name: "×", exact: true }).click();
  await page.keyboard.press("i");
  await expect(page.locator(".inventory-tabs")).toBeVisible();
});

test("consumir comidas e bebidas atualiza estoque e necessidades sem desperdício e pausa o tempo", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).vesperaTest.setNeeds(90, 90, 80));
  await page.keyboard.press("i");
  const paused = (await full(page)).needs;
  await page.evaluate(() => (window as any).vesperaTest.step(20));
  expect((await full(page)).needs).toEqual(paused);
  await page.locator('[data-provision="ration"] button').click();
  await expect(page.locator('[data-provision="ration"] .item-count')).toHaveText("1");
  expect((await full(page)).needs.hunger).toBe(50);
  await page.locator('[data-provision="stew"] button').click();
  await page.locator('[data-provision="water"] button').click();
  await page.locator('[data-provision="tea"] button').click();
  expect((await stored(page)).provisions).toEqual({ ration: 1, stew: 0, water: 1, tea: 0 });
  expect((await full(page)).needs).toMatchObject({ hunger: 0, thirst: 0 });
  expect((await full(page)).needs.cold).toBeLessThanOrEqual(30);
  await expect(page.locator('[data-provision="ration"] button')).toBeDisabled();
  await expect(page.locator('[data-provision="tea"] button')).toBeDisabled();
  await expect(page.locator("#announcement")).toBeHidden();
  await page.screenshot({ path: "test-results/inventario-provisoes.png" });
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  await page.keyboard.press("i");
  await expect(page.locator('[data-provision="stew"] .item-count')).toHaveText("0");
  await expect(page.locator('[data-provision="water"] .item-count')).toHaveText("1");
});

test("vestir roupas possuídas no inventário durante a expedição persiste e não permite criar remotamente", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    (window as any).vesperaTest.scenario(18);
    (window as any).vesperaTest.prepareCombat(100000);
  });
  await page.keyboard.press("i");
  await page.locator('[data-action="inventoryTab"][data-value="clothes"]').click();
  await expect(page.locator('[data-outfit="coat"] button')).toBeDisabled();
  await page.locator('[data-outfit="cloak"] button').click();
  expect((await stored(page)).clothing).toBe("cloak");
  await expect(page.locator('[data-outfit="cloak"] button')).toHaveText("Equipada");
  const before = await stored(page);
  await page.evaluate(() => (window as any).vesperaTest.tryService("craftProvision", "coat"));
  expect((await stored(page)).wardrobe).toEqual(before.wardrobe);
  expect((await stored(page)).survivalMaterials).toEqual(before.survivalMaterials);
  await page.locator('[data-outfit="none"] button').click();
  expect((await stored(page)).clothing).toBe("none");
  await page.locator('[data-outfit="cloak"] button').click();
  await page.screenshot({ path: "test-results/inventario-vestimentas.png" });
  await page.keyboard.press("i");
  expect((await full(page)).screen).toBe("play");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.locator('[data-action="continue"]').click();
  await page.keyboard.press("i");
  await page.locator('[data-action="inventoryTab"][data-value="clothes"]').click();
  await expect(page.locator('[data-outfit="cloak"] button')).toHaveText("Equipada");
  expect((await stored(page)).clothing).toBe("cloak");
});
