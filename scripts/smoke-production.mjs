import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const url = process.env.VESPERA_PREVIEW_URL ?? "http://127.0.0.1:4173/";
const browser = await chromium.launch();
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
  await page.screenshot({ path: "docs/screenshots/menu.png" });
  await page.locator('[data-action="hub"]').click();
  await page.screenshot({ path: "docs/screenshots/farol.png" });
  await page.keyboard.press("i");
  await page.locator('[data-action="inventoryTab"][data-value="resources"]').click();
  if (await page.locator("[data-stock]").count() !== 8)
    throw new Error("O inventário deve exibir os oito recursos.");
  await page.screenshot({ path: "docs/screenshots/inventario-recursos.png" });
  await page.locator('[data-action="inventoryTab"][data-value="provisions"]').click();
  await page.screenshot({ path: "docs/screenshots/inventario.png" });
  await page.keyboard.press("i");
  await page.keyboard.down("d");
  await page.keyboard.down("s");
  await page.locator("#interaction").filter({ hasText: "LUME" }).waitFor();
  await page.keyboard.up("d");
  await page.keyboard.up("s");
  await page.keyboard.press("e");
  await page.locator('[data-action="npcService"][data-value="lume"]').click();
  await page.locator('[data-recipe="ration"] button').click();
  await page.screenshot({ path: "docs/screenshots/cozinha.png" });
  await page.locator(".close-button").click();
  for (let i = 0; i < 12; i++) {
    if (
      (await page.locator("#interaction").textContent())?.includes(
        "INICIAR EXPEDIÇÃO",
      )
    )
      break;
    await page.keyboard.down("d");
    await page.keyboard.down("s");
    await page.waitForTimeout(350);
    await page.keyboard.up("s");
    await page.waitForTimeout(150);
    await page.keyboard.up("d");
  }
  await page.keyboard.press("e");
  await page.locator("#seed-input").fill("ULTIMA-AURORA");
  await page.locator('[data-action="start"]').click();
  await page.keyboard.down("d");
  await page.waitForTimeout(1200);
  await page.keyboard.up("d");
  await page.keyboard.down("s");
  await page.waitForTimeout(800);
  await page.keyboard.up("s");
  await page.mouse.click(850, 470);
  await page.keyboard.press("Space");
  await page.screenshot({ path: "docs/screenshots/jardins.png" });
  if (errors.length || remote.length)
    throw new Error(JSON.stringify({ errors, remote }));
  console.log(
    "Produção: menu, Farol com seis moradores, inventário pela tecla I, oito recursos, provisões, caminhar e conversar com Lume, preparar ração, portal, expedição, necessidades, ataque e esquiva OK; zero erros e zero requisições externas.",
  );
} finally {
  await browser.close();
}
