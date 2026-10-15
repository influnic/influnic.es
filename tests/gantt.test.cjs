// Run with a static server on port 8765 and Playwright installed:
// node tests/gantt.test.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  try {
    await page.goto(process.env.GANTT_URL || 'http://127.0.0.1:8765/gantt.html');
    await page.locator('#sample').click();
    assert.equal(await page.locator('.taskrow').count(), 6);
    const validation = await page.evaluate(() => {
      const s = copy(state);
      s.project = 'Proyecto ñ, "demo"';
      s.tasks[0].name = 'Definir, "alcance"';
      s.tasks[0].notes = 'Línea uno\nLínea dos; ñ';
      const csv = normalize(parseCsv(encodeCsv(s)));
      const json = normalize(JSON.parse(JSON.stringify(s)));
      const rejects = change => { const bad = copy(s); change(bad); try { normalize(bad); return false; } catch { return true; } };
      return {
        csv: JSON.stringify(csv.tasks) === JSON.stringify(s.tasks) && csv.project === s.project,
        json: JSON.stringify(json) === JSON.stringify(s),
        invalidDate: rejects(s => s.tasks[0].start = '2026-02-30'),
        backwards: rejects(s => s.tasks[0].end = '1900-01-01'),
        duplicate: rejects(s => s.tasks[1].id = s.tasks[0].id),
        missingDependency: rejects(s => s.tasks[0].dependencies = ['missing']),
        cycle: rejects(s => s.tasks[0].dependencies = ['launch']),
        progress: rejects(s => s.tasks[0].progress = 101),
        range: rejects(s => s.tasks[5].start = s.tasks[5].end = '2199-01-01'),
        semicolon: normalize(parseCsv('name;start;end\r\n"Una; tarea";2026-10-01;2026-10-02')).tasks[0].name === 'Una; tarea',
        badQuote: (() => { try { parseCsv('name,start,end\n"oops,2026-10-01,2026-10-02'); return false; } catch { return true; } })()
      };
    });
    for (const [key, value] of Object.entries(validation)) assert.equal(value, true, key);
    await page.locator('#saveLocal').click();
    const saved = await page.evaluate(() => snapshot());
    await page.reload();
    await page.locator('#loadLocal').click();
    assert.equal(await page.evaluate(() => snapshot()), saved);
    // Move and resize the first bar, then undo both changes.
    const original = await page.evaluate(() => state.tasks[0].start);
    let bar = page.locator('[data-bar="discovery"]');
    let box = await bar.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 14);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 28, box.y + 14, { steps: 5 }); await page.mouse.up();
    assert.equal(await page.evaluate(() => state.tasks[0].start), await page.evaluate(s => add(s, 2), original));
    await page.locator('#undo').click();
    assert.equal(await page.evaluate(() => state.tasks[0].start), original);
    const originalEnd = await page.evaluate(() => state.tasks[0].end);
    box = await bar.boundingBox();
    await page.mouse.move(box.x + box.width - 3, box.y + 14);
    await page.mouse.down(); await page.mouse.move(box.x + box.width + 25, box.y + 14, { steps: 5 }); await page.mouse.up();
    assert.equal(await page.evaluate(() => state.tasks[0].end), await page.evaluate(s => add(s, 2), originalEnd));
    await page.locator('#undo').click();
    await page.locator('[data-edit="discovery"]').click();
    await page.locator('#taskName').fill('Alcance revisado');
    await page.locator('#taskForm button[type="submit"]').click();
    assert.equal(await page.locator('[data-edit="discovery"] strong').textContent(), 'Alcance revisado');
    // Actual export download and file import, preserving all fields.
    for (const ext of ['Json', 'Csv']) {
      const expected = await page.evaluate(() => JSON.stringify({ project: state.project, tasks: state.tasks }));
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#export' + ext).click();
      const download = await downloadPromise;
      const path = await download.path();
      await page.locator('#newProject').click();
      await page.locator('#file').setInputFiles({ name: 'plan.' + ext.toLowerCase(), mimeType: ext === 'Json' ? 'application/json' : 'text/csv', buffer: require('fs').readFileSync(path) });
      await page.waitForFunction(() => state.tasks.length === 6);
      assert.equal(await page.evaluate(() => JSON.stringify({ project: state.project, tasks: state.tasks })), expected);
    }
    const beforeBad = await page.evaluate(() => snapshot());
    await page.locator('#file').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('name,start,end\nbad,2026-10-31,2026-10-01') });
    await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('No se importó'));
    assert.equal(await page.evaluate(() => snapshot()), beforeBad);
    // User content remains text rather than markup.
    await page.evaluate(() => { state.tasks[0].name = '<img src=x onerror=alert(1)>'; render(); });
    assert.equal(await page.locator('.taskmeta img').count(), 0);
    await page.locator('#undo').click();
    await page.screenshot({ path: '/tmp/gantt-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '/tmp/gantt-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: rendering, JSON/CSV round trips, validations, save/load, drag, resize, undo, edit, downloads/imports, atomic failed import, escaping, responsive layout.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
