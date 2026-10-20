import { test, expect, type Page } from "@playwright/test";
type Snapshot = {
  pos: { x: number; y: number };
  room: number;
  hp: number;
  alive: number;
  cleared: boolean;
  objective: string;
  attacking: boolean;
};
async function snap(page: Page): Promise<Snapshot> {
  return page.evaluate(() => (window as any).vesperaTest.snapshot());
}
test("carrega arte, navega pelo Farol, combate, recompensa e próxima câmara", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/?test=1");
  await expect(
    page.getByRole("button", { name: /Entrar no Farol/ }),
  ).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: "test-results/menu.png" });
  await page.getByRole("button", { name: /Entrar no Farol/ }).click();
  await expect(page.getByText("Farol dos Ecos", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/farol.png" });
  await page.getByRole("button", { name: /Oficina de Orren/ }).click();
  await expect(
    page.getByRole("heading", { name: "Metal que ainda se lembra" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "×" }).click();
  await page.getByRole("button", { name: /Iniciar expedição/ }).click();
  await page.locator("#seed-input").fill("E2E-AURORA");
  await page.getByRole("button", { name: "Atravessar o portal →" }).click();
  await expect.poll(async () => (await snap(page)).room).toBe(0);
  const before = await snap(page);
  await page.keyboard.down("d");
  await expect
    .poll(
      async () => {
        const p = (await snap(page)).pos;
        return Math.hypot(p.x - before.pos.x, p.y - before.pos.y);
      },
      { timeout: 15000 },
    )
    .toBeGreaterThan(25);
  await page.keyboard.up("d");
  await page.evaluate(() => (window as any).vesperaTest.prepareCombat());
  await page.waitForTimeout(120);
  await page.mouse.click(850, 420);
  await expect.poll(async () => (await snap(page)).alive).toBe(0);
  await expect.poll(async () => (await snap(page)).cleared).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Uma promessa atravessa o tempo" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/juramentos.png" });
  await page.locator('[data-action="boon"]').first().click();
  await page.evaluate(() => (window as any).vesperaTest.portal());
  await page.waitForTimeout(200);
  await page.screenshot({ path: "test-results/jardins.png" });
  await page.keyboard.press("e");
  await expect.poll(async () => (await snap(page)).room).toBe(1);
  await expect(page.locator(".objective-panel h4")).toBeVisible();
  await page.screenshot({ path: "test-results/objetivo.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Entre dois instantes" }),
  ).toBeVisible();
  const paused = await snap(page);
  await page.waitForTimeout(200);
  expect((await snap(page)).pos).toEqual(paused.pos);
  await page.getByRole("button", { name: "Retomar a jornada →" }).click();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("heading", { name: "Jardins da Hora Quebrada", level: 2 }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/mapa.png" });
  expect(errors).toEqual([]);
});
test("save continua a expedição após recarregar e configurações persistem", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.getByRole("button", { name: /Entrar no Farol/ }).waitFor();
  await page.evaluate(() => (window as any).vesperaTest.start("SAVE-TEST"));
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: /Continuar expedição/ }).click();
  await expect.poll(async () => (await snap(page)).room).toBe(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.locator('[data-action="quality"][data-value="low"]').click();
  await expect(page.locator('[data-value="low"]')).toHaveClass(/selected/);
  await page.getByRole("button", { name: "Salvar e voltar" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Configurações/ }).click();
  await expect(page.locator('[data-value="low"]')).toHaveClass(/selected/);
});
test("quatro chefes mudam de fase, liberam memórias e permitem os dois finais", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?test=1");
  await page.getByRole("button", { name: /Entrar no Farol/ }).waitFor();
  for (const [biome, room] of [6, 15, 24, 33].entries()) {
    await page.evaluate(
      (room) => (window as any).vesperaTest.scenario(room),
      room,
    );
    await expect(page.locator(".boss-bar")).toBeVisible();
    await page.evaluate(() => (window as any).vesperaTest.bossPhase(0.55));
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).vesperaTest.snapshotFull().phase),
      )
      .toBe(2);
    await page.evaluate(() => (window as any).vesperaTest.bossPhase(0.2));
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).vesperaTest.snapshotFull().phase),
      )
      .toBe(3);
    await page.screenshot({ path: `test-results/chefe-${biome}.png` });
    await page.evaluate(() => (window as any).vesperaTest.ultimate());
    await page.keyboard.press("q");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).vesperaTest
            .snapshotFull()
            .bosses.includes(
              Number(((window as any).vesperaTest.snapshot().room / 9) | 0),
            ),
        ),
      )
      .toBe(true);
    if (biome < 3) {
      await page
        .getByRole("heading", { name: "Uma promessa atravessa o tempo" })
        .waitFor();
      await page.locator('[data-action="boon"]').first().click();
    }
  }
  await page
    .getByRole("button", { name: /Devolver o movimento ao mundo/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Um sol que não exige esquecimento" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/final-aurora.png" });
  await page.getByRole("button", { name: "Voltar ao Farol →" }).click();
  await page.evaluate(() => (window as any).vesperaTest.scenario(33));
  await page.evaluate(() => (window as any).vesperaTest.ultimate());
  await page.keyboard.press("q");
  await page
    .getByRole("button", { name: /Guardar o último crepúsculo/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "A beleza de um instante eterno" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as any).vesperaTest.snapshotFull().endings,
    ),
  ).toEqual(["restore", "preserve"]);
  expect(errors).toEqual([]);
});
test("objetivos interativos, equipamentos e fallback gráfico permanecem jogáveis", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?test=1&renderer=canvas");
  await page.getByRole("button", { name: /Entrar no Farol/ }).waitFor();
  await page.evaluate(() => {
    (window as any).vesperaTest.scenario(1);
    (window as any).vesperaTest.objective("purify");
    (window as any).vesperaTest.clearEncounter();
  });
  for (let i = 0; i < 3; i++) {
    await page.evaluate(
      (i) => (window as any).vesperaTest.positionObjective(i),
      i,
    );
    await page.keyboard.down("e");
    await page.evaluate(() => (window as any).vesperaTest.step(2.2));
    await page.keyboard.up("e");
  }
  await expect.poll(async () => (await snap(page)).cleared).toBe(true);
  await page.locator('[data-action="boon"]').first().click();
  for (const weapon of ["hammer", "bow"]) {
    await page.evaluate((weapon) => {
      (window as any).vesperaTest.scenario(0, weapon);
      (window as any).vesperaTest.prepareCombat();
    }, weapon);
    const p = await page.evaluate(() => (window as any).vesperaTest.aimPoint());
    await page.mouse.click(p.x, p.y);
    await expect
      .poll(async () => (await snap(page)).alive, { timeout: 10000 })
      .toBe(0);
    await page.locator('[data-action="boon"]').first().click();
  }
  expect(errors).toEqual([]);
});
test("morte preserva Ecos e ressurreição permite outra expedição", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?test=1");
  await page.getByRole("button", { name: /Entrar no Farol/ }).waitFor();
  await page.evaluate(() => {
    (window as any).vesperaTest.start("DEATH-TEST");
    (window as any).vesperaTest.lethal();
  });
  await expect
    .poll(
      () => page.evaluate(() => (window as any).vesperaTest.snapshotFull()),
      { timeout: 15000 },
    )
    .toMatchObject({ screen: "death" });
  await expect(
    page.getByRole("heading", { name: "O Farol se lembra de você" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ressurgir no Farol →" }).click();
  await expect(page.getByText("Farol dos Ecos", { exact: true })).toBeVisible();
  expect((await snap(page)).hp).toBe(120);
  await page.getByRole("button", { name: /Iniciar expedição/ }).click();
  await page.getByRole("button", { name: "Atravessar o portal →" }).click();
  await expect.poll(async () => (await snap(page)).room).toBe(0);
  expect(errors).toEqual([]);
});
