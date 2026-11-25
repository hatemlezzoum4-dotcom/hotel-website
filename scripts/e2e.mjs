/**
 * End-to-end check of the public site and the admin area, in a real browser (Playwright/Chromium).
 *
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:e2e
 *
 * ⚠ It creates booking requests / messages and edits content. Run it against a COPY of the data
 *   (start the server with DATA_DIR pointing to a throw-away folder), never against production.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const results = [];
const ok = (name) => (results.push([true, name]), console.log("  ✓", name));
const fail = (name, err) => (results.push([false, name]), console.log("  ✗", name, "—", err?.message ?? err));
async function test(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(name, e);
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const browser = await chromium.launch();
const consoleErrors = [];
function watch(page) {
  page.on("console", (m) => m.type() === "error" && !/maps\.google|google\.com|status of 404/.test(m.text()) && consoleErrors.push(`${page.url()} → ${m.text()}`));
  page.on("pageerror", (e) => consoleErrors.push(`${page.url()} → ${e.message}`));
}
// Google Maps is a third-party embed: block it so tests do not depend on it.
async function newPage(opts = {}) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/google\.com|googleapis|gstatic/, (r) => r.abort());
  // WhatsApp is external: answer locally so the popup keeps the wa.me URL we want to inspect.
  await ctx.route(/wa\.me|whatsapp\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp stub" }));
  const page = await ctx.newPage();
  watch(page);
  return page;
}

const PAGES = ["", "/rooms", "/restaurant", "/salon", "/gallery", "/booking", "/contact", "/privacy"];

console.log("\nPublic site");
const page = await newPage({ viewport: { width: 1440, height: 900 } });

await test("root redirects to a language", async () => {
  const r = await page.goto(BASE + "/");
  assert(/\/(fr|ar)$/.test(page.url()), "landed on " + page.url());
  assert(r.ok(), "status " + r.status());
});

await test("every page renders in FR and AR with correct lang/dir, one <h1>, a title and a canonical", async () => {
  for (const l of ["fr", "ar"])
    for (const p of PAGES) {
      const r = await page.goto(`${BASE}/${l}${p}`);
      assert(r.status() === 200, `${l}${p} → ${r.status()}`);
      assert((await page.getAttribute("html", "lang")) === l, `${l}${p} lang`);
      assert((await page.getAttribute("html", "dir")) === (l === "ar" ? "rtl" : "ltr"), `${l}${p} dir`);
      assert((await page.locator("h1").count()) === 1, `${l}${p} must have exactly one h1`);
      assert((await page.title()).length > 5, `${l}${p} title`);
      assert(await page.locator('link[rel="canonical"]').count(), `${l}${p} canonical`);
    }
});

await test("no broken internal links or images", async () => {
  const seen = new Set();
  for (const l of ["fr", "ar"])
    for (const p of PAGES) {
      await page.goto(`${BASE}/${l}${p}`);
      const urls = await page.$$eval("a[href], img[src]", (els) =>
        els.map((e) => e.getAttribute("href") ?? e.currentSrc ?? e.getAttribute("src")).filter(Boolean),
      );
      for (const u of urls) {
        const abs = new URL(u, page.url());
        if (abs.origin !== new URL(BASE).origin || seen.has(abs.pathname + abs.search)) continue;
        if (abs.pathname.startsWith("/admin")) continue; // checked in the admin section
        seen.add(abs.pathname + abs.search);
        const r = await page.request.get(abs.href, { maxRedirects: 3 });
        assert(r.status() === 200, `${abs.pathname} → ${r.status()} (linked from /${l}${p})`);
      }
    }
  console.log(`    (${seen.size} unique internal URLs checked)`);
});

await test("unknown URL shows the localised 404", async () => {
  const r = await page.goto(`${BASE}/ar/this-does-not-exist`);
  assert(r.status() === 404, "status " + r.status());
  assert((await page.textContent("h1")).includes("غير موجودة"), "Arabic 404 text");
});

await test("language switch keeps the current page", async () => {
  await page.goto(`${BASE}/fr/rooms`);
  await page.click('header a[hreflang="ar"]');
  await page.waitForURL(/\/ar\/rooms$/);
});

await test("rooms show prices in DZD and unconfirmed markers", async () => {
  await page.goto(`${BASE}/fr/rooms`);
  const text = await page.textContent("main");
  assert(/DZD/.test(text), "DZD price shown");
  assert(/à confirmer/i.test(text), "placeholder markers present");
});

await test("gallery: filter, open lightbox, next, close with Escape", async () => {
  await page.goto(`${BASE}/fr/gallery`);
  const all = await page.locator("main ul li button").count();
  await page.getByRole("button", { name: /Restaurant/ }).click();
  const filtered = await page.locator("main ul li button").count();
  assert(filtered > 0 && filtered < all, `filter ${filtered}/${all}`);
  await page.getByRole("button", { name: /^Tout/ }).click();
  await page.locator("main ul li button").first().click();
  const dlg = page.locator("dialog[open]");
  await dlg.waitFor();
  assert((await dlg.textContent()).includes(`1 / ${all}`), "counter");
  await page.getByRole("button", { name: "Photo suivante" }).click();
  assert((await dlg.textContent()).includes(`2 / ${all}`), "next");
  await page.keyboard.press("Escape");
  await page.waitForSelector("dialog[open]", { state: "detached" }).catch(() => {});
  assert(!(await page.locator("dialog[open]").count()), "closed");
});

let bookingRef = "";
await test("booking form: validation errors are shown and announced", async () => {
  await page.goto(`${BASE}/fr/booking`);
  await page.getByRole("button", { name: /Envoyer via WhatsApp/ }).click();
  await page.waitForSelector('[aria-invalid="true"]');
  const n = await page.locator('[aria-invalid="true"]').count();
  assert(n >= 4, `${n} invalid fields`);
  assert(await page.locator(".field-error").count(), "error text visible");
});

await test("booking form: valid request is saved and opens WhatsApp with a formatted message", async () => {
  await page.goto(`${BASE}/fr/booking?room=chambre-double`);
  const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  await page.fill("#bk-fullName", "Test Client E2E");
  await page.fill("#bk-phone", "0550 12 34 56");
  await page.fill("#bk-arrival", d(10));
  await page.fill("#bk-departure", d(13));
  await page.fill("#bk-guests", "2");
  await page.fill("#bk-message", "Arrivée vers 18h");
  await page.check('input[name="consent"]');
  assert((await page.inputValue("#bk-room")) === "chambre-double", "room preselected from URL");
  const [popup] = await Promise.all([
    page.context().waitForEvent("page", { timeout: 10000 }),
    page.getByRole("button", { name: /Envoyer via WhatsApp/ }).click(),
  ]);
  await popup.waitForLoadState();
  const waUrl = popup.url();
  await popup.close();
  const status = await page.locator('[role="status"]').textContent();
  bookingRef = status.match(/ES-[A-Z0-9]{6}/)?.[0] ?? "";
  assert(bookingRef, "reference shown");
  assert(/n’est pas encore confirmée/.test(status), "states it is not a confirmed reservation");
  const text = decodeURIComponent(new URL(waUrl).searchParams.get("text") ?? "");
  assert(/wa\.me|whatsapp/.test(waUrl), "opened WhatsApp: " + waUrl);
  for (const s of [bookingRef, "Test Client E2E", "Chambre double", "3 nuits", "Personnes : 2", "à confirmer"])
    assert(text.includes(s), `WhatsApp text contains "${s}"`);
});

await test("booking form works in Arabic (RTL) with an Arabic WhatsApp message", async () => {
  const p = await newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(`${BASE}/ar/booking`);
  const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  await p.fill("#bk-fullName", "محمد اختبار");
  await p.fill("#bk-phone", "+213 661 00 00 00");
  await p.fill("#bk-arrival", d(20));
  await p.fill("#bk-departure", d(21));
  await p.check('input[name="consent"]');
  const [popup] = await Promise.all([p.context().waitForEvent("page"), p.locator('button[type="submit"]').click()]);
  await popup.waitForLoadState();
  const text = decodeURIComponent(new URL(popup.url()).searchParams.get("text") ?? "");
  assert(text.includes("طلب حجز") && text.includes("ليلة واحدة"), "Arabic message: " + text.slice(0, 80));
  await p.context().close();
});

await test("contact form sends a message", async () => {
  await page.goto(`${BASE}/fr/contact`);
  await page.fill("#ct-fullName", "Visiteur E2E");
  await page.fill("#ct-replyTo", "visiteur@example.com");
  await page.fill("#ct-message", "Bonjour, est-ce que le parking est disponible ?");
  await page.check('form input[name="consent"]');
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await page.getByText("votre message a été transmis").waitFor();
});

console.log("\nMobile layouts (390 px)");
const mobile = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await test("no horizontal overflow on any page (FR + AR)", async () => {
  for (const l of ["fr", "ar"])
    for (const p of PAGES) {
      await mobile.goto(`${BASE}/${l}${p}`);
      const over = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 1, `/${l}${p} overflows by ${over}px`);
    }
});
await test("mobile menu opens, navigates and closes", async () => {
  await mobile.goto(`${BASE}/fr`);
  await mobile.getByRole("button", { name: "Menu" }).click();
  await mobile.locator("#mobile-menu").getByRole("link", { name: "Galerie" }).click();
  await mobile.waitForURL(/\/fr\/gallery$/);
  await mobile.locator("#mobile-menu").waitFor({ state: "hidden", timeout: 5000 });
});

console.log("\nAdmin");
const admin = await newPage({ viewport: { width: 1366, height: 900 } });
await test("admin pages require a session", async () => {
  for (const p of ["/admin", "/admin/rooms", "/admin/bookings", "/admin/settings"]) {
    await admin.goto(BASE + p);
    assert(admin.url().endsWith("/admin/login"), `${p} → ${admin.url()}`);
  }
  // A forged cookie must not grant access (sessions are checked in the database).
  await admin.context().addCookies([{ name: "es_admin_session", value: "forged-token", url: BASE }]);
  await admin.goto(BASE + "/admin/rooms");
  assert(admin.url().endsWith("/admin/login"), "forged cookie rejected");
  await admin.context().clearCookies();
});

if (!EMAIL || !PASSWORD) {
  fail("admin flows", "ADMIN_EMAIL / ADMIN_PASSWORD not set");
} else {
  await test("wrong password is rejected", async () => {
    await admin.goto(BASE + "/admin/login");
    await admin.fill("#email", EMAIL);
    await admin.fill("#password", "wrong-password-123");
    await admin.click('button[type="submit"]');
    await admin.getByText("Identifiants incorrects").waitFor();
  });
  await test("login works and session cookie is httpOnly", async () => {
    await admin.fill("#password", PASSWORD);
    await admin.click('button[type="submit"]');
    await admin.waitForURL(/\/admin$/);
    const c = (await admin.context().cookies()).find((x) => x.name === "es_admin_session");
    assert(c?.httpOnly && c.sameSite === "Lax", "cookie flags");
  });
  await test("every admin page renders", async () => {
    for (const p of ["", "/bookings", "/messages", "/rooms", "/rooms/new", "/photos", "/restaurant", "/salon", "/facilities", "/settings", "/account"]) {
      const r = await admin.goto(`${BASE}/admin${p}`);
      assert(r.status() === 200 && !admin.url().includes("login"), `/admin${p} → ${r.status()}`);
    }
  });
  await test("booking request appears and its status can be changed", async () => {
    await admin.goto(`${BASE}/admin/bookings?status=new`);
    const card = admin.locator("section", { hasText: bookingRef });
    assert(await card.count(), "booking listed: " + bookingRef);
    await card.locator('select[name="status"]').selectOption("contacted");
    await card.locator('textarea[name="staffNote"]').fill("Rappelé, chambre proposée");
    await card.getByRole("button", { name: "Mettre à jour" }).click();
    await admin.getByText("Demande mise à jour.").waitFor();
    await admin.goto(`${BASE}/admin/bookings?status=contacted`);
    assert(await admin.locator("section", { hasText: bookingRef }).count(), "now under contacted");
  });
  await test("contact message is listed", async () => {
    await admin.goto(`${BASE}/admin/messages`);
    await admin.getByText("Visiteur E2E").waitFor();
  });
  await test("room price edit is reflected on the public site", async () => {
    await admin.goto(`${BASE}/admin/rooms`);
    await admin.getByRole("link", { name: /Chambre à deux lits/ }).click();
    await admin.fill('input[name="priceDzd"]', "6800");
    await admin.fill('input[name="capacity"]', "2");
    await admin.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await admin.getByText("Chambre enregistrée.").waitFor();
    await page.goto(`${BASE}/fr/rooms`);
    const txt = await page.locator("#chambre-deux-lits").textContent();
    assert(/6\s?800\s?DZD/.test(txt.replace(/ | /g, " ")), "new price visible");
    assert(txt.includes("2 personnes"), "capacity visible");
  });
  await test("create and delete a room", async () => {
    await admin.goto(`${BASE}/admin/rooms/new`);
    await admin.fill('input[name="name_fr"]', "Suite test E2E");
    await admin.fill('input[name="name_ar"]', "جناح تجريبي");
    await admin.getByRole("button", { name: "Créer la chambre" }).click();
    await admin.getByText("Chambre créée.").waitFor();
    await page.goto(`${BASE}/fr/rooms`);
    assert(await page.getByText("Suite test E2E").count(), "new room public");
    admin.once("dialog", (d) => d.accept());
    await admin.getByRole("button", { name: "Supprimer la chambre" }).click();
    await admin.getByText("Chambre supprimée").waitFor();
  });
  await test("upload, edit and delete a photo", async () => {
    await admin.goto(`${BASE}/admin/photos`);
    const before = await admin.locator("#photo-grid > li").count();
    await admin.setInputFiles('input[name="files"]', path.resolve("seed-assets/salon.jpg"));
    await admin.selectOption('select[name="category"] >> nth=0', "salon");
    await admin.fill('input[name="alt_fr"] >> nth=0', "Photo test E2E");
    await admin.getByRole("button", { name: "Téléverser" }).click();
    await admin.getByText("✓ salon.jpg").waitFor({ timeout: 30000 });
    await admin.waitForFunction((n) => document.querySelectorAll("#photo-grid > li").length === n + 1, before);
    const card = admin.locator("#photo-grid > li").filter({ has: admin.locator('input[value="Photo test E2E"]') });
    const src = await card.locator("img").getAttribute("src");
    const img = await admin.request.get(BASE + src);
    assert(img.headers()["content-type"] === "image/webp", "served as webp");
    admin.once("dialog", (d) => d.accept());
    await card.getByRole("button", { name: "Supprimer" }).click();
    await admin.getByText("Photo supprimée.").waitFor();
    assert((await admin.request.get(BASE + src)).status() === 404, "files removed from disk");
  });
  await test("a non-image upload is rejected", async () => {
    await admin.goto(`${BASE}/admin/photos`);
    await admin.setInputFiles('input[name="files"]', { name: "evil.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<script>alert(1)</script>") });
    await admin.getByRole("button", { name: "Téléverser" }).click();
    await admin.getByText(/✕ evil\.jpg — Fichier non reconnu/).waitFor();
  });
  await test("restaurant hours appear publicly only once confirmed", async () => {
    await admin.goto(`${BASE}/admin/restaurant`);
    await admin.fill('input[name="hours_fr"]', "12h – 15h · 19h – 22h");
    await admin.getByRole("button", { name: "Enregistrer" }).click();
    await admin.getByText("Restaurant enregistré.").waitFor();
    await page.goto(`${BASE}/fr/restaurant`);
    assert(!(await page.getByText("12h – 15h").count()), "hidden while unconfirmed");
    await admin.check('input[name="confirmed"]');
    await admin.getByRole("button", { name: "Enregistrer" }).click();
    await admin.getByText("Restaurant enregistré.").waitFor();
    await page.goto(`${BASE}/fr/restaurant`);
    assert(await page.getByText("12h – 15h").count(), "shown once confirmed");
  });
  await test("settings validation rejects a bad WhatsApp number and keeps data", async () => {
    await admin.goto(`${BASE}/admin/settings`);
    await admin.fill('input[name="whatsapp"]', "0550123456");
    await admin.getByRole("button", { name: "Enregistrer les paramètres" }).click();
    await admin.getByText(/WhatsApp : format international/).waitFor();
  });
  await test("logout ends the session", async () => {
    await admin.goto(`${BASE}/admin`);
    await admin.getByRole("button", { name: "Déconnexion" }).click();
    await admin.waitForURL(/\/admin\/login$/);
    await admin.goto(`${BASE}/admin/bookings`);
    assert(admin.url().endsWith("/admin/login"), "redirected after logout");
  });
}

await test("no JavaScript errors in the browser console", async () => {
  assert(consoleErrors.length === 0, consoleErrors.slice(0, 5).join("\n"));
});

await browser.close();
const failed = results.filter((r) => !r[0]).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
