import { openNpc } from "./helpers";
import { test, expect } from "@playwright/test";
test("identidade medieval, fonte legível e seis ataques encadeados com M1 em cada arma", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').waitFor();
  await expect(page.locator(".menu-title h1 img")).toHaveAttribute(
    "src",
    "assets/logo.png",
  );
  const typography = await page
    .locator('[data-action="hub"] strong')
    .evaluate((el) => ({
      size: parseFloat(getComputedStyle(el).fontSize),
      font: getComputedStyle(el).fontFamily,
    }));
  expect(typography.size).toBeGreaterThanOrEqual(17);
  expect(typography.font).toContain("Segoe UI");
  await page.screenshot({ path: "test-results/menu-32bits.png" });
  for (const weapon of ["blade", "hammer", "bow"]) {
    await page.evaluate((weapon) => {
      (window as any).vesperaTest.scenario(0, weapon);
      (window as any).vesperaTest.prepareCombat(100000);
    }, weapon);
    for (let i = 1; i <= 6; i++) {
      const p = await page.evaluate(() =>
        (window as any).vesperaTest.aimPoint(),
      );
      await page.mouse.click(p.x, p.y);
      // Observe each rendered frame: an attack can finish between RPC polling intervals.
      await page.waitForFunction(
        (i) => {
          const s = (window as any).vesperaTest.snapshotFull();
          return (
            s.comboHistory.length === i && s.playerAnimation === `attack${i}`
          );
        },
        i,
        { polling: "raf", timeout: 12000 },
      );
    }
    const full = await page.evaluate(() =>
      (window as any).vesperaTest.snapshotFull(),
    );
    expect(full.comboHistory).toEqual([
      "attack1",
      "attack2",
      "attack3",
      "attack4",
      "attack5",
      "attack6",
    ]);
    await page.screenshot({ path: `test-results/combo-${weapon}.png` });
  }
  expect(errors).toEqual([]);
});
test("interface em pergaminho mantém objetivos e diálogos legíveis", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').waitFor();
  await page.locator('[data-action="hub"]').click();
  await openNpc(page, "orren");
  await expect(
    page.getByRole("heading", { name: "Metal que ainda se lembra" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".modal-backdrop")
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe("1");
  const font = await page
    .locator(".card p")
    .first()
    .evaluate((el) => ({
      size: parseFloat(getComputedStyle(el).fontSize),
      color: getComputedStyle(el).color,
    }));
  expect(font.size).toBeGreaterThanOrEqual(16);
  await page.screenshot({ path: "test-results/oficina-32bits.png" });
});

test("personagens proporcionais e pilares revelam o ator somente quando passa por trás", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.locator('[data-action="hub"]').click();
  const presentation = () =>
    page.evaluate(
      () => (window as any).vesperaTest.snapshotFull().presentation,
    );
  const p = await presentation();
  expect(p.playerHeight).toBeGreaterThan(65);
  expect(p.playerHeight).toBeLessThan(90);
  expect(p.shadowWidth).toBeLessThan(30);
  const index = await page.evaluate(() =>
    (window as any).vesperaTest.occlusionProbe(true),
  );
  expect(index).toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const p = await presentation();
      return p.occluders[index].depth > p.playerDepth
        ? p.occluders[index].alpha
        : 1;
    })
    .toBeLessThan(0.3);
  await page.screenshot({ path: "test-results/sobreposicao-atras.png" });
  await page.evaluate(() => (window as any).vesperaTest.occlusionProbe(false));
  await expect
    .poll(async () => {
      const p = await presentation();
      return p.occluders[index].depth < p.playerDepth
        ? p.occluders[index].alpha
        : 0;
    })
    .toBeGreaterThan(0.9);
  await page.screenshot({ path: "test-results/proporcoes-farol.png" });
});
