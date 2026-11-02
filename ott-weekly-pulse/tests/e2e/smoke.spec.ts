import { test, expect } from "@playwright/test";

test.describe("API", () => {
  test("weeks endpoint lists a current week", async ({ request }) => {
    const res = await request.get("/api/weeks");
    expect(res.ok()).toBeTruthy();
    const { weeks } = await res.json();
    expect(weeks.some((w: { isCurrent: boolean }) => w.isCurrent)).toBe(true);
  });

  test("titles endpoint returns well-formed titles", async ({ request }) => {
    const res = await request.get("/api/titles");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.titles)).toBe(true);
    for (const t of data.titles.slice(0, 5)) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.title).toBe("string");
      expect(Array.isArray(t.platforms)).toBe(true);
    }
  });

  test("calendar export is a valid .ics", async ({ request }) => {
    const res = await request.get("/api/calendar");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("text/calendar");
    const body = await res.text();
    expect(body.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(body.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  test("share card renders a PNG", async ({ request }) => {
    const res = await request.get("/api/share-card");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("sync API refuses cleanly when KV is not configured or the code is bad", async ({ request }) => {
    const res = await request.get("/api/sync?code=ZZZZZZZZ");
    expect([404, 503]).toContain(res.status());
  });
});

test.describe("Pages", () => {
  test("home page shows titles and the week selector", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).or(page.getByRole("heading", { level: 2 }).first())).toBeVisible();
    await expect(page.locator('[role="group"][aria-label]').first()).toBeVisible(); // a TitleCard
    expect(errors).toEqual([]);
  });

  test("week page renders and unknown weeks 404", async ({ page, request }) => {
    const { weeks } = await (await request.get("/api/weeks")).json();
    const current = weeks.find((w: { isCurrent: boolean }) => w.isCurrent);
    await page.goto(`/week/${current.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("New on OTT");
    const missing = await request.get("/week/not-a-week");
    expect(missing.status()).toBe(404);
  });

  test("diary and profile pages load", async ({ page }) => {
    for (const path of ["/diary", "/profile", "/top-10"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    }
  });

  test("command palette opens with Ctrl+K and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("theme preference persists across reloads", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("owp-theme", "light"));
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
