// npm install --no-save jsdom @napi-rs/canvas
// node tests/gantt-export.test.cjs
const { JSDOM } = require('jsdom');
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const downloads = [], buffers = [], errors = [], drawnText = [];
const dom = new JSDOM(fs.readFileSync('gantt.html', 'utf8'), {
  url: 'https://example.test/gantt.html', runScripts: 'dangerously',
  beforeParse(w) {
    w.matchMedia = () => ({ matches: false });
    w.confirm = () => true;
    w.URL.createObjectURL = () => 'blob:test';
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
    w.HTMLCanvasElement.prototype.getContext = function () {
      this.nativeCanvas = createCanvas(this.width, this.height);
      const ctx=this.nativeCanvas.getContext('2d');const fill=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>{drawnText.push(String(value));return fill(value,...args);};return ctx;
    };
    w.HTMLCanvasElement.prototype.toBlob = function (cb) {
      const png = this.nativeCanvas.toBuffer('image/png');
      buffers.push(png); cb(new w.Blob([png], { type: 'image/png' }));
    };
    w.addEventListener('error', e => errors.push(e.message));
  }
});
const w = dom.window, $ = id => w.document.getElementById(id);
(async () => {
  try {
    assert.equal(w.document.querySelector('label[for="group"]').textContent, 'Esfuerzo');
    assert.equal($('exportPng').nextElementSibling.id, 'print');
    $('sample').click();
    $('projectName').value = 'Plan de implantación';
    $('projectName').dispatchEvent(new w.Event('change'));
    const before = w.eval('snapshot()');
    $('exportJson').click(); $('exportCsv').click(); await $('exportPng').onclick();
    assert.deepEqual(downloads, ['Plan de implantación.json', 'Plan de implantación.csv', 'Plan de implantación.png']);
    assert.equal(w.eval('snapshot()'), before);
    assert.ok(drawnText.every(t=>!t.includes('INFLUNIC')));
    const dates=w.eval('taskDates(state.tasks[0])');
    assert.match(dates,/^\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}$/);
    assert.equal(w.document.querySelector('[data-edit="discovery"] .task-dates').textContent,dates);
    assert.ok(drawnText.includes(dates));
    assert.match(w.eval('taskDates(state.tasks.at(-1))'),/^\d{2}\/\d{2}\/\d{4}$/);
    assert.match($('dateRange').textContent,/^\d{2}\/\d{2}\/\d{4}/);
    assert.equal(buffers[0].subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(buffers[0].readUInt32BE(16) > 700);
    assert.ok(buffers[0].readUInt32BE(20) > 6 * 62);
    fs.writeFileSync('/tmp/gantt-export-preview.png', buffers[0]);
    for (const [name, expected] of [['  ', 'Mi proyecto.png'], ['Plan / cliente: uno?', 'Plan _ cliente_ uno_.png'], ['CON', '_CON.png'], ['Plan. ', 'Plan.png']]) {
      w.eval('state.project=' + JSON.stringify(name));
      assert.equal(w.eval('exportFilename("png")'), expected);
    }
    // A very wide, tall plan is scaled to the canvas limits without losing rows.
    w.eval(`state.tasks=Array.from({length:500},(_,i)=>({...state.tasks[0],id:'task-'+i,start:'2026-01-01',end:'2035-12-31',dependencies:[]}));state.scale='day';state.zoom=3;render();`);
    let canvas = w.eval('createGanttCanvas()');
    assert.ok(canvas.width <= 16000 && canvas.height <= 16000);
    assert.ok(canvas.width * canvas.height <= 32000000);
    $('newProject').click(); await $('exportPng').onclick();
    assert.equal($('exportPng').disabled, false);
    assert.equal(downloads.at(-1), 'Mi proyecto.png');
    // Encoding failures are reported and the export control remains usable.
    w.HTMLCanvasElement.prototype.toBlob = cb => cb(null);
    await $('exportPng').onclick();
    assert.ok($('status').textContent.startsWith('No se pudo exportar'));
    assert.equal($('exportPng').disabled, false);
    assert.deepEqual(errors, []);
    console.log('PASS: project filenames, effort label, complete PNG rendering/encoding, dimensions, empty project, state preservation and error recovery.');
  } finally { dom.window.close(); }
})().catch(e => { console.error(e); process.exit(1); });
