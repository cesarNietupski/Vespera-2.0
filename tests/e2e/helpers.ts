import { expect, type Page } from "@playwright/test";
export async function openNpc(page: Page, id: string) {
  await page.evaluate((id) => (window as any).vesperaTest.nearNpc(id), id);
  await page.keyboard.press("e");
  await page.locator(`[data-action="npcService"][data-value="${id}"]`).click();
}
export async function openExpedition(page: Page) {
  await page.evaluate(() => (window as any).vesperaTest.portal());
  await page.keyboard.press("e");
  await expect(page.locator("#seed-input")).toBeVisible();
}
