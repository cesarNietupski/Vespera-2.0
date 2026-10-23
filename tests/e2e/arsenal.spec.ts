import { test, expect, type Page } from "@playwright/test";
import { freshSave } from "../../src/game/save";
import { WEAPON_IDS } from "../../src/game/weapons";
import { openNpc } from "./helpers";
const full = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshotFull());
const saved = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
async function boot(page: Page, funded = false) {
  if (funded) {
    const s = freshSave(); s.unlocked = [...WEAPON_IDS]; s.echoes = 1000; s.materials = { iron: 1000, glass: 1000, ember: 1000 };
    s.weaponXP.crossbow = 80;
    await page.addInitScript(s => { if (!localStorage.getItem("vespera.save.v2")) localStorage.setItem("vespera.save.v2", JSON.stringify(s)); }, s);
  }
  await page.goto("/?test=1"); await page.locator('[data-action="hub"]').click();
}
test("baú tem aproximação, personagem interagindo, tampa gradual e cancelamento sem duplicar saque", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(5); t.positionProp("chest"); });
  await expect(page.locator("#interaction")).toContainText("ABRIR BAÚ");
  const before = (await saved(page)).materials.iron;
  await page.keyboard.press("e");
  await expect.poll(async () => !!(await full(page)).chestInteraction).toBe(true);
  await expect.poll(async () => (await full(page)).playerAnimation).toBe("interact");
  await page.keyboard.press("Space");
  await expect.poll(async () => (await full(page)).chestInteraction).toBe(null);
  expect((await saved(page)).materials.iron).toBe(before);
  await page.waitForTimeout(350);
  await page.evaluate(() => (window as any).vesperaTest.positionProp("chest"));
  await page.keyboard.press("e");
  await page.waitForFunction(() => { const s = (window as any).vesperaTest.snapshotFull(); return s.chestInteraction?.time > .6 && s.chestInteraction?.time < .9; }, null, { polling: "raf" });
  const opening = await full(page);
  expect(opening.playerAnimation).toBe("interact");
  expect(opening.stage.props.find((p: any) => p.kind === "chest").frame).toMatch(/^chest-open-[0-7]$/);
  await page.screenshot({ path: "test-results/bau-animacao.png" });
  await expect(page.locator("#loot-iron")).toContainText("Total na fase: 2");
  await expect.poll(async () => (await full(page)).chestInteraction).toBe(null);
  await page.keyboard.press("e"); expect((await saved(page)).materials.iron).toBe(before + 2);
});
test("inventário equipa duas armas e F troca; projétil atribui XP à arma que o disparou", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await boot(page, true);
  await page.keyboard.press("i"); await page.locator('[data-action="inventoryTab"][data-value="equipment"]').click();
  await page.locator('[data-owned-weapon="dagger"] [data-action="equipWeapon"]').click();
  await expect.poll(async () => (await full(page)).playerTexture).toBe("eira-dagger");
  await page.locator('[data-owned-weapon="crossbow"] [data-action="equipWeapon"]').click();
  await expect.poll(async () => (await full(page)).playerTexture).toBe("eira-crossbow");
  expect((await saved(page)).loadout).toEqual({ melee: "dagger", ranged: "crossbow" });
  await page.keyboard.press("i");
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.start("DUAL"); t.prepareCombat(25); });
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
  await page.mouse.click(aim.x, aim.y);
  await expect.poll(async () => (await full(page)).weaponXP.crossbow).toBe(90);
  expect((await full(page)).weaponXP.dagger).toBe(0);
  const reward = page.locator('[data-action="boon"]').first(); if (await reward.isVisible()) await reward.click();
  await expect.poll(async () => (await full(page)).chestInteraction).toBe(null);
  await page.waitForTimeout(1000);
  if (await reward.isVisible()) await reward.click();
  await page.keyboard.press("f");
  await expect.poll(async () => (await full(page)).activeWeapon).toBe("dagger");
  await expect(page.locator('.compact [data-slot="melee"]')).toHaveClass(/active/);
  await page.screenshot({ path: "test-results/arsenal-duplo.png" });
  await page.reload(); await page.locator('[data-action="continue"]').click();
  expect((await full(page)).loadout).toEqual({ melee: "dagger", ranged: "crossbow" });
  expect((await full(page)).weaponXP.crossbow).toBe(90);
  expect(errors).toEqual([]);
});
test("Orren abre árvore individual e bloqueia upgrades sem experiência daquela arma", async ({ page }) => {
  await boot(page, true); await openNpc(page, "orren");
  await expect(page.locator(".forge-card")).toHaveCount(13);
  await page.locator('[data-action="forgeMode"][data-value="upgrade"]').click();
  await expect(page.locator('[data-weapon="axe"] [data-action="craft"]')).toBeDisabled();
  await expect(page.locator('[data-weapon="crossbow"] [data-action="craft"]')).toBeEnabled();
  await page.locator('[data-weapon="crossbow"] [data-action="mastery"]').click();
  await expect(page.locator('[data-mastery-xp]')).toHaveText("80 XP");
  await expect(page.locator('[data-mastery="edge"] button')).toBeDisabled();
  await page.locator('[data-mastery="grip"] button').click();
  await expect(page.locator('[data-mastery="edge"] button')).toBeEnabled();
  await page.locator('[data-mastery="edge"] button').click();
  await expect(page.locator('[data-mastery="rhythm"] button')).toBeDisabled();
  expect((await saved(page)).weaponXP.crossbow).toBe(80);
  expect((await saved(page)).weaponMastery.crossbow).toEqual(["grip", "edge"]);
  expect((await saved(page)).weaponMastery.axe).toEqual([]);
  await page.screenshot({ path: "test-results/arvore-arma.png" });
  await page.reload(); await page.locator('[data-action="hub"]').click(); await openNpc(page, "orren");
  await page.locator('[data-weapon="crossbow"] [data-action="mastery"]').click();
  await expect(page.locator('[data-mastery="grip"]')).toHaveClass(/learned/);
});
test("guardas existem desde a entrada e reforços mostram portal antes de chegar", async ({ page }) => {
  await boot(page); await page.evaluate(() => (window as any).vesperaTest.scenario(0));
  const initial = await full(page); expect(initial.enemies.length).toBeGreaterThanOrEqual(11);
  expect(initial.enemies.some((e: any) => Math.hypot(e.pos.x - initial.playerPosition.x, e.pos.y - initial.playerPosition.y) > 700)).toBe(true);
  await page.evaluate(() => (window as any).vesperaTest.positionRelay(2));
  await page.waitForTimeout(150);
  expect((await full(page)).enemies).toHaveLength(initial.enemies.length);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.clearEncounter(); t.queueReinforcement(); });
  const arriving = await full(page); expect(arriving.arrivals).toHaveLength(1);
  expect(arriving.enemies.filter((e: any) => !e.dead)).toHaveLength(0);
  expect((await saved(page)).run.visited).not.toContain(0);
  await page.waitForTimeout(700);
  expect((await full(page)).enemies.filter((e: any) => !e.dead)).toHaveLength(0);
  await page.screenshot({ path: "test-results/entrada-reforcos.png" });
  await expect.poll(async () => (await full(page)).arrivals.length).toBe(0);
  expect((await full(page)).enemies.filter((e: any) => !e.dead)).toHaveLength(1);
});
test("biomas têm percursos próprios, perigos funcionais e mapa correspondente", async ({ page }) => {
  await boot(page);
  const kinds: string[] = [];
  for (let b = 0; b < 4; b++) {
    await page.evaluate(b => { const t = (window as any).vesperaTest; t.scenario(b * 9); t.clearEncounter(false); }, b);
    const before = await full(page); kinds.push(before.stage.challenge.kind);
    await page.evaluate(() => { const t = (window as any).vesperaTest; t.positionHazard(); t.step(.15); });
    expect((await full(page)).playerHP).toBeLessThan(before.playerHP);
    if (b === 2) expect((await full(page)).needs.cold).toBeGreaterThan(0);
    await page.keyboard.press("Tab");
    await expect(page.locator(".map-hazard")).toHaveCount(4);
    await expect(page.locator(".map-direction")).toContainText(before.stage.challenge.name);
    await page.screenshot({ path: `test-results/level-design-${b}.png` });
    await page.keyboard.press("Escape");
  }
  expect(new Set(kinds).size).toBe(4);
});
test("as dez armas novas carregam sprites próprios e seus ataques causam dano", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await boot(page, true);
  for (const id of WEAPON_IDS.filter(id => !["blade", "hammer", "bow"].includes(id))) {
    await page.evaluate(id => (window as any).vesperaTest.loadWeapon(id), id);
    await page.evaluate(id => { const t = (window as any).vesperaTest; t.scenario(0, id); t.prepareCombat(100000); }, id);
    const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
    await page.mouse.click(aim.x, aim.y);
    await expect.poll(async () => (await full(page)).targets[0].hp).toBeLessThan(100000);
    expect((await full(page)).playerTexture).toBe(`eira-${id}`);
    expect((await full(page)).comboHistory).toContain("attack1");
  }
  expect(errors).toEqual([]);
});
test("flores limpam raízes, marcos fecham válvulas e a maré reduz a velocidade", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(0); t.clearEncounter(false); t.positionProp("flower"); });
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimProp("flower"));
  await page.mouse.click(aim.x, aim.y);
  await expect.poll(async () => (await full(page)).phaseLoot.claimed.includes("hazard:0")).toBe(true);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.positionHazard(); t.step(.1); });
  expect((await full(page)).terrainSpeed).toBe(1);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(9); t.clearEncounter(false); t.positionRelay(0); });
  await page.keyboard.down("e"); await page.evaluate(() => (window as any).vesperaTest.step(1.6)); await page.keyboard.up("e");
  const before = (await full(page)).playerHP;
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.positionHazard(); t.step(.1); });
  expect((await full(page)).playerHP).toBe(before);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(18); t.clearEncounter(false); t.positionHazard(); t.step(.1); });
  expect((await full(page)).terrainSpeed).toBe(.55);
});
