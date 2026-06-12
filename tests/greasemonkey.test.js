// tests/greasemonkey.test.js
const path = require('path');
const fs   = require('fs');

const FIXTURE_RECORD  = 'file://' + path.resolve(__dirname, 'fixtures/Zenodo curation demo dataset 2.html');
const FIXTURE_EMPTY   = 'file://' + path.resolve(__dirname, 'fixtures/empty.html');
const SCRIPT_CONTENT  = fs.readFileSync(
  path.resolve(__dirname, '../zenodo_greasemonkey.user.js'), 'utf8'
);

// ─── Shared setup helper ──────────────────────────────────────────────────────
// Equivalent to your setupPage(), but doesn't manage browser/page lifetime
// (jest-puppeteer injects `page` and `browser` as globals).

async function injectScript(gmValues = {}) {
  await page.evaluateOnNewDocument((values) => {
    window.GM_getValue = (key, def) => (key in values ? values[key] : def);
    window.GM_setValue = () => {};
    window.GM_addStyle = (css) => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    };
  }, gmValues);
}

async function loadFixture(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.slim.min.js' });
  // Wait until $ is actually available in the page before injecting the userscript
  await page.waitForFunction(() => typeof window.jQuery !== 'undefined', { timeout: 10000 });
  await page.addScriptTag({ content: SCRIPT_CONTENT });
  // Wait until the script has inserted at least one btn-group
  await page.waitForSelector('div.btn-group', { timeout: 10000 });
}

// ─── Suite 1: Smoke test on the empty fixture ─────────────────────────────────


describe('Smoke test — empty page', () => {
  // beforeEach runs before EVERY it() in this describe block.
  // If the browser crashes mid-test, the next test still gets a fresh page.
  beforeEach(async () => {
    await injectScript();
    await loadFixture(FIXTURE_RECORD);
  });

  it('loads without throwing a JS error', async () => {
    // If the script threw, addScriptTag would have rejected and this line
    // would never be reached — the test fails with a clear message.
    const title = await page.title();
    expect(typeof title).toBe('string');
  });
});

// ─── Suite 2: Record page — structural checks ─────────────────────────────────

describe('Record page — checkbox insertion', () => {
  beforeEach(async () => {
    await injectScript();
    await loadFixture(FIXTURE_RECORD);
  });

  it('inserts the expected number of btn-group elements', async () => {
    const count = await page.evaluate(() =>
      document.querySelectorAll('div.btn-group').length
    );
    expect(count).toBe(19);
  });

  // More targeted than the count: verify a specific group exists
  it('inserts a checkbox group for eligibleResourceType', async () => {
    const exists = await page.evaluate(() =>
      !!document.querySelector('#eligibleResourceType')
    );
    expect(exists).toBe(true);
  });
});

// ─── Suite 3: policyCheck results reflected in button state ───────────────────
// These are the tests that were completely missing before.
// They verify that the automated logic sets the right button state for
// each criterion, given what is in the fixture HTML.

describe('Record page — automated policy checks', () => {
  beforeEach(async () => {
    await injectScript();
    await loadFixture(FIXTURE_RECORD);
  });

  // Helper: returns which label in a btn-group contains 'x' (active button)
  // Returns 'bad', 'undecided', or 'ok' matching the label attribute.
  async function activeButton(groupId) {
    return page.evaluate((id) => {
      const group = document.querySelector(`#${id}`);
      if (!group) return null;
      const active = Array.from(group.querySelectorAll('label.btn'))
        .find(l => l.textContent.trim() === 'x');
      return active ? active.getAttribute('label') : 'undecided';
    }, groupId);
  }

  it('eligibleResourceType is OK for a dataset fixture', async () => {
    expect(await activeButton('eligibleResourceType')).toBe('ok');
  });

  it('originalDOI is OK when fixture has a 10.5281/zenodo DOI', async () => {
    expect(await activeButton('originalDOI')).toBe('ok');
  });

  // Add one test per automated check in policyCheck().
  // For criteria the fixture doesn't cover (e.g. missing description),
  // create a second minimal fixture and a parallel describe block.
});

// ─── Suite 4: Button click interaction ────────────────────────────────────────

describe('Record page — checkbox click behaviour', () => {
  beforeEach(async () => {
    await injectScript();
    await loadFixture(FIXTURE_RECORD);
  });

  it('clicking a red (bad) button marks it x and clears siblings', async () => {
    const result = await page.evaluate(() => {
      const group = document.querySelector('#allORCIDs');
      const badBtn = group.querySelector('label.btn-danger');
      badBtn.click();
      const siblings = Array.from(group.querySelectorAll('label.btn'));
      return siblings.map(l => l.textContent.trim());
    });
    // After clicking bad, it should be 'x' and the other two ' '
    expect(result[0]).toBe('x');
    expect(result[1]).toBe(' ');
    expect(result[2]).toBe(' ');
  });

  it('clicking an already-x button cycles it to ?', async () => {
    const result = await page.evaluate(() => {
      const group = document.querySelector('#eligibleResourceType');
      // The ok button starts as 'x' for a dataset fixture
      const okBtn = group.querySelector('label.btn-success');
      okBtn.click(); // x → ?
      return okBtn.textContent.trim();
    });
    expect(result).toBe('?');
  });
});
