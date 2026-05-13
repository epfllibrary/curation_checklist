/**
 * Puppeteer Unit Tests for zenodo_greasemonkey.user.js
 *
 * Strategy:
 *  - Serve the fixture HTML via a local file URL (no server needed).
 *  - Stub out Greasemonkey APIs (GM_getValue, GM_setValue, GM_addStyle)
 *    with page.evaluateOnNewDocument() before the script runs.
 *  - Inject the userscript with page.addScriptTag().
 *  - Assert on DOM state using page.evaluate().
 *
 * Run with:  node tests/price-highlighter.test.js
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

// ─── Tiny assertion helpers ───────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  ✅  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── Testing the test runner ─────────────────────────────────────────────────────────────
async function runTrivialTests() {
  const fixtureUrl =
    "file://" + path.resolve(__dirname, "fixtures/empty.html");
  const scriptPath = path.resolve(
    __dirname,
    "../zenodo_greasemonkey.user.js"
  );
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  /**
   * Helper: launch browser, load the fixture, inject GM stubs + userscript,
   * then return { page, browser } ready for assertions.
   *
   * @param {object} gmValues  - key/value pairs returned by GM_getValue stubs
   */
  async function setupPage(gmValues = { }) {
    const browser = await puppeteer.launch({
      headless: "new", // use new headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.7.1.slim.min.js'}),

    // ── 1. Stub Greasemonkey APIs BEFORE the page loads ──────────────────────
    //    evaluateOnNewDocument runs in the page context before any script,
    //    making GM_* available when our userscript executes.
    await page.evaluateOnNewDocument((values) => {
      // GM_getValue: return stubbed values or a default
      window.GM_getValue = (key, defaultVal) =>
        key in values ? values[key] : defaultVal;

      // GM_setValue: no-op (or capture for assertions if needed)
      window.GM_setValue = () => {};

      // GM_addStyle: inject a real <style> tag so CSS rules apply
      window.GM_addStyle = (css) => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      };
    }, gmValues);

    // ── 2. Navigate to the fixture ────────────────────────────────────────────
    await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });

    // ── 3. Inject the userscript ──────────────────────────────────────────────
    //    addScriptTag executes in the page context, just like a content script.
    await page.addScriptTag({ content: scriptContent });

    // Give the script a tick to finish synchronous work
    await new Promise((r) => setTimeout(r, 100));

    return { page, browser };
  }

  // ─── Test Suite ─────────────────────────────────────────────────────────────

  console.log("Entering test suite, not much to see yet");

  // ── Suite 1: Price parsing & highlight classes ────────────────────────────
  console.log("\n📦  Suite 1: Trivial test just to be sure");
  {
    const { page, browser } = await setupPage({ });

    assertEqual(1, 1, "Everything looks fine in the trivial test")    

    await browser.close();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

async function runTests() {
  const fixtureUrl =
    "file://" + path.resolve(__dirname, "fixtures/Zenodo curation demo dataset 2.html");
  const scriptPath = path.resolve(
    __dirname,
    "../zenodo_greasemonkey.user.js"
  );
  const scriptContent = fs.readFileSync(scriptPath, "utf8");

  /**
   * Helper: launch browser, load the fixture, inject GM stubs + userscript,
   * then return { page, browser } ready for assertions.
   *
   * @param {object} gmValues  - key/value pairs returned by GM_getValue stubs
   */
  async function setupPage(gmValues = { }) {
    const browser = await puppeteer.launch({
      headless: "new", // use new headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();


    // ── 1. Stub Greasemonkey APIs BEFORE the page loads ──────────────────────
    //    evaluateOnNewDocument runs in the page context before any script,
    //    making GM_* available when our userscript executes.
    await page.evaluateOnNewDocument((values) => {
      // GM_getValue: return stubbed values or a default
      window.GM_getValue = (key, defaultVal) =>
        key in values ? values[key] : defaultVal;

      // GM_setValue: no-op (or capture for assertions if needed)
      window.GM_setValue = () => {};

      // GM_addStyle: inject a real <style> tag so CSS rules apply
      window.GM_addStyle = (css) => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      };
    }, gmValues);

    // ── 2. Navigate to the fixture ────────────────────────────────────────────
    await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });
    await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.7.1.slim.min.js'})

    // ── 3. Inject the userscript ──────────────────────────────────────────────
    //    addScriptTag executes in the page context, just like a content script.
    await page.addScriptTag({ content: scriptContent });

    // Give the script a tick to finish synchronous work
    await new Promise((r) => setTimeout(r, 100));

    return { page, browser };
  }

  // ─── Test Suite ─────────────────────────────────────────────────────────────

  console.log("Entering test suite, not much to see yet");

  // ── Suite 1: Price parsing & highlight classes ────────────────────────────
  console.log("\n📦  Suite 2: Loading test, just to be sure");
  {
    const { page, browser } = await setupPage({ });

    assertEqual(1, 1, "Everything looks fine so far")

    const displayedChecks = await page.evaluate(() => {
      // return 19
      let btnGroups = $('div.btn-group');
      console.log('btnGroups', btnGroups);
      return btnGroups ? btnGroups.length : 0 
    });

    assertEqual(displayedChecks, 19, "All checkboxes present and accounted for");

    await browser.close();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}


// runTrivialTests()
//  .catch((err) => {
//   console.error("Test test runner crashed:", err);
//   process.exit(1);
// });


runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});


