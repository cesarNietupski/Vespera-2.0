import { expect, test, type Page } from "@playwright/test";
const full = (p: Page) => p.evaluate(() => (window as any).vesperaTest.snapshotFull());
const saved = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")!));
async function boot(page: Page) { await page.goto("/?test=1"); await page.locator('[data-action="hub"]').click(); }

test("checkpoint retoma posição, vida e inimigo ferido sem recriar o encontro", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(0); t.prepareCombat(100); });
  const aim = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
  await page.mouse.click(aim.x, aim.y);
  await expect.poll(async () => (await full(page)).targets[0].hp).toBeLessThan(100);
  await page.keyboard.press("Escape");
  await page.locator('[data-action="saveNow"]').click();
  const before = await saved(page);
  expect(before.run.checkpoint.enemies).toHaveLength(1);
  expect(before.run.checkpoint.enemies[0].hp).toBeGreaterThan(0);
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="settingsBack"]').click();
  expect((await full(page)).screen).toBe("pause");
  await page.locator('[data-action="menu"]').click();
  await page.reload(); await page.locator('[data-action="continue"]').waitFor();
  await page.locator('[data-action="campaigns"]').click();
  await page.locator('[data-action="exportCampaign"]').click();
  expect((await saved(page)).location.area).toBe("expedition");
  await page.reload(); await page.locator('[data-action="continue"]').click();
  await page.keyboard.press("Escape");
  const after = await full(page);
  expect(after.playerPosition).toEqual(before.run.checkpoint.pos);
  expect(after.playerHP).toBe(before.run.hp);
  expect(after.targets).toHaveLength(1);
  expect(after.targets[0].hp).toBe(before.run.checkpoint.enemies[0].hp);
  expect(after.objectiveProgress).toBe(before.run.checkpoint.objective.progress);
  await page.screenshot({ path: "test-results/checkpoint-retomado.png" });
});

test("campanhas independentes, nomes escapados, backup e importação em espaço separado", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as any).vesperaTest.start("CAMPANHA-ORIGINAL"));
  await page.keyboard.press("Escape"); await page.locator('[data-action="campaigns"]').click();
  const originalId = (await full(page)).campaign.id;
  const downloadPromise = page.waitForEvent("download"); await page.locator('[data-action="exportCampaign"]').click();
  const download = await downloadPromise, backupPath = await download.path(); expect(backupPath).toBeTruthy();
  await page.locator('[data-action="campaignNew"]').click();
  await page.locator("#campaign-name").fill("Aurora <nova>"); await page.locator('[data-action="createCampaign"]').click();
  expect((await full(page)).campaign.name).toBe("Aurora <nova>"); expect((await saved(page)).run).toBeNull();
  await page.keyboard.press("Escape"); await page.locator('[data-action="campaigns"]').click();
  await expect(page.locator(".campaign-card")).toHaveCount(2);
  await expect(page.locator(".campaign-card h3").filter({ hasText: "Aurora <nova>" })).toBeVisible();
  expect(await page.locator(".campaign-card h3 nova").count()).toBe(0);
  await page.screenshot({ path: "test-results/campanhas-salvas.png" });
  await page.locator(`[data-action="loadCampaign"][data-value="${originalId}"]`).click();
  await expect.poll(async () => (await full(page)).campaign.id).toBe(originalId);
  expect((await saved(page)).run.seed).toBe("CAMPANHA-ORIGINAL");
  await page.keyboard.press("Escape"); await page.locator('[data-action="campaigns"]').click();
  await page.locator('[data-campaign-import]').setInputFiles(backupPath!);
  await expect.poll(async () => (await full(page)).campaign.count).toBe(3);
  expect((await full(page)).campaign.id).not.toBe(originalId);
  await page.reload(); await page.locator('[data-action="campaigns"]').click();
  await expect(page.locator(".campaign-card")).toHaveCount(3);
});

test("recompensa pendente sobrevive ao reload e F1 não permite ignorá-la", async ({ page }) => {
  await boot(page); await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(0); t.finishRoom(); });
  await expect(page.locator('[data-action="boon"]').first()).toBeVisible();
  await page.keyboard.press("F1"); expect((await full(page)).screen).toBe("rewards");
  await page.reload(); await page.locator('[data-action="continue"]').click();
  await expect(page.locator('[data-action="boon"]').first()).toBeVisible();
  expect((await saved(page)).run.checkpoint.rewardPending).toBe(true);
  await page.locator('[data-action="boon"]').first().click();
  await page.reload(); await page.locator('[data-action="continue"]').click();
  expect((await full(page)).screen).toBe("play");
  expect((await saved(page)).run.boons).toHaveLength(1);
});

test("morte seguida de pagehide mantém expedição encerrada", async ({ page }) => {
  await boot(page); await page.evaluate(() => { const t = (window as any).vesperaTest; t.start("MORTE-CHECKPOINT"); t.lethal(); });
  await expect.poll(async () => (await full(page)).screen).toBe("death");
  await page.reload();
  await expect(page.locator('[data-action="hub"]')).toBeVisible();
  expect((await saved(page)).run).toBeNull(); expect((await saved(page)).deaths).toBe(1);
  await page.locator('[data-action="continue"]').click();
  expect((await full(page)).village).not.toBeNull();
});

test("sair durante a animação de morte grava a perda antes de fechar a página", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.start("MORTE-IMEDIATA"); t.lethal(); window.dispatchEvent(new Event("pagehide")); });
  expect((await saved(page)).run).toBeNull(); expect((await saved(page)).deaths).toBe(1);
  await page.reload(); await expect(page.locator('[data-action="hub"]')).toBeVisible();
  expect((await saved(page)).run).toBeNull();
});

test("ambiente cobre todas as câmaras e acompanha câmera no início e no portão", async ({ page }) => {
  test.setTimeout(120000); await boot(page);
  const check = (s: any) => {
    const e = s.environment; expect(e.props).toBeGreaterThan(0); expect(e.cachedGrounds).toBeLessThanOrEqual(5);
    expect(e.ground.x).toBeLessThanOrEqual(e.viewport.start.x); expect(e.ground.y).toBeLessThanOrEqual(e.viewport.start.y);
    expect(e.ground.x + e.ground.width).toBeGreaterThanOrEqual(e.viewport.end.x);
    expect(e.ground.y + e.ground.height).toBeGreaterThanOrEqual(e.viewport.end.y);
  };
  check(await full(page));
  for (let i = 0; i < 36; i++) {
    await page.evaluate(i => (window as any).vesperaTest.scenario(i), i); await page.waitForTimeout(70); check(await full(page));
    await page.evaluate(() => (window as any).vesperaTest.portal()); await page.waitForTimeout(70); check(await full(page));
  }
  await page.goto("/?test=1&renderer=canvas"); await page.locator('[data-action="hub"]').click(); check(await full(page));
});

test("HUD em resoluções diferentes mantém objetivo, sobrevivência e armas separados", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(1); t.clearEncounter(false); });
  for (const [width, height] of [[1440, 900], [1280, 720], [800, 600]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(250);
    const boxes = await page.evaluate(() => Object.fromEntries([".stage-context", ".survival-hud", ".weapon-loadout.compact"].map(sel => {
      const r = document.querySelector(sel)!.getBoundingClientRect(); return [sel, { x: r.x, y: r.y, right: r.right, bottom: r.bottom }];
    })));
    const context = boxes[".stage-context"], needs = boxes[".survival-hud"]; expect(context.bottom).toBeLessThan(needs.y);
    const weapons = boxes[".weapon-loadout.compact"]; expect(weapons.bottom).toBeLessThanOrEqual(height); expect(weapons.y).toBeGreaterThan(height / 2);
    await page.screenshot({ path: `test-results/hud-polido-${width}.png` });
  }
});

test("seis moradores têm diálogos em português, temas próprios e voz incluída controlável", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message)); await boot(page);
  const profiles: string[] = [];
  for (const npc of ["salvia", "orren", "nim", "lume", "caio", "iria"]) {
    await page.evaluate(id => (window as any).vesperaTest.nearNpc(id), npc); await page.keyboard.press("e");
    await expect(page.locator(`[data-speaker="${npc}"]`)).toBeVisible();
    await expect.poll(async () => (await full(page)).voice.status).toBe("speaking");
    const voice = (await full(page)).voice.request;
    expect(voice.source).toBe("audio"); expect(voice.lang).toBe("pt-BR"); expect(voice.npc).toBe(npc); profiles.push(`${voice.pitch}/${voice.rate}`);
    await expect(page.locator('[data-action="dialogueTopic"]')).toHaveCount(2);
    await page.locator('[data-action="voiceStop"]').click(); expect((await full(page)).voice.status).toBe("ready");
    await page.locator('[data-action="dialogueTopic"]').first().click();
    await expect.poll(async () => (await full(page)).voice.status).toBe("speaking");
    await page.locator('[data-action="dialogueNext"]').click();
    await expect(page.locator(".dialogue-page")).toContainText("2 / 2");
    if (npc === "orren") await page.screenshot({ path: "test-results/dialogo-voz-orren.png" });
    await page.locator('[data-action="voiceReplay"]').click();
    await page.keyboard.press("Escape"); expect((await full(page)).voice.status).toBe("ready");
  }
  expect(new Set(profiles).size).toBe(6); expect(errors).toEqual([]);
  await page.keyboard.press("Escape"); await page.locator('[data-action="settings"]').click();
  await page.locator('[data-voice-auto]').uncheck(); await page.locator('[data-action="settingsBack"]').click(); await page.keyboard.press("Escape");
  await page.evaluate(() => (window as any).vesperaTest.nearNpc("salvia")); await page.keyboard.press("e");
  await expect(page.locator('[data-speaker="salvia"]')).toBeVisible();
  await expect.poll(async () => (await full(page)).voice.status).toBe("muted");
  await page.locator('[data-action="voiceReplay"]').click(); await expect.poll(async () => (await full(page)).voice.status).toBe("speaking");
});

test("HUD mantém textos estáveis enquanto o tempo e as barras são atualizados", async ({ page }) => {
  await boot(page); await page.evaluate(() => { const t = (window as any).vesperaTest; t.scenario(0); t.objective("purify"); t.clearEncounter(false); });
  await expect(page.locator("#objective-title")).toHaveText("Purifique os obeliscos");
  const title = await page.locator("#objective-title").elementHandle();
  const before = await page.locator("#objective-time").textContent();
  await expect.poll(() => page.locator("#objective-time").textContent()).not.toBe(before);
  expect(await title!.evaluate(el => el.isConnected && el === document.getElementById("objective-title"))).toBe(true);
  await page.screenshot({ path: "test-results/hud-objetivo-estavel.png" });
});

test("menu de campanhas cabe acima do rodapé e mantém os botões acessíveis", async ({ page }) => {
  await boot(page); await page.keyboard.press("Escape"); await page.locator('[data-action="menu"]').click();
  for (const [width, height] of [[1440, 900], [1280, 720], [800, 600]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(150);
    const boxes = await page.evaluate(() => {
      const p = document.querySelector(".menu-panel")!.getBoundingClientRect(), f = document.querySelector(".menu-footer")!.getBoundingClientRect();
      return { top:p.top, bottom:p.bottom, footer:f.top, height:innerHeight };
    });
    expect(boxes.bottom).toBeLessThan(boxes.footer); expect(boxes.top).toBeGreaterThan(0);
    await expect(page.locator('[data-action="continue"]')).toBeVisible();
    await expect(page.locator('[data-action="campaigns"]')).toBeVisible();
    await page.screenshot({ path: `test-results/menu-polido-${width}.png` });
  }
});
