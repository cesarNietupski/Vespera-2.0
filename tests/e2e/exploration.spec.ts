import { test, expect, type Page } from "@playwright/test";
import { freshSave } from "../../src/game/save";
const full = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshotFull());
const saved = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
async function boot(page: Page, room = 5) {
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
  await page.evaluate(room => (window as any).vesperaTest.scenario(room), room);
}
async function nearProp(page: Page, kind: string, ordinal = 0) {
  await page.evaluate(({ kind, ordinal }) => (window as any).vesperaTest.positionProp(kind, ordinal), { kind, ordinal });
  await page.waitForTimeout(220);
}
test("fase tem percurso, mapa com posição real e quatro marcos além dos cinco objetivos", async ({ page }) => {
  test.setTimeout(90000);
  await boot(page, 1);
  await page.evaluate(() => { (window as any).vesperaTest.objective("purify"); (window as any).vesperaTest.clearEncounter(false); });
  expect((await full(page)).stage.width).toBe(41);
  expect((await full(page)).stage.markers).toHaveLength(5);
  await page.keyboard.press("Tab");
  await expect(page.locator(".stage-map")).toBeVisible();
  await expect(page.locator(".map-player text")).toHaveText("EIRA · VOCÊ ESTÁ AQUI");
  await expect(page.locator(".map-route-line")).toHaveAttribute("points", /,/);
  const before = await page.locator(".map-player circle").getAttribute("cx");
  await page.screenshot({ path: "test-results/mapa-fase.png" });
  await page.keyboard.press("Escape");
  await page.keyboard.down("d"); await page.waitForTimeout(250); await page.keyboard.up("d");
  await page.keyboard.press("Tab");
  expect(await page.locator(".map-player circle").getAttribute("cx")).not.toBe(before);
  await page.keyboard.press("Escape");
  for (let i = 0; i < 4; i++) {
    await page.evaluate(i => (window as any).vesperaTest.positionRelay(i), i);
    await page.keyboard.down("e"); await page.evaluate(() => (window as any).vesperaTest.step(1.6)); await page.keyboard.up("e");
  }
  expect((await full(page)).stage.relays.every((m: any) => m.done)).toBe(true);
  expect((await saved(page)).run.visited).not.toContain(1);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(i => (window as any).vesperaTest.positionObjective(i), i);
    await page.keyboard.down("e"); await page.evaluate(() => (window as any).vesperaTest.step(2.2)); await page.keyboard.up("e");
  }
  await expect.poll(async () => (await saved(page)).run.visited.includes(1)).toBe(true);
});
test("parede abre passagem e baú secreto; coleta mostra total e desaparece sem duplicar ao recarregar", async ({ page }) => {
  await boot(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".map-chest")).toHaveCount(5);
  await page.keyboard.press("Escape");
  await nearProp(page, "secret-wall");
  await expect(page.locator("#interaction")).toContainText("PAREDE RACHADA");
  await page.keyboard.press("e");
  await expect.poll(async () => (await full(page)).phaseLoot.secretOpened).toBe(true);
  await nearProp(page, "chest", 5);
  await page.keyboard.press("e");
  await expect(page.locator("#loot-echoes")).toContainText("Total na fase: 5");
  await expect(page.locator("#loot-glass")).toContainText("Total na fase: 4");
  const before = await saved(page);
  await page.screenshot({ path: "test-results/passagem-bau-secreto.png" });
  await expect(page.locator("#loot-echoes")).toHaveCount(0, { timeout: 5000 });
  await page.reload(); await page.locator('[data-action="continue"]').click();
  await nearProp(page, "chest", 5); await page.keyboard.press("e");
  expect((await saved(page)).materials).toEqual(before.materials);
  expect((await saved(page)).provisions).toEqual(before.provisions);
  expect((await full(page)).stage.props.filter((p: any) => p.kind === "chest").at(-1).frame).toBe("chest-open");
  await page.keyboard.press("Tab");
  await expect(page.locator(".map-chest")).toHaveCount(6);
  await page.screenshot({ path: "test-results/mapa-segredo-revelado.png" });
});
test("ataques de lâmina e arco quebram props e concedem recursos com totais da fase", async ({ page }) => {
  await boot(page);
  for (const [weapon, kind, resource, amount] of [["blade", "crate", "fiber", 2], ["bow", "barrel", "rawWater", 2]] as const) {
    await page.evaluate(weapon => (window as any).vesperaTest.scenario(5, weapon), weapon);
    await nearProp(page, kind);
    const aim = await page.evaluate(kind => (window as any).vesperaTest.aimProp(kind), kind);
    await page.mouse.click(aim.x, aim.y);
    await expect.poll(async () => (await full(page)).stage.props.find((p: any) => p.kind === kind).hp).toBe(0);
    await expect(page.locator(`#loot-${resource}`)).toContainText(`Total na fase: ${amount}`);
  }
  await page.screenshot({ path: "test-results/props-e-coleta.png" });
});
test("morte perde só parte do saque atual e leva ao refúgio de upgrades junto de Sálvia", async ({ page }) => {
  await boot(page);
  const original = await saved(page);
  await nearProp(page, "chest"); await page.keyboard.press("e");
  await expect.poll(async () => (await saved(page)).materials.iron).toBe(original.materials.iron + 2);
  await page.evaluate(() => (window as any).vesperaTest.lethal());
  await expect(page.locator(".death-loss")).toContainText("30%");
  const after = await saved(page);
  expect(after.materials.iron).toBe(original.materials.iron + 1);
  expect(after.lastLoss.iron).toBe(1);
  expect(after.recovering).toBe(true);
  await page.screenshot({ path: "test-results/morte-perda-parcial.png" });
  await page.getByRole("button", { name: "Ressurgir no Farol →" }).click();
  await expect(page.locator("#interaction")).toContainText("SÁLVIA");
  await page.screenshot({ path: "test-results/refugio-upgrades.png" });
  await page.keyboard.press("e");
  await page.locator('[data-action="npcService"][data-value="salvia"]').click();
  await expect(page.locator(".skill-tree")).toBeVisible();
});
test("defesa exige permanecer no núcleo e usa o objetivo ampliado de 55 segundos", async ({ page }) => {
  await boot(page, 1);
  await page.evaluate(() => {
    (window as any).vesperaTest.objective("defend");
    (window as any).vesperaTest.clearEncounter(false);
    (window as any).vesperaTest.step(12);
  });
  expect((await full(page)).objectiveProgress).toBe(0);
  expect((await full(page)).objectiveTarget).toBe(55);
  await page.evaluate(() => {
    (window as any).vesperaTest.positionObjective(0);
    (window as any).vesperaTest.step(3);
  });
  expect((await full(page)).objectiveProgress).toBeGreaterThanOrEqual(2.9);
  expect((await full(page)).objectiveProgress).toBeLessThan(4);
  await page.evaluate(() => {
    (window as any).vesperaTest.objective("escort");
    (window as any).vesperaTest.clearEncounter(false);
  });
  const start = (await full(page)).stage.markers[0].pos;
  await page.evaluate(() => (window as any).vesperaTest.step(2));
  const moved = (await full(page)).stage.markers[0].pos;
  expect(Math.hypot(moved.x - start.x, moved.y - start.y)).toBeGreaterThan(50);
  expect((await full(page)).objectiveProgress).toBeGreaterThan(0);
});
test("consumo do saque novo preserva as provisões antigas ao calcular a perda por morte", async ({ page }) => {
  const initial = freshSave(); initial.provisions.stew = 2;
  await page.addInitScript(initial => localStorage.setItem("vespera.save.v2", JSON.stringify(initial)), initial);
  await boot(page);
  await nearProp(page, "secret-wall"); await page.keyboard.press("e");
  await expect.poll(async () => (await full(page)).phaseLoot.secretOpened).toBe(true);
  await nearProp(page, "chest", 5); await page.keyboard.press("e");
  await expect.poll(async () => (await saved(page)).provisions.stew).toBe(3);
  await page.evaluate(() => (window as any).vesperaTest.setNeeds(80, 80, 80));
  await page.keyboard.press("i"); await page.locator('[data-provision="stew"] button').click();
  expect((await saved(page)).provisions.stew).toBe(2);
  expect((await full(page)).phaseLoot.atRisk.stew).toBe(0);
  await page.keyboard.press("i");
  await page.evaluate(() => (window as any).vesperaTest.lethal());
  await expect(page.locator(".death-loss")).toBeVisible();
  expect((await saved(page)).provisions.stew).toBe(2);
  expect((await saved(page)).lastLoss.stew).toBeUndefined();
});
