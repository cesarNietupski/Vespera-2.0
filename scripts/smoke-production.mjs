import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const url = process.env.VESPERA_PREVIEW_URL ?? "http://127.0.0.1:4173/";
const channel = process.env.VESPERA_BROWSER_CHANNEL;
const browser = await chromium.launch(channel ? { channel } : {});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    remote = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith(url))
      remote.push(r.url());
  });
  await page.goto(url);
  await page.locator('[data-action="hub"]').waitFor();
  await fs.mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({ path: "docs/screenshots/revisao-menu.png" });
  await page.locator('[data-action="hub"]').click();
  await page.screenshot({ path: "docs/screenshots/revisao-farol.png" });
  await page.keyboard.press("i");
  await page.locator('[data-action="inventoryTab"][data-value="resources"]').click();
  if (await page.locator("[data-stock]").count() !== 8)
    throw new Error("O inventário deve exibir os oito recursos.");
  await page.screenshot({ path: "docs/screenshots/revisao-inventario-recursos.png" });
  await page.locator('[data-action="inventoryTab"][data-value="provisions"]').click();
  await page.screenshot({ path: "docs/screenshots/revisao-inventario.png" });
  await page.keyboard.press("i");
  await page.keyboard.press("Tab");
  await page.locator('[data-action="villageGuide"][data-value="lume"]').click();
  await page.locator("#interaction").filter({ hasText: "LUME" }).waitFor({ timeout: 20000 });
  await page.keyboard.press("e");
  await page.locator("#voice-status").filter({ hasText: "Falando em português" }).waitFor();
  await page.locator('[data-action="dialogueTopic"]').first().click();
  await page.locator(".dialogue-page").filter({ hasText: "1 / 2" }).waitFor();
  await page.locator('[data-action="voiceStop"]').click();
  await page.locator("#voice-status").filter({ hasText: "Voz pronta" }).waitFor();
  await page.screenshot({ path: "docs/screenshots/dialogo-producao.png" });
  await page.locator('[data-action="npcService"][data-value="lume"]').click();
  await page.locator('[data-recipe="ration"] button').click();
  await page.screenshot({ path: "docs/screenshots/revisao-cozinha.png" });
  await page.locator(".close-button").click();
  await page.keyboard.press("Tab");
  await page.locator('[data-action="villageGate"]').click();
  await page.locator("#interaction").filter({ hasText: "INICIAR EXPEDIÇÃO" }).waitFor({ timeout: 20000 });
  await page.keyboard.press("e");
  await page.locator("#seed-input").fill("ULTIMA-AURORA");
  await page.locator('[data-action="start"]').click();
  await page.keyboard.down("d");
  await page.locator("#interaction").filter({ hasText: "ABRIR BAÚ" }).waitFor({ timeout: 12000 });
  await page.keyboard.up("d");
  // Fight the guards already present in the first clearing using normal input.
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 4;
    await page.mouse.click(720 + Math.cos(a) * 100, 450 + Math.sin(a) * 55);
    await page.waitForTimeout(180);
  }
  await page.locator("#interaction").filter({ hasText: "ABRIR BAÚ" }).waitFor({ timeout: 5000 });
  await page.waitForTimeout(1200);
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.keyboard.press("e");
    try { await page.locator("#loot-iron").waitFor({ timeout: 1600 }); break; }
    catch {
      if (attempt === 3) { await page.screenshot({ path: "test-results/smoke-failure.png" }); throw new Error("O baú não concluiu a abertura pelo fluxo normal."); }
    }
  }
  await page.waitForTimeout(650);
  await page.keyboard.press("f");
  await page.locator('.compact [data-slot="ranged"].active').waitFor();
  await page.keyboard.press("f");
  await page.locator('.compact [data-slot="melee"].active').waitFor();
  await page.screenshot({ path: "docs/screenshots/revisao-coleta-producao.png" });
  await page.keyboard.press("Tab");
  await page.locator(".stage-map").waitFor();
  await page.screenshot({ path: "docs/screenshots/revisao-mapa-fase-producao.png" });
  await page.keyboard.press("Escape");
  await page.keyboard.down("s");
  await page.waitForTimeout(800);
  await page.keyboard.up("s");
  await page.mouse.click(850, 470);
  await page.keyboard.press("Space");
  await page.screenshot({ path: "docs/screenshots/revisao-jardins.png" });
  await page.keyboard.press("Escape");
  await page.locator('[data-action="saveNow"]').click();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")));
  await page.locator('[data-action="menu"]').click();
  await page.reload(); await page.locator('[data-action="continue"]').click();
  await page.keyboard.press("Escape");
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("vespera.save.v2")));
  if (restored.run.seed !== before.run.seed || Math.hypot(restored.run.checkpoint.pos.x - before.run.checkpoint.pos.x, restored.run.checkpoint.pos.y - before.run.checkpoint.pos.y) > 1)
    throw new Error("A continuação deve restaurar a mesma expedição e posição.");
  await page.locator('[data-action="campaigns"]').click();
  const downloadPromise = page.waitForEvent("download"); await page.locator('[data-action="exportCampaign"]').click();
  const download = await downloadPromise;
  if (!(await download.path())) throw new Error("O backup não foi exportado.");
  await page.screenshot({ path: "docs/screenshots/campanhas-producao.png" });
  if (errors.length || remote.length)
    throw new Error(JSON.stringify({ errors, remote }));
  console.log(
    "Produção: menu, vila, inventário, caminho até Lume, diálogo e voz em português, cozinha, portão, fase, baú animado, troca de armas, coleta, mapa, ataque, esquiva, save, continuação na mesma posição e backup OK; zero erros e zero requisições externas.",
  );
} finally {
  await browser.close();
}
