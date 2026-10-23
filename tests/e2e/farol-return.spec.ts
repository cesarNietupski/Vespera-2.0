import { test, expect, type Page } from "@playwright/test";
import { openNpc, openExpedition } from "./helpers";

const stored = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
const snap = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshot());

test("retorno após concluir preserva a expedição, permite abastecer e continuar sem repetir saque", async ({ page }) => {
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
  await page.evaluate(() => (window as any).vesperaTest.start("RETORNO-FAROL"));
  await expect(page.locator("#room-return")).toBeHidden();
  await page.evaluate(() => (window as any).vesperaTest.tryService("returnToHub"));
  expect((await stored(page)).run.current).toBe(0);
  await expect(page.getByText("Farol dos Ecos", { exact: true })).toHaveCount(0);
  await page.evaluate(() => (window as any).vesperaTest.prepareCombat());
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
  await page.mouse.click(aim.x, aim.y);
  await page.locator('[data-action="boon"]').first().click();
  await expect(page.locator("#room-return")).toBeVisible();
  const before = await stored(page);
  await page.screenshot({ path: "test-results/retorno-camara.png" });
  await page.locator('#room-return [data-action="returnToHub"]').click();
  await expect(page.getByText("Farol dos Ecos", { exact: true })).toBeVisible();
  const returned = await stored(page);
  for (const key of ["seed", "current", "coins", "boons", "visited", "hp", "charge"])
    expect(returned.run[key]).toEqual(before.run[key]);
  expect(returned.deaths).toBe(before.deaths);
  expect(returned.history).toEqual(before.history);
  await openNpc(page, "caio");
  await page.locator('[data-recipe="tea"] button').click();
  expect((await stored(page)).provisions.tea).toBe(1);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.locator('[data-action="hub"]').click();
  await openExpedition(page);
  await page.screenshot({ path: "test-results/continuar-portal.png" });
  await page.getByRole("button", { name: "Continuar expedição salva →" }).click();
  expect((await snap(page)).cleared).toBe(true);
  expect((await snap(page)).alive).toBe(0);
  const resumed = await stored(page);
  expect(resumed.run.boons).toEqual(before.run.boons);
  expect(resumed.run.coins).toBe(before.run.coins);
  expect(resumed.materials).toEqual(before.materials);
  expect(resumed.echoes).toBe(before.echoes);
  await page.evaluate(() => ((window as any).vesperaTest.unlockGate(), (window as any).vesperaTest.portal()));
  await page.keyboard.press("e");
  await expect.poll(async () => (await snap(page)).room).toBe(1);
  await expect(page.locator("#room-return")).toBeHidden();
});

test("chefes permitem retornar, inclusive antes da decisão final, e continuar do ponto salvo", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
  for (const room of [6, 33]) {
    await page.evaluate((room) => (window as any).vesperaTest.scenario(room), room);
    await page.evaluate(() => (window as any).vesperaTest.ultimate());
    await page.keyboard.press("q");
    if (room === 6) {
      await page.locator('[data-action="boon"]').first().click();
      await page.locator('#room-return [data-action="returnToHub"]').click();
    } else {
      await expect(page.locator("#room-return")).toBeVisible();
      await page.evaluate(() => { const t = (window as any).vesperaTest; t.unlockGate(); t.portal(); }); await page.keyboard.press("e");
      await page.getByRole("button", { name: "Voltar ao Farol antes de decidir" }).click();
    }
    await expect(page.getByText("Farol dos Ecos", { exact: true })).toBeVisible();
    expect((await stored(page)).run.current).toBe(room);
    await openExpedition(page);
    await page.getByRole("button", { name: "Continuar expedição salva →" }).click();
    expect((await snap(page)).room).toBe(room);
    expect((await snap(page)).cleared).toBe(true);
    await page.evaluate(() => ((window as any).vesperaTest.unlockGate(), (window as any).vesperaTest.portal()));
    await page.keyboard.press("e");
    if (room === 6)
      await expect.poll(async () => (await snap(page)).room).toBe(9);
    else
      await expect(page.getByRole("button", { name: /Devolver o movimento ao mundo/ })).toBeVisible();
  }
});
