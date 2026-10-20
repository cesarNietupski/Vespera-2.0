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
  await page.locator('[data-action="talents"]').click();
  await page.locator('[data-skill="vitality"]').waitFor();
  await page.locator(".panel").evaluate((el) => (el.scrollTop = 350));
  await page.screenshot({ path: "docs/screenshots/skilltree.png" });
  await page.locator(".close-button").click();
  await page.locator('[data-action="armory"]').click();
  await page.locator(".forge-cards").waitFor();
  await page.screenshot({ path: "docs/screenshots/forja.png" });
  await page.locator(".close-button").click();
  await page.locator('[data-action="expedition"]').click();
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
    "Produção: menu, Farol, árvore de habilidades, forja, assets, expedição, movimento, ataque e esquiva OK; zero erros e zero requisições externas.",
  );
} finally {
  await browser.close();
}
