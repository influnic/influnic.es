// Run from repository root: node tests/site-services.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const index=fs.readFileSync('index.html','utf8');
const servicenow=fs.readFileSync('servicenow.html','utf8');
const soon=fs.readFileSync('coming-soon.html','utf8');
const apps=fs.readFileSync('servicenow-applications.html','utf8');
const section=index.split('<!-- Services: three service families, three products per family -->')[1].split('<!-- Cases')[0];
const cards=[...section.matchAll(/<a class="catalog-card group" href="([^"]+)"/g)].map(x=>x[1].replace(/&amp;/g,'&'));
assert.equal(cards.length,9);
const base='https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=zMEtl7-WhU29dI_U47rVp_aP-PJ7cFBPoAnVTx0p3y9UOUFGRUtQWjlXN0lHU0RUS0I2T0VWSDJWSS4u';
assert.deepEqual(cards,[
 'servicenow-applications.html','servicenow.html',
 base+'&r7fb3e6a1cf134d32beffb1cd6eeffaa3=%22ServiceLite%20(ServiceNow%20para%20PYMEs)%22',
 'orgchart.html','gantt.html','coming-soon.html?service=scrum','coming-soon.html?service=domains',
 base+'&r7fb3e6a1cf134d32beffb1cd6eeffaa3=%22Desarrollo%20web%20a%20medida%22',
 base+'&r7fb3e6a1cf134d32beffb1cd6eeffaa3=%22Workplace%20%5Bo365%2C%20Email%20%26%20Teams%5D%22'
]);
assert.doesNotMatch(section,/buy\.stripe\.com|59,99|Página Web a medida/);
const i18n=vm.runInNewContext(index.split('const translations =')[1].split('let currentLang')[0].replace(/^\s*/, 'const translations =')+';translations');
for(const key of [...index.matchAll(/data-i18n="([^"]+)"/g)].map(m=>m[1])){
 assert.ok(i18n.es[key], 'missing Spanish key: '+key);
 assert.ok(i18n.en[key], 'missing English key: '+key);
}
assert.equal((servicenow.match(/href="servicenow-applications\.html"/g)||[]).length,3);
assert.match(servicenow,/Servicios%20Gestionados%20ServiceNow/);
assert.match(servicenow,/CIS-DF CMDB &amp; CSDM/);
assert.doesNotMatch(servicenow,/data-i18n="contactnote"|forms\.office\.com/);
assert.match(servicenow,/Las certificaciones descritas han sido otorgadas al fundador de forma personal/);
assert.match(soon,/service=scrum|Scrum Sprint Manager/);
assert.match(apps,/data-service="applications"/);
console.log('PASS: all 9 service links, bilingual text, permanent application URL, contact and legal changes');
