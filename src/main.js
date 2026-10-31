import './style.css';
import '@fontsource/league-spartan/latin-400.css';
import '@fontsource/league-spartan/latin-600.css';
import '@fontsource/league-spartan/latin-700.css';
import '@fontsource/league-spartan/latin-800.css';
import { geoMercator, geoPath, geoArea, select, zoom, zoomIdentity } from 'd3';
import { edgeKey, decode } from './algorithm.js';
import { scenarioWeights, randomGraph } from './weights.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:0}).format(n);
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const rail='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="15" rx="4"/><path d="M9 21l2-3m4 3-2-3M6 10h12M9 14h.01M15 14h.01"/></svg>';
const trash='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg>';
$('#app').innerHTML=`<main id="screens">
<section class="welcome" aria-label="Inicio"><div class="orb orb-one" aria-hidden="true"></div><div class="orb orb-two" aria-hidden="true"></div><div class="welcome-content"><h1>SILK NODE</h1><p>Planifica, conecta y optimiza rutas ferroviarias de manera inteligente.</p><button id="start" class="start">Empezar ${arrow}</button></div></section>
<section class="planner" id="planner-screen" aria-label="Planificador ferroviario" inert>
<header class="planner-head"><button id="home" class="wordmark" aria-label="Volver al inicio">${rail} SILK NODE</button></header>
<div class="workspace"><aside class="sidebar" aria-label="Red ferroviaria">
<section class="network-controls"><label class="map-selector">Mapa<select id="region" aria-label="Escenario geográfico"></select></label>
<div class="graph-actions" role="group" aria-label="Modo de construcción"><button id="manual">Manual</button><button id="connect">Conectar todo</button><button id="random-edges">Aleatorio</button></div>
<div id="mode-detail" class="mode-detail" role="status"></div>
<button id="solve" class="primary" disabled>Encontrar ruta óptima ${arrow}</button></section>
<section class="matrix-panel"><h2>Matriz de costos</h2><div id="matrix-content"></div></section>
<section class="cycle-panel"><div class="panel-title"><h2 id="cycle-title">Tu recorrido</h2><div class="result-tabs"><button id="current-tab" aria-pressed="true">Actual</button><button id="routes-tab" aria-pressed="false" disabled>Todos</button></div></div><div id="cycle-content"></div></section>
</aside><div class="map-column"><div class="map-wrap"><svg id="map" viewBox="0 0 1000 640" role="group" aria-label="Mapa interactivo de ciudades y conexiones"></svg>
<div class="map-top"><button id="help" class="info-button" aria-label="Información matemática" aria-expanded="false">i</button><span id="region-name">Cargando…</span></div>
<div id="help-popover" class="popover" hidden><div class="panel-title"><h2>Cómo funciona</h2><button id="close-help" aria-label="Cerrar información">×</button></div><div id="help-content"></div><div class="pagination"><button id="help-prev" aria-label="Información anterior">←</button><span id="help-page"></span><button id="help-next" aria-label="Información siguiente">→</button></div></div>
<div class="zoom-controls"><button id="zoom-in" aria-label="Acercar mapa">+</button><button id="zoom-out" aria-label="Alejar mapa">−</button><button id="zoom-reset" aria-label="Restablecer mapa">⌖</button></div>
<button id="clear-map" class="clear-map" title="Limpiar mapa" aria-label="Limpiar mapa">${trash}</button>
<div id="map-tooltip" class="map-tooltip" hidden></div><div id="notice" role="status" aria-live="polite" hidden></div><progress id="progress" max="100" value="0" hidden></progress>
<div class="map-footer"><span id="map-summary">0/10 ciudades</span><span><i></i> Circuito activo</span></div></div>
<div class="route-navigation"><button id="prev" disabled>← Ciclo anterior</button><span id="cycle-count"></span><button id="next" disabled>Siguiente ciclo →</button></div>
</div></div></section></main>`;
let regions,world,subdivisions,region='china',selected=[],edges=new Set(),mode='';
let weights={},defaultWeights={},manualWeights={},seed=1,result=null,worker=null,busy=false,analysisTimer=null,currentRoute=null,currentIndex=null,manualStart=null,trainFrame=null;
let bestVisited=Infinity,globalShown=false,exploreMode=false,step=0,phase=-1,routePage=0,resultTab='current',suggestionPage=0,helpPage=0,pendingAction=null;
const boxes={china:[73,17,136,54],europe:[-13,34,37,71],usa:[-127,24,-66,51],russia:[27,40,191,79],peru:[-82,-19,-68,1]};
const baseMapCache={},subdivisionCache={},ns='http://www.w3.org/2000/svg';
let projection,zoomBehavior,transform=zoomIdentity,mapWidth=1000,mapHeight=640,fitRequested=true,edgeLabels=[],cityLabels=[];
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const city=id=>regions[region].cities.find(c=>c.id===id),chosen=()=>selected.map(city);
const cost=(a,b)=>a.id===b.id?0:weights[edgeKey(a.id,b.id)];
const routeCities=idx=>decode(result.codes[idx],selected.length).map(i=>city(selected[i]));
let noticeTimer;
function notice(text,error=false){clearTimeout(noticeTimer);$('#notice').textContent=text;$('#notice').hidden=!text;$('#notice').classList.toggle('error',error);if(text&&!error)noticeTimer=setTimeout(()=>$('#notice').hidden=true,3200);}
function invalidate(){
 clearTimeout(analysisTimer);worker?.terminate();worker=null;busy=false;result=null;currentRoute=null;currentIndex=null;bestVisited=Infinity;globalShown=false;exploreMode=false;phase=-1;step=0;routePage=0;suggestionPage=0;pendingAction=null;
 cancelAnimationFrame(trainFrame);$('#progress').hidden=true;notice('');
}
function complete(){edges.clear();for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++)edges.add(edgeKey(selected[i],selected[j]));}
function applyMode(){if(selected.length<5)return;if(mode==='all')complete();if(mode==='random')edges=new Set(randomGraph(selected,seed).edges);}
function setMode(next){invalidate();mode=next;manualStart=null;if(next==='random')seed=crypto.getRandomValues(new Uint32Array(1))[0];applyMode();fitRequested=selected.length>=5;refresh();}
function refresh(schedule=true){
 if(!regions)return;
 weights=mode==='manual'?{...defaultWeights,...manualWeights}:defaultWeights;
 for(const [id,value] of [['manual','manual'],['connect','all'],['random-edges','random']]){$('#'+id).classList.toggle('active',mode===value);$('#'+id).setAttribute('aria-pressed',mode===value);}
 const hint=!mode?'Elige un modo.':selected.length<5?`Selecciona ${5-selected.length} ciudad${selected.length===4?'':'es'} más en el mapa.`:mode==='manual'?'Pulsa una casilla para conectar y editar su costo (1–99).':mode==='random'?'Pulsa Aleatorio para generar otra red.':'';
 $('#mode-detail').textContent=hint;$('#mode-detail').hidden=!hint;
 $('#map-summary').textContent=`${selected.length}/10 ciudades`;
 $('#solve').disabled=selected.length<5||!mode;
 renderMatrix();renderCycle();renderNavigation();renderMap();
 if(schedule&&selected.length>=5&&mode){clearTimeout(analysisTimer);analysisTimer=setTimeout(()=>analyze(),140);}
}
function toggleCity(id){
 if(!mode){notice('Elige Manual, Conectar todo o Aleatorio.',true);return;}
 if(!selected.includes(id)&&selected.length===10){notice('Máximo 10 ciudades. Mayús + clic para quitar una.',true);return;}
 invalidate();selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
 selected.sort((a,b)=>regions[region].cities.findIndex(c=>c.id===a)-regions[region].cities.findIndex(c=>c.id===b));
 edges=new Set([...edges].filter(k=>k.split('|').every(id=>selected.includes(id))));manualStart=null;applyMode();refresh();
}
function clickCity(id,event={}){
 if(event.shiftKey){toggleCity(id);return;}
 if(mode==='manual'&&selected.includes(id)&&selected.length>=5){
  if(manualStart===id){manualStart=null;renderMap();return;}
  if(!manualStart){manualStart=id;renderMap();return;}
  const key=edgeKey(manualStart,id);invalidate();edges.has(key)?edges.delete(key):edges.add(key);manualStart=null;refresh();
 }else toggleCity(id);
}
function renderMatrix(){
 const cs=chosen(),panel=$('.matrix-panel');
 panel.hidden=cs.length<5;
 // Keep the reserved row so the results panel does not jump before selection.
 if(cs.length<5){$('#matrix-content').replaceChildren();return;}
 $('#matrix-content').innerHTML=`<table class="matrix"><thead><tr><th aria-label="Ciudad"></th>${cs.map((c,i)=>`<th title="${c.name}">${i+1}</th>`).join('')}</tr></thead><tbody>${cs.map((a,i)=>`<tr><th title="${a.name}">${i+1}</th>${cs.map((b,j)=>{
  const key=edgeKey(a.id,b.id),filled=i!==j&&edges.has(key),label=`${a.name} a ${b.name}`;
  let content=filled?cost(a,b):'';
  if(mode==='manual'&&i!==j)content=filled?`<input class="matrix-cost" data-cost="${key}" aria-label="Costo ${label}" inputmode="numeric" maxlength="2" value="${cost(a,b)}" autocomplete="off" spellcheck="false">`:`<button class="matrix-activate" data-activate="${key}" data-row="${i}" data-column="${j}" aria-label="Conectar ${label}"></button>`;
  return `<td class="${filled?'connected':'unavailable'}" title="${label}${i===j?': misma ciudad':filled?': costo en M USD':': sin enlace'}">${content}</td>`;
 }).join('')}</tr>`).join('')}</tbody></table>`;
 $$('[data-activate]').forEach(button=>button.onclick=()=>{
  const key=button.dataset.activate,row=+button.dataset.row,column=+button.dataset.column;
  invalidate();edges.add(key);manualStart=null;refresh();
  const input=$('.matrix').rows[row+1].cells[column+1].querySelector('input');input.focus({preventScroll:true});input.select();
 });
 $$('[data-cost]').forEach(input=>{
  input.onfocus=()=>input.select();
  input.oninput=()=>{
   const valid=/^[1-9][0-9]?$/.test(input.value);
   input.setAttribute('aria-invalid',String(!valid));
   if(!valid){notice('Introduce un número entero entre 1 y 99.',true);return;}
   const key=input.dataset.cost,value=Number(input.value);
   if(value===weights[key]){notice('');return;}
   invalidate();manualWeights[key]=value;weights[key]=value;
   $$('[data-cost]').filter(other=>other!==input&&other.dataset.cost===key).forEach(other=>{other.value=String(value);other.setAttribute('aria-invalid','false');});
   renderCycle();renderNavigation();renderMap();
   analysisTimer=setTimeout(()=>analyze(),140);
  };
  input.onblur=()=>{if(!/^[1-9][0-9]?$/.test(input.value)){input.value=String(weights[input.dataset.cost]);input.setAttribute('aria-invalid','false');notice('Se conservó el último costo válido (1–99).');}};
  input.onkeydown=e=>{if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();input.blur();}};
 });
}
function setRegion(key){invalidate();region=key;selected=[];edges.clear();mode='';manualStart=null;defaultWeights=scenarioWeights(regions[key].cities);manualWeights={};weights=defaultWeights;transform=zoomIdentity;fitRequested=true;$('#region').value=key;$('#region-name').textContent=regions[key].name;refresh(false);}
function analyze(action=null){
 if(selected.length<5||!mode)return;
 if(action)pendingAction=action;
 if(result){performAction(action);return;}
 if(busy)return;
 clearTimeout(analysisTimer);busy=true;$('#progress').hidden=false;$('#progress').value=0;renderNavigation();renderCycle();
 const job=new Worker(new URL('./solver.worker.js',import.meta.url),{type:'module'});worker=job;
 job.onmessage=({data})=>{
  if(worker!==job)return;
  if(data.type==='progress'){$('#progress').value=data.done/data.total*100;return;}
  if(data.type==='error'){invalidate();refresh(false);notice(data.message,true);return;}
  result=data.result;job.terminate();worker=null;busy=false;$('#progress').hidden=true;const action=pendingAction;pendingAction=null;
  renderCycle();renderNavigation();if(action)performAction(action);
 };
 job.onerror=()=>{if(worker!==job)return;invalidate();refresh(false);notice('No se pudo evaluar la red. Pulsa Encontrar ruta óptima para reintentar.',true);};
 job.postMessage({cities:chosen(),edges:[...edges],matrix:chosen().map(a=>chosen().map(b=>cost(a,b)))});
}
function performAction(action){
 if(action==='best'&&result?.sorted.length){globalShown=true;fitRequested=true;showCycle(result.sorted[0]);}
 else if(action==='next'&&result?.lexicographic.length)showCycle(result.lexicographic[0]);
 else if(action==='step'&&result?.lexicographic.length){step=0;phase=0;showAttempt();}
 else{renderCycle();renderNavigation();}
}
function recordVisit(idx){if(Number.isFinite(result.costs[idx]))bestVisited=Math.min(bestVisited,result.costs[idx]);}
function showCycle(idx){if(!result||!Number.isFinite(result.costs[idx]))return;notice('');exploreMode=false;currentIndex=idx;currentRoute=routeCities(idx);recordVisit(idx);resultTab='current';renderCycle();renderNavigation();renderMap();}
function renderNavigation(){
 const ids=result?.lexicographic,pos=ids?ids.indexOf(currentIndex):-1;
 $('#prev').disabled=!ids||pos<=0;$('#next').disabled=!ids?.length||pos>=ids.length-1;
 $('#routes-tab').disabled=!ids?.length;
 $('#cycle-count').textContent=busy?'Evaluando…':ids?.length?(pos<0?`${fmt(ids.length)} ciclo${ids.length===1?'':'s'}`:`${fmt(pos+1)} / ${fmt(ids.length)}`):'';
}
function renderCycle(){
 const panel=$('#cycle-content');$('#current-tab').setAttribute('aria-pressed',resultTab==='current');$('#routes-tab').setAttribute('aria-pressed',resultTab==='all');
 $('#cycle-title').textContent=exploreMode?'Paso a paso':'Tu recorrido';
 if(!result){panel.innerHTML=busy?'<div class="pending" aria-label="Evaluando recorridos"></div>':'';return;}
 if(!result.lexicographic.length){
  const pages=Math.ceil(result.suggestion.length/3),chunk=result.suggestion.slice(suggestionPage*3,suggestionPage*3+3);
  panel.innerHTML=`<p class="no-cycle">Faltan ${result.suggestion.length} enlace${result.suggestion.length===1?'':'s'} para completar un circuito.</p><div class="suggestions">${chunk.map(k=>k.split('|').map(id=>city(id).name).join(' ↔ ')).join('<br>')}</div><div class="pagination"><button id="suggest-prev" ${suggestionPage===0?'disabled':''} aria-label="Sugerencias anteriores">←</button><button id="add-suggestions">Añadir ${result.suggestion.length} enlace${result.suggestion.length===1?' mínimo':'s mínimos'}</button><button id="suggest-next" ${suggestionPage>=pages-1?'disabled':''} aria-label="Sugerencias siguientes">→</button></div>`;
  $('#suggest-prev').onclick=()=>{suggestionPage--;renderCycle();};$('#suggest-next').onclick=()=>{suggestionPage++;renderCycle();};
  $('#add-suggestions').onclick=()=>{const add=[...result.suggestion];invalidate();add.forEach(k=>edges.add(k));refresh();};return;
 }
 if(resultTab==='all'){
  const ids=result.lexicographic,size=3,start=routePage*size;
  panel.innerHTML=`<div class="routes-list">${Array.from(ids.slice(start,start+size)).map((idx,i)=>`<button data-route="${idx}" title="${routeCities(idx).map(c=>c.name).join(' → ')}"><span>${start+i+1}. ${decode(result.codes[idx],selected.length).map(i=>i+1).join('–')}</span><b>${fmt(result.costs[idx])}</b></button>`).join('')}</div><div class="pagination"><button id="route-prev" ${routePage===0?'disabled':''} aria-label="Página anterior de ciclos">←</button><span>${routePage+1}/${Math.ceil(ids.length/size)}</span><button id="route-next" ${(routePage+1)*size>=ids.length?'disabled':''} aria-label="Página siguiente de ciclos">→</button></div>`;
  $$('[data-route]').forEach(b=>b.onclick=()=>showCycle(+b.dataset.route));$('#route-prev').onclick=()=>{routePage--;renderCycle();};$('#route-next').onclick=()=>{routePage++;renderCycle();};return;
 }
 if(exploreMode){renderAttempt();return;}
 let content='';
 if(currentIndex!==null){const route=routeCities(currentIndex),value=result.costs[currentIndex];content=`<div class="cost-line"><strong>${fmt(value)}<small> M USD</small></strong><span>${globalShown&&value===result.best?'Ruta óptima':'Ciclo actual'}</span></div><p class="route-names">${route.map(c=>c.name).join(' → ')}</p><p class="route-sum">${route.slice(1).map((c,i)=>cost(route[i],c)).join(' + ')} = ${fmt(value)}</p><div class="best-summary">Mejor visitado: <b>${fmt(bestVisited)}</b></div>`;}
 panel.innerHTML=content+'<div class="step-actions"><button id="next-step">Siguiente paso →</button></div>';
 $('#next-step').onclick=()=>{step=currentIndex??0;phase=0;showAttempt();};
}
function showAttempt(){notice('');exploreMode=true;resultTab='current';currentIndex=step;currentRoute=routeCities(step);renderCycle();renderNavigation();renderMap();}
function renderAttempt(){
 const route=routeCities(step),missing=route.slice(1).filter((c,i)=>!edges.has(edgeKey(route[i].id,c.id))),sum=result.costs[step];
 if(phase===3)recordVisit(step);
 const description=['Generamos este orden y volvemos al origen.',missing.length?`Faltan ${missing.length} enlaces.`:'Todos los enlaces existen.',missing.length?'Circuito incompleto: no se suma.':`${route.slice(1).map((c,i)=>cost(route[i],c)).join(' + ')} = ${fmt(sum)} M USD`,missing.length?'Descartamos este orden.':`Mejor visitado: ${fmt(bestVisited)} M USD.`];
 $('#cycle-content').innerHTML=`<div class="step-label"><b>${['1. Generar','2. Comprobar','3. Sumar','4. Comparar'][phase]}</b><span>${fmt(step+1)}/${fmt(result.total)}</span></div><p class="route-names">${route.map(c=>c.name).join(' → ')}</p><p class="step-explanation">${description[phase]}</p><div class="step-actions"><button id="previous-step" ${step===0&&phase===0?'disabled':''}>← Paso anterior</button><button id="next-step" ${step===result.total-1&&phase===3?'disabled':''}>Siguiente paso →</button></div>`;
 $('#previous-step').onclick=()=>{if(phase)phase--;else{step--;phase=3;}showAttempt();};$('#next-step').onclick=()=>{if(phase<3)phase++;else if(step<result.total-1){step++;phase=0;}showAttempt();};
}
function svgEl(tag,attrs,parent,text){const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;parent.appendChild(el);return el;}

function fitCities() {
  const points=(selected.length>=5?chosen():regions[region].cities).map(c=>projection([c.lon,c.lat]));
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  const k=Math.max(.7,Math.min(7,(mapWidth-100)/Math.max(1,right-left),(mapHeight-150)/Math.max(1,bottom-top)));
  transform=zoomIdentity.translate(mapWidth/2-k*(left+right)/2,mapHeight/2+10-k*(top+bottom)/2).scale(k);
  fitRequested=false;
}
function layoutLabels() {
  const k=transform.k, occupied=[];
  for(const {element,c,on,g} of cityLabels){
    for(const circle of g.querySelectorAll("circle"))circle.setAttribute("r",(circle.getAttribute("fill")==="none"?12:10)/k);
    const marker=g.querySelector("rect"),size=(on?9:6)/k;
    marker.setAttribute("x",-size/2);marker.setAttribute("y",-size/2);marker.setAttribute("width",size);marker.setAttribute("height",size);marker.setAttribute("rx",size/2);marker.setAttribute("stroke-width",2/k);
    const [x,y]=transform.apply(projection([c.lon,c.lat]));
    element.setAttribute('font-size',(on?13:11)/k);
    element.setAttribute('x',9/k);element.setAttribute('y',-8/k);
    element.setAttribute('stroke-width',3/k);
    occupied.push({x:x+8,y:y-21,w:Math.min(120,c.name.length*6.5+16),h:15});
  }
  for(const record of edgeLabels){
    const {element,x1,y1,x2,y2}=record;
    const [ax,ay]=transform.apply([x1,y1]),[bx,by]=transform.apply([x2,y2]);
    const len=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/len,ny=(bx-ax)/len;
    let best=null;
    for(const t of [.5,.35,.65,.2,.8])for(const offset of [-7,9,-18,20]){
      const x=ax+(bx-ax)*t+nx*offset,y=ay+(by-ay)*t+ny*offset;
      const box={x:x-11,y:y-10,w:22,h:17};
      const overlap=occupied.reduce((sum,b)=>sum+(box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y?1:0),0);
      const score=overlap*100+Math.abs(t-.5)*10+Math.abs(offset)*.1;
      if(!best||score<best.score)best={x,y,box,score};
    }
    occupied.push(best.box);
    const [x,y]=transform.invert([best.x,best.y]);
    element.setAttribute('x',x);element.setAttribute('y',y);
    element.setAttribute('font-size',Math.min(17,12*Math.pow(k,.15))/k);
    element.setAttribute('stroke-width',4/k);
  }
}
function setupProjection() {
  const [w, s, e, n] = boxes[region],
    center = (w + e) / 2;
  projection = geoMercator()
    .rotate([-center, 0])
    .center([0, (s + n) / 2])
    .translate([0, 0])
    .scale(1);
  const p = projection([w, s]),
    q = projection([e, n]);
  const scale = Math.min(
    (mapWidth-80) / Math.abs(q[0] - p[0]),
    (mapHeight-90) / Math.abs(q[1] - p[1]),
  );
  projection.scale(scale);
  const pp = projection([w, s]),
    qq = projection([e, n]);
  projection
    .translate([mapWidth/2 - (pp[0] + qq[0]) / 2, mapHeight/2 - (pp[1] + qq[1]) / 2])
    .clipExtent([
      [0, 0],
      [mapWidth, mapHeight],
    ]);
}
function renderMap() {
  if (!world) return;
  cancelAnimationFrame(trainFrame);
  const svg = $("#map");
  svg.replaceChildren();
  const rect=$('.map-wrap').getBoundingClientRect();
  if(rect.width<1||rect.height<1)return;
  const w=Math.round(rect.width),h=Math.round(rect.height);
  if(w!==mapWidth||h!==mapHeight){mapWidth=w;mapHeight=h;Object.keys(baseMapCache).forEach(k=>delete baseMapCache[k]);Object.keys(subdivisionCache).forEach(k=>delete subdivisionCache[k]);fitRequested=true;}
  svg.setAttribute('viewBox',`0 0 ${mapWidth} ${mapHeight}`);
  edgeLabels=[];cityLabels=[];
  setupProjection();
  if(fitRequested)fitCities();
  const defs = svgEl("defs", {}, svg);
  const pattern = svgEl(
    "pattern",
    { id: "grid", width: 32, height: 32, patternUnits: "userSpaceOnUse" },
    defs,
  );
  svgEl(
    "path",
    { d: "M32 0H0V32", fill: "none", stroke: "#2c302a", "stroke-width": ".6" },
    pattern,
  );
  svgEl("rect", { width: mapWidth, height: mapHeight, fill: "#192126" }, svg);
  
  const viewport = svgEl(
    "g",
    { id: "viewport", transform: transform.toString() },
    svg,
  );
  const geo = svgEl("g", {}, viewport),
    path = geoPath(projection);
  if (!baseMapCache[region])
    baseMapCache[region] = world.features
      .map((f) => ({
        d: path(f),
        name: f.properties.ADMIN,
        continent: f.properties.CONTINENT,
      }))
      .filter((f) => f.d);
  for (const f of baseMapCache[region])
    svgEl(
      "path",
      {
        d: f.d,
        fill:
          {
            china: "China",
            usa: "United States of America",
            russia: "Russia",
            peru: "Peru",
          }[region] === f.name ||
          (region === "europe" && f.continent === "Europe")
            ? "#309bb3"
            : "#263d44",
        stroke: "#192126",
        "stroke-width": ".7",
        "vector-effect": "non-scaling-stroke",
      },
      geo,
    );
  if (!subdivisionCache[region])
    subdivisionCache[region] = subdivisions.features
      .map((f) => path(f))
      .filter(Boolean);
  for (const d of subdivisionCache[region])
    svgEl(
      "path",
      {
        d,
        fill: "none",
        stroke: "#192126",
        "stroke-width": 0.45,
        opacity: 0.55,
        "vector-effect": "non-scaling-stroke",
        "pointer-events": "none",
      },
      geo,
    );
  const routeSet = new Set();
  if (currentRoute)
    for (let i = 1; i < currentRoute.length; i++)
      routeSet.add(edgeKey(currentRoute[i - 1].id, currentRoute[i].id));
  const linkGroup = svgEl("g", {}, viewport);
  for (const key of edges) {
    const [a, b] = key.split("|").map(city);
    if (!a || !b) continue;
    const [x1, y1] = projection([a.lon, a.lat]),
      [x2, y2] = projection([b.lon, b.lat]);
    const active = routeSet.has(key);
    const line = svgEl(
      "line",
      {
        x1,
        y1,
        x2,
        y2,
        stroke: active ? "#e1201d" : "#fcba15",
        "stroke-width": active ? 2.8 : 1.2,
        opacity: currentRoute && !active ? 0.18 : 0.62,
        "vector-effect": "non-scaling-stroke",
      },
      linkGroup,
    );
    const hit = svgEl(
      "line",
      {
        x1,
        y1,
        x2,
        y2,
        stroke: "transparent",
        "stroke-width": 14,
        "vector-effect": "non-scaling-stroke",
        role: "img",
        "aria-label": `${a.name} a ${b.name}, ${fmt(cost(a, b))} millones de dólares simulados`,
      },
      linkGroup,
    );
    const tip = `${a.name} ↔ ${b.name} · ${fmt(cost(a, b))} M USD`;
    hit.addEventListener("pointermove", (e) => showTip(e, tip));
    hit.addEventListener("pointerleave", hideTip);


    {
      const label = svgEl(
        "text",
        {
          x: (x1 + x2) / 2,
          y: (y1 + y2) / 2 - 4,
          fill: active ? "#fcba15" : "#d4ddcf",
          "font-size": 10,
          "font-family": "League Spartan, sans-serif",
          "text-anchor": "middle",
          stroke: "#192126",
          "stroke-width": 3,
          "paint-order": "stroke",
          "pointer-events": "none",
        },
        linkGroup,
        `${fmt(cost(a, b))}`,
      );
      edgeLabels.push({element:label,x1,y1,x2,y2});
    }
  }
  if (currentRoute) {
    const points = currentRoute.map((c) => projection([c.lon, c.lat]));
    const missingSegments = currentRoute
      .slice(1)
      .map((c, i) => !edges.has(edgeKey(currentRoute[i].id, c.id)));
    const hasMissing = missingSegments.some(Boolean);
    missingSegments.forEach((missing, i) => {
      if (missing)
        svgEl(
          "line",
          {
            x1: points[i][0],
            y1: points[i][1],
            x2: points[i + 1][0],
            y2: points[i + 1][1],
            stroke: "#e1201d",
            "stroke-width": 2,
            "stroke-dasharray": "6 5",
            "vector-effect": "non-scaling-stroke",
            "pointer-events": "none",
          },
          viewport,
        );
    });
    const route = svgEl(
      "path",
      {
        id: "active-route",
        d: hasMissing
          ? points
              .slice(1)
              .map((p, i) =>
                missingSegments[i]
                  ? ""
                  : `M${points[i][0]},${points[i][1]}L${p[0]},${p[1]}`,
              )
              .join(" ")
          : points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" "),
        fill: "none",
        stroke: "#e1201d",
        "stroke-width": 3,
        "vector-effect": "non-scaling-stroke",
        "pointer-events": "none",
      },
      viewport,
    );
    if (!reduced() && !hasMissing && !exploreMode) {
      const len = route.getTotalLength();
      route.animate(
        [
          { strokeDasharray: len, strokeDashoffset: len },
          { strokeDasharray: len, strokeDashoffset: 0 },
        ],
        { duration: 1300, easing: "ease-out" },
      );
      const train = svgEl(
        "g",
        { id: "train", "pointer-events": "none" },
        viewport,
      );
      svgEl(
        "path",
        {
          d: "M-6 -8H6Q9 -8 9 -5V5Q9 8 6 8H-6Q-9 8 -9 5V-5Q-9 -8 -6 -8ZM-5 8L-7 11M5 8L7 11",
          fill: "#fcba15",
          stroke: "#192126",
          "stroke-width": 1.5,
        },
        train,
      );
      svgEl(
        "path",
        { d: "M-6 -4H-1V1H-6ZM2 -4H7V1H2Z", fill: "#192126" },
        train,
      );
      const start = performance.now() + 1300;
      function animate(now) {
        const pos = route.getPointAtLength(
          ((Math.max(0, now - start) % 12000) / 12000) * len,
        );
        train.setAttribute("transform", `translate(${pos.x},${pos.y}) scale(${1/transform.k})`);
        if (!document.hidden && document.body.classList.contains("planning")) trainFrame = requestAnimationFrame(animate);
      }
      trainFrame = requestAnimationFrame(animate);
    }
  }
  for (const c of regions[region].cities) {
    const [x, y] = projection([c.lon, c.lat]),
      on = selected.includes(c.id);
    const g = svgEl(
      "g",
      {
        transform: `translate(${x},${y})`,
        class: "map-city",
        tabindex: 0,
        role: "button",
        "aria-label": `${c.name}${on ? ", seleccionada" : ""}`,
        "aria-pressed": on,
      },
      viewport,
    );
    if (selected[0] === c.id)
      svgEl(
        "circle",
        {
          r: 12,
          fill: "none",
          stroke: "#fcba15",
          "stroke-width": 1,
          "pointer-events": "none",
        },
        g,
      );
    svgEl("circle", { r: 6, fill: "transparent" }, g);
    svgEl(
      "rect",
      {
        x: on ? -4 : -3,
        y: on ? -4 : -3,
        rx: 4,
        width: on ? 8 : 6,
        height: on ? 8 : 6,
        fill: manualStart === c.id ? "#ffffff" : on ? "#fcba15" : "#d5eff4",
        stroke: "#192126",
        "stroke-width": 2,
      },
      g,
    );
    const label=svgEl(
      "text",
      {
        x: 10,
        y: -9,
        "pointer-events": "none",
        fill: on ? "#ffffff" : "#ffffff",
        "font-size": on ? 13 : 10,
        "font-family": "League Spartan, sans-serif",
        stroke: "#192126",
        "stroke-width": 3,
        "paint-order": "stroke",
      },
      g,
      (on ? `${selected.indexOf(c.id)+1}. ` : "") + c.name,
    );
    cityLabels.push({element:label,c,on,g});
    const click = event => clickCity(c.id,event);
    g.onclick = click;
    g.onkeydown = e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();click(e);} };
  }
  zoomBehavior = zoom()
    .scaleExtent([.7, 12])
    .extent([
      [0, 0],
      [mapWidth, mapHeight],
    ])
    .on("zoom", (e) => {
      transform = e.transform;
      viewport.setAttribute("transform", transform.toString());
      layoutLabels();
    });
  select(svg).call(zoomBehavior).on("dblclick.zoom", null);
  select(svg).call(zoomBehavior.transform, transform);
}
function showTip(e, text) {
  const r = $(".map-wrap").getBoundingClientRect(),
    t = $("#map-tooltip");
  t.textContent = text;
  t.hidden = false;
  t.style.left = `${Math.min(e.clientX - r.left + 12, r.width - 250)}px`;
  t.style.top = `${Math.max(8, e.clientY - r.top - 38)}px`;
}
function hideTip() {
  $("#map-tooltip").hidden = true;
}
const helpSections=[
 ['La red ferroviaria','Buscamos el circuito más barato que visite todas tus ciudades y regrese al inicio. Cada mapa conserva sus 20 ciudades; selecciona entre 5 y 10 directamente en el mapa.'],
 ['Construir y limpiar','Elige primero un modo. Manual: selecciona las ciudades y luego pulsa dos ciudades elegidas para añadir o quitar su enlace. Conectar todo une cada pareja; Aleatorio crea enlaces con probabilidad 50 %. Mayús + clic permite quitar una ciudad en cualquier modo. La papelera limpia todo el mapa.'],
 ['Costos','El costo por defecto es de 1 a 90 millones de dólares simulados. Solo en Manual puedes cambiarlo por un entero entre 1 y 99 desde la matriz. Al cambiar de modo se usan los costos por defecto; tus cambios se recuperan al volver a Manual. Combinamos distancia, un factor simulado de dificultad por corredor y una inversión fija. Los parámetros son reproducibles: no cambian al pulsar Aleatorio ni se ajustan para forzar un recorrido ganador. No son presupuestos ferroviarios reales.'],
 ['Matriz','Los números de fila y columna corresponden a las ciudades numeradas del mapa. Cada valor es el costo de viajar entre ambas. Una casilla carbón significa misma ciudad o ausencia de conexión. La matriz aparece a partir de cinco ciudades. En Manual, pulsa una casilla carbón fuera de la diagonal para activar el enlace con su costo por defecto y escribe para modificarlo (1–99). La casilla simétrica y el mapa se actualizan juntos. Para eliminar una arista, pulsa sus dos extremos en el mapa.'],
 ['Fuerza bruta','Fijamos la primera ciudad del orden del catálogo y enumeramos las permutaciones en orden lexicográfico. Comprobamos cada enlace, incluido el regreso; sumamos los costos y comparamos. Una ruta y su inversa se cuentan una sola vez.'],
 ['Exploración','Al conectar tu red evaluamos sus ciclos en segundo plano. Si hay ciclos, puedes usar Siguiente ciclo o Siguiente paso directamente. Las cuatro fases son generar, comprobar, sumar y comparar. Mejor visitado conserva el mínimo de los ciclos que ya has visto, incluso al retroceder. Encontrar ruta óptima revela el mínimo global.'],
 ['Cantidad de ciclos y reparación','En un grafo completo hay (n − 1)! / 2 ciclos únicos: 12 con cinco ciudades y 181 440 con diez. Si no hay un ciclo válido, proponemos el menor número de enlaces nuevos que permita formar uno. La sugerencia minimiza cantidad de aristas, no inversión.'],
 ['Datos y controles','Cartografía y ciudades: Natural Earth. D3 dibuja el mapa; la búsqueda exhaustiva es código propio y se ejecuta en un Web Worker. La rueda sobre el mapa controla el zoom. Fuera del mapa, el scroll permite pasar entre portada y planificador.']
];
function renderHelp(){const [title,text]=helpSections[helpPage];$('#help-content').innerHTML=`<h3>${title}</h3><p>${text}</p>`;$('#help-page').textContent=`${helpPage+1}/${helpSections.length}`;$('#help-prev').disabled=helpPage===0;$('#help-next').disabled=helpPage===helpSections.length-1;}
let screenLock=0;
function showScreen(planning){document.body.classList.toggle('planning',planning);$('.welcome').inert=planning;$('.planner').inert=!planning;screenLock=performance.now()+800;if(planning){$('#home').focus({preventScroll:true});if(world)renderMap();}else{cancelAnimationFrame(trainFrame);$('#start').focus({preventScroll:true});}}
$('#start').onclick=()=>showScreen(true);$('#home').onclick=()=>showScreen(false);
let wheelSum=0,wheelTime=0;
document.addEventListener('wheel',e=>{
 if(e.target.closest('.map-wrap')||e.ctrlKey)return;
 e.preventDefault();if(performance.now()<screenLock)return;
 if(performance.now()-wheelTime>200)wheelSum=0;wheelTime=performance.now();wheelSum+=e.deltaY;
 if(Math.abs(wheelSum)<65)return;
 if(wheelSum<0&&document.body.classList.contains('planning'))showScreen(false);
 else if(wheelSum>0&&!document.body.classList.contains('planning'))showScreen(true);
 wheelSum=0;
},{passive:false});
$('#region').onchange=e=>setRegion(e.target.value);
$('#manual').onclick=()=>setMode('manual');$('#connect').onclick=()=>setMode('all');$('#random-edges').onclick=()=>setMode('random');
$('#clear-map').onclick=()=>{invalidate();selected=[];edges.clear();manualWeights={};manualStart=null;fitRequested=true;refresh(false);};
$('#solve').onclick=()=>analyze('best');
$('#prev').onclick=()=>{const pos=result?.lexicographic.indexOf(currentIndex)??-1;if(pos>0)showCycle(result.lexicographic[pos-1]);};
$('#next').onclick=()=>{const ids=result?.lexicographic,pos=ids?.indexOf(currentIndex)??-1;if(ids&&pos<ids.length-1)showCycle(ids[pos+1]);};
$('#current-tab').onclick=()=>{resultTab='current';renderCycle();};$('#routes-tab').onclick=()=>{exploreMode=false;resultTab='all';renderCycle();};
$('#help').onclick=()=>{const open=$('#help-popover').hidden;$('#help-popover').hidden=!open;$('#help').setAttribute('aria-expanded',open);renderHelp();};
$('#close-help').onclick=()=>{$('#help-popover').hidden=true;$('#help').setAttribute('aria-expanded','false');$('#help').focus({preventScroll:true});};
$('#help-prev').onclick=()=>{helpPage--;renderHelp();};$('#help-next').onclick=()=>{helpPage++;renderHelp();};
$('#zoom-in').onclick=()=>{if(zoomBehavior)select($('#map')).call(zoomBehavior.scaleBy,1.4);};$('#zoom-out').onclick=()=>{if(zoomBehavior)select($('#map')).call(zoomBehavior.scaleBy,1/1.4);};$('#zoom-reset').onclick=()=>{fitRequested=true;renderMap();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#help-popover').hidden=true;$('#help').setAttribute('aria-expanded','false');manualStart=null;if(world)renderMap();}});
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(world)renderMap();},100);}).observe($('.map-wrap'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(trainFrame);else if(world&&document.body.classList.contains('planning'))renderMap();});
try{
 [regions,world,subdivisions]=await Promise.all(['/data/cities.json','/data/world.geojson','/data/subdivisions.geojson'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error(`No se pudo cargar ${u}`);return r.json();}));
 for(const f of world.features)if(geoArea(f)>2*Math.PI){const g=f.geometry;if(g.type==='Polygon')g.coordinates.forEach(r=>r.reverse());else if(g.type==='MultiPolygon')g.coordinates.forEach(p=>p.forEach(r=>r.reverse()));}
 $('#region').innerHTML=['china','europe','usa','russia','peru'].map(k=>`<option value="${k}">${regions[k].name}</option>`).join('');setRegion('china');
}catch(e){notice(`${e.message}. Recarga la página.`,true);$('#region-name').textContent='Mapa no disponible';}
