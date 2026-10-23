import { test, expect, type Page } from "@playwright/test";
const full = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshotFull());
async function boot(page: Page, room = 0) {
  await page.goto("/?test=1"); await page.locator('[data-action="hub"]').click();
  await page.evaluate(room => (window as any).vesperaTest.scenario(room), room);
}
async function tune(page: Page, i: number) {
  await page.evaluate(i => (window as any).vesperaTest.positionRelay(i), i);
  await page.keyboard.down("e"); await page.evaluate(() => (window as any).vesperaTest.step(1.55)); await page.keyboard.up("e");
}
test("portais levam a câmaras com geometria, regra e mapa diferentes", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await boot(page);
  const seen: string[] = [];
  for (let room = 0; room < 3; room++) {
    const s = await full(page); expect(s.stage.design.id).toBe(`region-0:stage-${room}`); seen.push(s.stage.geometry);
    if (room === 2) break;
    await page.evaluate(() => (window as any).vesperaTest.finishRoom());
    await page.locator('[data-action="boon"]').first().click();
    await page.evaluate(() => ((window as any).vesperaTest.unlockGate(), (window as any).vesperaTest.portal())); await page.keyboard.press("e");
    if (room === 1) await page.locator('[data-action="route"][data-value="2"]').click();
    await expect.poll(async () => (await full(page)).stage.design.id).toBe(`region-0:stage-${room + 1}`);
  }
  expect(new Set(seen).size).toBe(3);
  await page.waitForTimeout(700);
  if ((await full(page)).screen !== "play") await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  await expect(page.locator(".map-direction")).toContainText("Arquipélago");
  await page.screenshot({ path: "test-results/fase-ilhas.png" });
  expect(errors).toEqual([]);
});
test("labirinto exige ordem e encruzilhada exige pares alternados", async ({ page }) => {
  await boot(page, 1);
  await page.evaluate(() => (window as any).vesperaTest.clearEncounter(false));
  await tune(page, 2); expect((await full(page)).stage.relays[2].done).toBe(false);
  await expect(page.locator("#interaction")).toContainText("MARCO 1 PRIMEIRO");
  await tune(page, 0); expect((await full(page)).stage.relays[0].done).toBe(true);
  await tune(page, 1); expect((await full(page)).stage.relays[1].done).toBe(true);
  await page.keyboard.press("Tab"); await page.screenshot({ path: "test-results/fase-labirinto.png" }); await page.keyboard.press("Escape");
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(4); t.clearEncounter(false); });
  await tune(page, 0); await tune(page, 1); expect((await full(page)).stage.relays[1].done).toBe(false);
  await tune(page, 2); expect((await full(page)).stage.relays[2].done).toBe(true);
});
test("bastião protege marcos com guardas e a galeria exige abrir dois baús", async ({ page }) => {
  await boot(page, 3);
  await tune(page, 0); expect((await full(page)).stage.relays[0].done).toBe(false);
  await expect(page.locator("#interaction")).toContainText("DERROTE OS GUARDAS");
  await page.evaluate(() => (window as any).vesperaTest.clearEncounter(false));
  await tune(page, 0); expect((await full(page)).stage.relays[0].done).toBe(true);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(7); t.clearEncounter(false); });
  expect((await full(page)).stage.stageRequirement).toBe(false);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(i => (window as any).vesperaTest.positionProp("chest", i), i); await page.keyboard.press("e");
    await expect.poll(async () => (await full(page)).phaseLoot.claimed.filter((id: string) => id.startsWith("prop:")).length).toBe(i + 1);
    await expect.poll(async () => (await full(page)).chestInteraction).toBe(null);
  }
  expect((await full(page)).stage.stageRequirement).toBe(true);
});
test("todas as câmaras de uma região têm mapa e identidade visual próprios", async ({ page }) => {
  test.setTimeout(90000); await boot(page);
  const geometries: string[] = [];
  for (const room of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    await page.evaluate(room => (window as any).vesperaTest.scenario(room), room);
    await page.waitForTimeout(700); if ((await full(page)).screen !== "play") await page.keyboard.press("Escape");
    const s = await full(page); geometries.push(s.stage.geometry);
    await page.keyboard.press("Tab");
    await expect(page.locator(".map-direction")).toContainText(s.stage.design.title);
    await page.screenshot({ path: `test-results/camara-unica-${room}.png` }); await page.keyboard.press("Escape");
  }
  expect(new Set(geometries).size).toBe(9);
});
