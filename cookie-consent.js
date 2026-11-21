(function(){
  'use strict';
  // Only user-facing technical storage and optional Google Fonts have been identified.
  // No analytics/advertising cookies are installed by Influnic's current source code.
  const KEY='influnicCookieConsentV1';
  const VERSION=1;
  const LIFETIME=180*24*60*60*1000;
  const FONT_URL='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  const translations={
    es:{
      title:'Privacidad y cookies',
      intro:'Usamos almacenamiento técnico para idioma y herramientas. Si lo autorizas, cargaremos Google Fonts para mejorar la tipografía. No hemos identificado cookies de analítica o publicidad en el código revisado.',
      policy:'Política de cookies',
      accept:'Aceptar opcionales',
      reject:'Rechazar opcionales',
      configure:'Configurar',
      essential:'Esenciales / técnicas',
      essentialDetail:'Preferencias de idioma, elección de privacidad y proyectos guardados localmente. Necesarias para las funciones solicitadas; no se utilizan para publicidad.',
      active:'Siempre activas',
      optional:'Opcionales: tipografía externa',
      optionalDetail:'Google Fonts (Google): solo si lo autorizas; sin aceptación se usan fuentes del sistema. Es un recurso externo, no una cookie publicitaria identificada.',
      save:'Guardar selección',
      back:'Volver',
      manage:'Configurar cookies'
    },
    en:{
      title:'Privacy and cookies',
      intro:'We use technical browser storage for language and tools. With your permission we load Google Fonts for typography. No analytics or advertising cookies were identified in the reviewed source.',
      policy:'Cookies notice',
      accept:'Accept optional',
      reject:'Reject optional',
      configure:'Configure',
      essential:'Essential / technical',
      essentialDetail:'Language preferences, privacy choice and projects saved locally. Needed for features you request, not used for advertising.',
      active:'Always active',
      optional:'Optional: external fonts',
      optionalDetail:'Google Fonts (Google): loaded only with your permission; otherwise system fonts are used. An external resource, not an identified advertising cookie.',
      save:'Save selection',
      back:'Back',
      manage:'Cookie settings'
    }
  };
  let current=null, panel=null, toggle=null, config=false, trigger=null;
  function readSaved(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY));
      const age=Date.now()-data.at;
      if(data.version===VERSION && typeof data.googleFonts==='boolean' &&
         Number.isFinite(data.at) && age>=0 && age<LIFETIME)return data;
    }catch(e){}
    return null;
  }
  function lang(){return document.documentElement.lang.toLowerCase().startsWith('en')?'en':'es';}
  function text(){return translations[lang()];}
  function eligible(){return !!document.querySelector('meta[name="influnic-optional-fonts"]');}
  function loadOptionalFonts(){
    if(!eligible()||!current||!current.googleFonts||document.getElementById('influnic-consented-fonts'))return;
    const link=document.createElement('link');
    link.id='influnic-consented-fonts';
    link.rel='stylesheet';
    link.href=FONT_URL;
    document.head.appendChild(link);
  }
  function syncResources(previous){
    if(current && current.googleFonts){loadOptionalFonts();return;}
    const link=document.getElementById('influnic-consented-fonts');
    if(link){
      link.remove();
      // A reload drops previously applied downloaded font faces from this page's styling.
      if(previous && previous.googleFonts && eligible())location.reload();
    }
  }
  function store(value){
    const previous=current;
    current={version:VERSION,googleFonts:!!value,at:Date.now()};
    try{localStorage.setItem(KEY,JSON.stringify(current));}catch(e){}
    panel.hidden=true;
    syncResources(previous);
    updateTrigger();
  }
  function updateTrigger(){
    if(!trigger)return;
    trigger.textContent=text().manage;
    trigger.hidden=!current;
  }
  function updateText(){
    if(!panel)return;
    const t=text();
    panel.querySelectorAll('[data-consent-text]').forEach(el=>{
      el.textContent=t[el.dataset.consentText] || '';
    });
    panel.querySelectorAll('[data-consent-label]').forEach(el=>{
      el.textContent=t[el.dataset.consentLabel] || '';
    });
    updateTrigger();
  }
  function setConfig(visible){
    config=visible;
    panel.querySelector('[data-consent-summary]').hidden=visible;
    panel.querySelector('[data-consent-config]').hidden=!visible;
    if(visible){
      toggle.checked=!!(current && current.googleFonts);
      toggle.focus();
    }else{
      panel.querySelector('[data-consent-action="configure"]').focus();
    }
  }
  function open(settings){
    if(!panel)return;
    panel.hidden=false;
    setConfig(!!settings);
    if(!settings)panel.querySelector('[data-consent-action="reject"]').focus();
  }
  function injectStyles(){
    const style=document.createElement('style');
    style.id='influnic-consent-style';
    style.textContent=`
      .ics-panel[hidden],.ics-panel [hidden],.ics-manage[hidden]{display:none!important}
      .ics-panel{position:fixed;inset:auto 14px 14px;max-width:870px;margin:0 auto;padding:18px 22px 20px;z-index:2147483000;border:1px solid #ddd3e7;border-radius:16px;background:#fff;color:#251336;box-shadow:0 18px 65px #25133638;font:14px/1.55 Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif}
      .ics-panel *{box-sizing:border-box}
      .ics-panel h2{font-size:16px;line-height:1.35;color:#251336;margin:0 0 7px;font-weight:800}
      .ics-panel p{margin:0 0 11px;color:#51495d;font-size:13px}
      .ics-panel a{color:#6e21ae;text-decoration:underline}
      .ics-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:12px}
      .ics-actions button,.ics-manage{font:inherit;cursor:pointer}
      .ics-actions button{min-height:41px;border-radius:8px;padding:10px 14px;font-weight:750;font-size:13px}
      .ics-choice{flex:1;min-width:155px;background:#251336;color:#fff;border:1px solid #251336}
      .ics-choice:hover,.ics-choice:focus-visible{background:#5c3371}
      .ics-other{border:1px solid #afa1bf;background:#fff;color:#251336}
      .ics-other:hover{background:#f4eff7}
      .ics-prefs{border-top:1px solid #eee7f3;margin-top:11px;padding-top:12px}
      .ics-group{border:1px solid #e7dfec;border-radius:9px;padding:10px 12px;margin-bottom:9px}
      .ics-group-title{display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:750;color:#251336}
      .ics-group-title label{display:flex;align-items:center;gap:8px}
      .ics-panel input[type=checkbox]{width:17px;height:17px;accent-color:#9700ff}
      .ics-group p{font-size:12px;margin:5px 0 0}
      .ics-essential-label{font-size:11px;color:#5e5367;white-space:nowrap}
      .ics-manage{font-size:12px;border:1px solid #c8b9d4;background:#fff;color:#43334e;border-radius:7px;padding:6px 10px}
      .ics-manage:hover{background:#f5f0f8}
      .ics-manage-floating{position:fixed;bottom:8px;left:8px;z-index:2147482900;opacity:.86}
      @media(max-width:600px){.ics-panel{inset:auto 7px 7px;padding:14px 15px}.ics-actions{gap:7px}.ics-choice{min-width:calc(50% - 5px)}.ics-actions button{padding:9px 10px;font-size:12px}}
    `;
    document.head.appendChild(style);
  }
  function init(){
    if(document.getElementById('influnic-consent-panel'))return;
    current=readSaved();
    injectStyles();
    panel=document.createElement('aside');
    panel.id='influnic-consent-panel';
    panel.className='ics-panel';
    panel.hidden=true;
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','false');
    panel.setAttribute('aria-labelledby','ics-title');
    panel.innerHTML=`
      <h2 id="ics-title" data-consent-text="title">Privacidad y cookies</h2>
      <div data-consent-summary>
        <p data-consent-text="intro"></p>
        <a href="cookies.html" data-consent-text="policy">Política de cookies</a>
        <div class="ics-actions">
          <button type="button" class="ics-choice" data-consent-action="reject" data-consent-text="reject"></button>
          <button type="button" class="ics-choice" data-consent-action="accept" data-consent-text="accept"></button>
          <button type="button" class="ics-other" data-consent-action="configure" data-consent-text="configure"></button>
        </div>
      </div>
      <div class="ics-prefs" data-consent-config hidden>
        <div class="ics-group"><div class="ics-group-title"><span data-consent-text="essential"></span><span class="ics-essential-label" data-consent-text="active"></span></div><p data-consent-text="essentialDetail"></p></div>
        <div class="ics-group"><div class="ics-group-title"><label><input type="checkbox" data-consent-optional><span data-consent-label="optional"></span></label></div><p data-consent-text="optionalDetail"></p></div>
        <a href="cookies.html" data-consent-text="policy"></a>
        <div class="ics-actions">
          <button type="button" class="ics-choice" data-consent-action="save" data-consent-text="save"></button>
          <button type="button" class="ics-other" data-consent-action="back" data-consent-text="back"></button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    toggle=panel.querySelector('[data-consent-optional]');
    panel.addEventListener('click',e=>{
      const button=e.target.closest('[data-consent-action]');
      if(!button)return;
      const action=button.dataset.consentAction;
      if(action==='accept')store(true);
      if(action==='reject')store(false);
      if(action==='configure')setConfig(true);
      if(action==='save')store(toggle.checked);
      if(action==='back')setConfig(false);
    });
    trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='ics-manage';
    trigger.setAttribute('data-cookie-settings','');
    trigger.hidden=true;
    const footer=document.querySelector('footer');
    if(footer)(footer.querySelector('.footer-bottom, .footrow, .mt-8')||footer).appendChild(trigger);
    else{
      trigger.classList.add('ics-manage-floating');
      document.body.appendChild(trigger);
    }
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-cookie-settings]');
      if(b){e.preventDefault();open(true);}
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&!panel.hidden && current){panel.hidden=true;updateTrigger();}
    });
    new MutationObserver(updateText).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    // Keep consent and optional resources in sync when preferences change in another tab.
    window.addEventListener('storage',event=>{
      if(event.key!==KEY)return;
      const previous=current;
      current=readSaved();
      updateTrigger();
      syncResources(previous);
      if(current)panel.hidden=true;
      else open(false);
    });
    updateText();
    if(current)syncResources(null);
    else open(false);
  }
  window.InflunicCookieConsent={open:()=>open(true),get:()=>current?{essential:true,googleFonts:current.googleFonts}:null};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
