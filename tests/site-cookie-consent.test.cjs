// Install jsdom (npm install --no-save jsdom) and run: node tests/site-cookie-consent.test.cjs
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync('cookie-consent.js','utf8');
const homepage=fs.readFileSync('index.html','utf8');
const pages=['index.html','servicenow.html','orgchart.html','gantt.html','coming-soon.html','servicenow-applications.html','legal.html','privacy.html','cookies.html'];
for(const path of pages)assert.match(fs.readFileSync(path,'utf8'),/src="cookie-consent\.js" defer/,path+' consent script');
assert.doesNotMatch(homepage,/<link[^>]+href="https:\/\/fonts\.googleapis\.com/,'Google Fonts must not load before explicit consent');
assert.doesNotMatch(homepage,/<link[^>]+href="https:\/\/fonts\.gstatic\.com/,'no pre-consent font resource');
assert.match(homepage,/<meta name="influnic-optional-fonts" content="google-fonts">/);
async function create(hasFonts=true,lang='es',record=null){
 const dom=new JSDOM('<!doctype html><html lang="'+lang+'"><head>'+(hasFonts?'<meta name="influnic-optional-fonts" content="google-fonts">':'')+'</head><body><footer></footer></body></html>',{
   url:'https://influnic.es/index.html',runScripts:'outside-only'
 });
 if(record)dom.window.localStorage.setItem('influnicCookieConsentV1',JSON.stringify(record));
 dom.window.eval(script);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 return dom;
}
(async()=>{
 const d=await create(),w=d.window,$=s=>w.document.querySelector(s);
 assert.equal($('#influnic-consent-panel').hidden,false);
 assert.equal($('#influnic-consented-fonts'),null,'no font link before consent');
 assert.equal($('[data-consent-optional]').checked,false,'optional consent not prechecked');
 const saved=()=>JSON.parse(w.localStorage.getItem('influnicCookieConsentV1'));
 $('[data-consent-action="reject"]').click();
 assert.equal(saved().googleFonts,false);
 assert.equal($('#influnic-consented-fonts'),null);
 assert.equal($('#influnic-consent-panel').hidden,true);
 assert.equal($('[data-cookie-settings]').hidden,false);
 $('[data-cookie-settings]').click();
 assert.equal($('#influnic-consent-panel').hidden,false);
 assert.equal($('[data-consent-config]').hidden,false);
 $('[data-consent-optional]').checked=true;
 $('[data-consent-action="save"]').click();
 assert.equal(saved().googleFonts,true);
 assert.equal($('#influnic-consented-fonts').getAttribute('href').startsWith('https://fonts.googleapis.com/'),true);
 d.window.close();
 const e=await create(true,'en');
 const ee=s=>e.window.document.querySelector(s);
 assert.equal(ee('[data-consent-action="reject"]').textContent,'Reject optional');
 assert.equal(ee('[data-consent-action="accept"]').textContent,'Accept optional');
 ee('[data-consent-action="configure"]').click();
 assert.equal(ee('[data-consent-optional]').checked,false);
 ee('[data-consent-action="save"]').click();
 assert.equal(JSON.parse(e.window.localStorage.getItem('influnicCookieConsentV1')).googleFonts,false);
 assert.equal(ee('#influnic-consented-fonts'),null);
 e.window.close();
 const f=await create(false,'es',{version:1,googleFonts:true,at:Date.now()});
 assert.equal(f.window.document.querySelector('#influnic-consent-panel').hidden,true,'remembered consent suppresses the banner');
 assert.equal(f.window.document.querySelector('#influnic-consented-fonts'),null,'fonts not needed on a non-homepage');
 f.window.close();
 const g=await create(true,'es',{version:1,googleFonts:true,at:Date.now()-181*86400000});
 assert.equal(g.window.document.querySelector('#influnic-consent-panel').hidden,false,'expired consent must be renewed');
 assert.equal(g.window.document.querySelector('#influnic-consented-fonts'),null,'expired consent loads nothing');
 g.window.close();
 console.log('PASS: optional-resource blocking, accept/reject/configure, bilingual labels and 180-day expiry');
})().catch(e=>{console.error(e);process.exitCode=1;});
