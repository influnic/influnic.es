// Run from repository root: node tests/site-legal-navigation.test.cjs
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=name=>fs.readFileSync(name,'utf8');
const home=read('index.html'),service=read('servicenow.html');
const coming=read('coming-soon.html'),apps=read('servicenow-applications.html');
const legal=read('legal.html'),privacy=read('privacy.html'),cookies=read('cookies.html');
const logo=read('influnic-logo.svg');
for(const page of [home,service,coming,apps]){
 for(const route of ['legal.html','privacy.html','cookies.html'])assert.ok(page.includes('href="'+route+'"'),route+' must appear in page footer');
}
for(const name of ['orgchart.html','gantt.html','servicenow.html']){
 assert.match(home,new RegExp('href="'+name.replace('.','\\.')+'" target="_blank" rel="noopener noreferrer"'),name+' should open in a safe new tab');
}
assert.ok(home.includes('https://www.linkedin.com/company/influnic'));
for(const page of [coming,apps]){
 assert.ok(page.includes('src="influnic-logo.svg"'));
 assert.ok(page.includes('document.referrer')&&page.includes('history.back()'));
 assert.ok(page.includes("'Volver':'Back'"));
}
assert.ok(logo.includes('data:image/png;base64'));
assert.ok(legal.includes('B75729962')&&legal.includes('SE-147815'));
assert.ok(privacy.includes('info@influnic.com')&&privacy.includes('Agencia Española de Protección de Datos'));
assert.ok(cookies.includes('influnicLang')&&cookies.includes('influnic-gantt-builder-state'));
for(const [file,s] of Object.entries({'legal.html':legal,'privacy.html':privacy,'cookies.html':cookies})){
 assert.match(s,/data-locale="es"/,file+' Spanish notice');
 assert.match(s,/data-locale="en"/,file+' English notice');
 const script=s.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,file+' script');
 new Function(script);
}
console.log('PASS: legal pages, bilingual notices, all footer links, new tabs, previous-page navigation and brand logo.');
