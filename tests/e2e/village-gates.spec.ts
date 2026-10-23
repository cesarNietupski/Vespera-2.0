import { test, expect, type Page } from "@playwright/test";
const full = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshotFull());
async function boot(page: Page, room?: number) {
  await page.goto("/?test=1"); await page.locator('[data-action="hub"]').click();
  if (room !== undefined) await page.evaluate(room => (window as any).vesperaTest.scenario(room), room);
}
async function collectKey(page: Page) {
  await page.evaluate(() => (window as any).vesperaTest.nearKey());
  await expect(page.locator("#interaction")).toContainText("NICHO MARCADO"); await page.keyboard.press("e");
  await expect.poll(async () => (await full(page)).phaseLoot.keyRevealed).toBe(true);
  await page.keyboard.press("e"); await expect.poll(async () => (await full(page)).phaseLoot.keyFound).toBe(true);
}
test("Farol é uma vila com seis casas, mapa e caminhada real até os moradores", async ({ page }) => {
  test.setTimeout(90000); const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await boot(page); expect((await full(page)).village.houses).toHaveLength(6);
  await page.evaluate(() => (window as any).vesperaTest.villageOverview());
  await page.screenshot({ path: "test-results/vila-farol-panorama.png" });
  await page.keyboard.press("Tab"); await expect(page.locator(".village-map")).toBeVisible();
  await expect(page.locator("[data-village-house]")).toHaveCount(6);
  await page.screenshot({ path: "test-results/mapa-vila.png" });
  for (const id of ["lume", "orren", "caio", "iria", "nim", "salvia"]) {
    if ((await full(page)).screen !== "map") await page.keyboard.press("Tab");
    await page.locator(`[data-action="villageGuide"][data-value="${id}"]`).click();
    await expect.poll(async () => (await full(page)).village.target, { timeout: 20000 }).toBe(null);
    await expect.poll(async () => (await full(page)).village.houses.find((h: any) => h.npc === id).roofAlpha).toBeLessThan(.2);
    await page.keyboard.press("e"); await expect(page.locator(`[data-action="npcService"][data-value="${id}"]`)).toBeVisible();
    if (id === "orren") await page.screenshot({ path: "test-results/casa-ferreiro.png" });
    await page.keyboard.press("Escape");
  }
  expect(errors).toEqual([]);
});
test("portão exige chave e objetivos; abertura é animada e a próxima fase começa sem chave", async ({ page }) => {
  await boot(page, 0); await page.evaluate(() => (window as any).vesperaTest.clearEncounter(false));
  await page.evaluate(() => (window as any).vesperaTest.portal()); await page.keyboard.press("e");
  await expect(page.locator("#interaction")).toContainText("TRANCADO"); expect((await full(page)).stage.design.id).toBe("region-0:stage-0");
  await page.keyboard.press("Tab"); await expect(page.locator(".map-key")).toHaveCount(0); await expect(page.locator(".key-clue")).toContainText("bronze"); await page.keyboard.press("Escape");
  await collectKey(page);
  await page.keyboard.press("i"); await expect(page.locator("[data-key-stock]")).toContainText("Quantidade: 1"); await page.keyboard.press("i");
  await page.evaluate(() => (window as any).vesperaTest.portal()); await page.keyboard.press("e");
  await expect(page.locator("#toast")).toContainText("objetivos");
  await page.evaluate(() => (window as any).vesperaTest.finishRoom()); await page.locator('[data-action="boon"]').first().click();
  await page.keyboard.press("e");
  await page.waitForFunction(() => (window as any).vesperaTest.snapshotFull().stage.gateOpening > .2, null, { polling: "raf" });
  expect((await full(page)).stage.gateFrame).toMatch(/^gate-open-[0-7]$/);
  await page.screenshot({ path: "test-results/portao-abrindo.png" });
  await expect.poll(async () => (await full(page)).stage.design.id).toBe("region-0:stage-1");
  expect((await full(page)).phaseLoot.keyFound).toBe(false);
});
test("quebrar o esconderijo revela a chave e o save preserva descoberta e posse", async ({ page }) => {
  await boot(page, 5); await page.evaluate(() => (window as any).vesperaTest.nearKey());
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimKey()); await page.mouse.click(aim.x, aim.y);
  await expect.poll(async () => (await full(page)).phaseLoot.keyRevealed).toBe(true);
  await page.screenshot({ path: "test-results/chave-revelada.png" });
  await page.reload(); await page.locator('[data-action="continue"]').click();
  expect((await full(page)).phaseLoot.keyRevealed).toBe(true); expect((await full(page)).phaseLoot.keyFound).toBe(false);
  await page.keyboard.press("Tab"); await expect(page.locator(".map-key")).toHaveCount(1); await page.keyboard.press("Escape");
  await page.evaluate(() => (window as any).vesperaTest.nearKey()); await page.keyboard.press("e");
  await expect.poll(async () => (await full(page)).phaseLoot.keyFound).toBe(true);
  await page.reload(); await page.locator('[data-action="continue"]').click(); expect((await full(page)).phaseLoot.keyFound).toBe(true);
});
test("último chefe também exige chave e portão para acessar a decisão final", async ({ page }) => {
  await boot(page, 33); await page.evaluate(() => (window as any).vesperaTest.ultimate()); await page.keyboard.press("q");
  await expect.poll(async () => (await full(page)).stage.gateFrame).toBe("gate-closed");
  await expect(page.locator('[data-action="ending"]')).toHaveCount(0);
  await collectKey(page); await page.evaluate(() => (window as any).vesperaTest.portal()); await page.keyboard.press("e");
  await expect(page.getByRole("button", { name: /Devolver o movimento ao mundo/ })).toBeVisible();
});
test("retorno à vila preserva a fase restaurada sem dispensar sua chave", async ({ page }) => {
  await boot(page, 0); await page.evaluate(() => (window as any).vesperaTest.finishRoom()); await page.locator('[data-action="boon"]').first().click();
  await page.locator('#room-return [data-action="returnToHub"]').click(); await expect.poll(async () => !!(await full(page)).village).toBe(true);
  await page.evaluate(() => (window as any).vesperaTest.portal()); await page.keyboard.press("e"); await page.locator('[data-action="continue"]').click();
  expect((await full(page)).phaseLoot.keyFound).toBe(false); expect((await full(page)).stage.gateFrame).toBe("gate-closed");
  await collectKey(page);
});

test("portões terminais impedem caminhar e esquivar através das folhas fechadas", async ({ page }) => {
  test.setTimeout(90000);
  await boot(page);
  for (const room of [0, 6, 9, 15, 18, 24, 27, 33]) {
    await page.evaluate(room => {
      const t = (window as any).vesperaTest; t.scenario(room); t.finishRoom();
    }, room);
    if (room !== 33) await page.locator('[data-action="boon"]').first().click();
    await page.evaluate(() => (window as any).vesperaTest.portal());
    const before = await full(page);
    await page.keyboard.down("s"); await page.waitForTimeout(450);
    await page.keyboard.press("Space"); await page.waitForTimeout(450); await page.keyboard.up("s");
    const after = await full(page), exit = after.stage.exit, p = after.playerPosition;
    const normal = ((p.x - exit.x) + (p.y - exit.y)) / Math.SQRT2;
    expect(p.x + p.y).toBeGreaterThan(before.playerPosition.x + before.playerPosition.y);
    expect(normal).toBeLessThanOrEqual(-25.9);
    expect(normal).toBeGreaterThan(-40);
    expect(after.stage.gateFrame).toBe("gate-closed");
    await expect(page.locator("#interaction")).toContainText("TRANCADO");
    if (room === 0) await page.screenshot({ path: "test-results/portao-terminal-colisor.png" });
  }
});
