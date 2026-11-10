/* =====================================================================
 * 안부 — 군 주거 지원 (급지별 전세 지원 한도 · 주택수당 월세 예산 · 예산 안 매물 검색)
 * 매물은 시연용 예시 데이터를 기준 위치 주변에 만들어 보여줘요. 실제 매물이 아니에요.
 * ===================================================================== */
(function(){
const $=s=>document.querySelector(s);
const H=(window.ANBU_CONFIG||{}).housing;
const BASES=window.ANBU_BASES;
const fmtWon=m=>{if(m>=10000){const e=m/10000;return(Number.isInteger(e)?e:e.toFixed(1).replace(/\.0$/,''))+'억'}return m.toLocaleString('ko-KR')+'만'};
const fmtFull=m=>{const e=Math.floor(m/10000),r=m%10000;return(e?e+'억 ':'')+(r?r.toLocaleString('ko-KR')+'만':'')||'0'};
const gradeOf=pc=>H.gradeByProvince[pc]||3;

/* ---------- 요약 문구 ---------- */
$('#cap-summary').textContent=[1,2,3].map(g=>`${H.grades[g].label} ${fmtWon(H.grades[g].cap)}`).join(' · ');
$('#allow-summary').textContent=`월 ${H.allowance.min}~${H.allowance.max}만 원`;
const allowEl=$('#r-allow');allowEl.min=H.allowance.min;allowEl.max=H.allowance.max;allowEl.step=H.allowance.step;allowEl.value=H.allowance.default;
$('#h-rate').value=H.monthlyLoanRate;
$('#r-grade').innerHTML=[1,2,3].map(g=>`<option value="${g}">${H.grades[g].label} · ${H.grades[g].area} (상한 ${fmtWon(H.grades[g].cap)})</option>`).join('');
$('#r-base').innerHTML=BASES.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');

/* ---------- 예시 매물 생성 ---------- */
const DONG={wirye:['장지동','거여동','창곡동','학암동','위례동'],yongsan:['한남동','이촌동','후암동','원효로동','효창동'],bundang:['정자동','서현동','야탑동','이매동','수내동'],
  uijeongbu:['의정부동','호원동','민락동','용현동','금오동'],paju:['동패동','와동동','목동동','야당동','금촌동'],pyeongtaek:['고덕동','팽성읍','비전동','소사동','세교동'],
  dongtan:['오산동','청계동','영천동','반송동','능동'],gyeryong:['엄사면','금암동','두마면','신도안면'],sejong:['나성동','도담동','어진동','보람동','조치원읍'],
  yuseong:['봉명동','궁동','노은동','관평동','도룡동'],chuncheon:['석사동','퇴계동','후평동','온의동','효자동'],wonju:['단계동','무실동','반곡동','명륜동','태장동']};
function rng(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const RANGE={ // 만 원
  m:{1:{dep:[500,2000],rent:[52,95]},2:{dep:[200,900],rent:[27,60]},3:{dep:[100,500],rent:[22,45]}},
  j:{1:{dep:[15000,42000]},2:{dep:[9000,33000]},3:{dep:[6000,24000]}}};
const AREA={'원룸':[17,26],'투룸':[33,46],'오피스텔':[20,32],'빌라':[40,62],'아파트':[59,84]};
const ADJ={'원룸':0,'오피스텔':8,'투룸':15,'빌라':12,'아파트':25};
function makeListings(b){
  const r=rng(b.id),g=gradeOf(b.pc),dongs=DONG[b.id]||['중앙동'],out=[];
  const pick=a=>a[Math.floor(r()*a.length)],between=([a,c])=>a+r()*(c-a);
  const place=()=>{const ang=r()*Math.PI*2,dist=.3+Math.pow(r(),.8)*9;return[b.lat+Math.sin(ang)*dist/111,b.lon+Math.cos(ang)*dist/(111*Math.cos(b.lat*Math.PI/180))]};
  for(let i=0;i<22;i++){const type=pick(['원룸','원룸','원룸','오피스텔','오피스텔','투룸','빌라']);const [lat,lon]=place();
    const dep=Math.round(between(RANGE.m[g].dep)/50)*50,rent=Math.round(between(RANGE.m[g].rent)+ADJ[type]*(r()*.8+.2));
    out.push({id:b.id+'m'+i,deal:'월세',type,dong:pick(dongs),lat,lon,dep,rent,fee:Math.round(3+r()*9),area:Math.round(between(AREA[type])),floor:1+Math.floor(r()*12),walk:3+Math.floor(r()*18),built:2004+Math.floor(r()*21)})}
  for(let i=0;i<14;i++){const type=pick(['투룸','빌라','빌라','아파트','오피스텔','아파트']);const [lat,lon]=place();
    const base=between(RANGE.j[g].dep)*(type==='아파트'?1.25:type==='오피스텔'?.75:1);const dep=Math.round(base/500)*500;
    out.push({id:b.id+'j'+i,deal:'전세',type,dong:pick(dongs),lat,lon,dep,rent:0,fee:Math.round(5+r()*12),area:Math.round(between(AREA[type])),floor:1+Math.floor(r()*15),walk:3+Math.floor(r()*18),built:2000+Math.floor(r()*25),ratio:Math.round(55+r()*37)})}
  return out}

/* ---------- 상태 ---------- */
let mode='jeonse';const TYPES=['원룸','투룸','오피스텔','빌라','아파트'];let typeOn=new Set(TYPES);
$('#r-types').innerHTML=TYPES.map(t=>`<button type="button" class="chip" data-t="${t}" aria-pressed="true">${t}</button>`).join('');
$('#r-types').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.t;
  if(typeOn.has(t)&&typeOn.size>1)typeOn.delete(t);else typeOn.add(t);b.setAttribute('aria-pressed',typeOn.has(t));render()});
const SK='anbu-support';
try{const s=JSON.parse(localStorage.getItem(SK)||'null');if(s){mode=s.mode||mode;['r-base','r-radius','r-grade','r-own','r-allow','r-extra','r-deposit'].forEach(id=>{if(s[id]!=null)$('#'+id).value=s[id]});if(s.fee!=null)$('#r-fee').checked=s.fee;if(s.gradeManual)gradeManual=true}}catch(e){}
var gradeManual=gradeManual||false;
function save(){const s={mode,fee:$('#r-fee').checked,gradeManual};['r-base','r-radius','r-grade','r-own','r-allow','r-extra','r-deposit'].forEach(id=>s[id]=$('#'+id).value);try{localStorage.setItem(SK,JSON.stringify(s))}catch(e){}}

/* ---------- 지도 ---------- */
const map=L.map('rmap',{minZoom:6,maxZoom:17,scrollWheelZoom:true}).setView([37.48,127.14],12);
map.zoomControl.setPosition('topright');map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(map);
if(window.KOREA_TOPO&&window.topojson){const k=Object.keys(KOREA_TOPO.objects)[0];
  L.geoJSON(topojson.feature(KOREA_TOPO,KOREA_TOPO.objects[k]),{style:{color:'#3A5060',weight:.6,fillColor:'#0A0E13',fillOpacity:.05},interactive:false}).addTo(map)}
const lay=L.layerGroup().addTo(map);let baseM=null,circ=null,markers={};

function base(){return BASES.find(b=>b.id===$('#r-base').value)||BASES[0]}
function hav(a,b,c,e){const R=6371,r=Math.PI/180,dl=(c-a)*r,dn=(e-b)*r;const x=Math.sin(dl/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}

function setMode(m){mode=m;$('#m-jeonse').setAttribute('aria-pressed',m==='jeonse');$('#m-monthly').setAttribute('aria-pressed',m==='monthly');
  $('#j-fields').hidden=m!=='jeonse';$('#m-fields').hidden=m!=='monthly';$('#mode-label').textContent=m==='jeonse'?'전세 지원':'주택수당 월세';
  document.querySelectorAll('.path').forEach(p=>p.setAttribute('aria-pressed',p.dataset.path===(m==='jeonse'?'jeonse':'allowance')));render()}
$('#m-jeonse').onclick=()=>setMode('jeonse');$('#m-monthly').onclick=()=>setMode('monthly');
$('#paths').addEventListener('click',e=>{const p=e.target.closest('.path');if(!p)return;
  if(p.dataset.path==='quarters'){document.querySelectorAll('.path').forEach(x=>x.setAttribute('aria-pressed',x===p));renderCompare('quarters');return}
  setMode(p.dataset.path==='jeonse'?'jeonse':'monthly')});

function render(){
  const b=base(),g=+$('#r-grade').value||gradeOf(b.pc),G=H.grades[g],radius=+$('#r-radius').value;
  $('#r-radius-out').textContent=radius+'km';$('#r-grade-hud').textContent=G.label;
  $('#cap-val').textContent=fmtFull(G.cap);
  const own=Math.max(0,+$('#r-own').value||0),maxDep=G.cap+own;
  $('#j-hint').textContent=`보증금 ${fmtFull(maxDep)} 이하 전세를 찾아요 (상한 ${fmtWon(G.cap)} + 내 돈 ${fmtWon(own)}). 상한을 넘는 금액은 직접 마련해야 해요.`;
  const allow=+$('#r-allow').value,extra=Math.max(0,+$('#r-extra').value||0),depCap=Math.max(0,+$('#r-deposit').value||0),withFee=$('#r-fee').checked;
  $('#r-allow-out').textContent=allow+'만';const budget=allow+extra;$('#budget-val').textContent=budget+'만';
  const ll=[b.lat,b.lon];
  if(!baseM){baseM=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="base-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:1000}).addTo(map);
    circ=L.circle(ll,{radius:radius*1000,color:'#F2A93B',weight:1,dashArray:'4 6',fillColor:'#F2A93B',fillOpacity:.04,interactive:false}).addTo(map)}
  baseM.setLatLng(ll).bindTooltip('기준 위치 · '+b.name,{className:'anbu-tip'});circ.setLatLng(ll).setRadius(radius*1000);
  const all=makeListings(b).filter(x=>x.deal===(mode==='jeonse'?'전세':'월세')&&typeOn.has(x.type));
  const scored=all.map(x=>{const dist=hav(b.lat,b.lon,x.lat,x.lon);let ok,cost;
    if(mode==='jeonse'){ok=x.dep<=maxDep;cost=x.dep}else{cost=x.rent+(withFee?x.fee:0);ok=cost<=budget&&x.dep<=depCap}
    return{...x,dist,ok,cost}}).filter(x=>x.dist<=radius);
  const fit=scored.filter(x=>x.ok).sort((a,c)=>a.dist-c.dist);
  lay.clearLayers();markers={};
  scored.forEach(x=>{const risky=x.deal==='전세'&&x.ratio>80;const col=!x.ok?'#4C5D6A':risky?'#F2554A':'#3FD0E0';
    const m=L.circleMarker([x.lat,x.lon],{radius:x.ok?7:4,color:col,weight:2,fillColor:col,fillOpacity:x.ok?.5:.2}).addTo(lay);
    m.bindPopup(`<b>${x.dong} ${x.type}</b> <span class="demo-flag">예시</span><br>${x.deal==='전세'?`전세 ${fmtFull(x.dep)}`:`보증금 ${x.dep}만 / 월 ${x.rent}만 (관리비 ${x.fee}만)`}<br>${x.area}㎡ · ${x.floor}층 · 역 도보 ${x.walk}분 · ${x.dist.toFixed(1)}km`);
    m.on('click',()=>hl(x.id,false));markers[x.id]=m});
  $('#r-count').textContent=`(${fit.length})`;
  $('#r-summary').textContent=mode==='jeonse'?`${G.label} · 보증금 ${fmtWon(maxDep)} 이하`:`월 ${budget}만 이하 · 보증금 ${depCap}만 이하`;
  const q=s=>encodeURIComponent(s);
  $('#r-results').innerHTML=fit.length?fit.map(x=>{
    const risky=x.deal==='전세'&&x.ratio>80;
    const price=x.deal==='전세'?`전세 <b>${fmtFull(x.dep)}</b>`:`보증금 ${x.dep}만 / 월 <b>${x.rent}만</b>`;
    const cover=x.deal==='월세'?Math.min(100,Math.round(allow/(x.rent+(withFee?x.fee:0))*100)):null;
    const sup=x.deal==='전세'?Math.min(x.dep,G.cap):0;
    return `<article class="site" data-id="${x.id}">
      <div class="top"><h4>${x.dong} ${x.type}</h4><span class="dd" style="color:var(--muted)">${x.dist.toFixed(1)}km</span></div>
      <div class="price">${price}</div>
      <div class="meta">${x.area}㎡ · ${x.floor}층 · ${x.built}년 준공 · 역 도보 ${x.walk}분 · 관리비 ${x.fee}만</div>
      <div class="tags">${x.deal==='월세'?`<span class="t mil me">주택수당으로 ${cover}% 충당</span><span class="t">내 부담 월 ${Math.max(0,x.rent+(withFee?x.fee:0)-allow)}만</span>`:`<span class="t mil me">전세 지원 ${fmtWon(sup)}</span>${x.dep>G.cap?`<span class="t">내 돈 ${fmtWon(x.dep-G.cap)}</span>`:'<span class="t me">상한 안</span>'}<span class="t" style="${risky?'border-color:var(--bad);color:var(--bad)':''}">전세가율 ${x.ratio}% ${risky?'위험':''}</span>`}</div>
      <div class="links"><a href="https://map.naver.com/p/search/${q(b.name.split(' (')[0]+' '+x.dong+' '+x.type)}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="https://rt.molit.go.kr" target="_blank" rel="noopener">실거래가 ↗</a><a href="#check">안부 체크리스트 →</a></div>
    </article>`}).join(''):`<p class="empty" style="padding:8px">반경 ${radius}km 안에 예산에 맞는 예시 매물이 없어요. ${mode==='jeonse'?'내 돈을 늘리거나':'더 낼 수 있는 월세나 보증금 한도를 늘리거나'} 반경을 넓혀 보세요.</p>`;
  renderCompare(mode==='jeonse'?'jeonse':'allowance');
  calcHalf();save();
}
function hl(id,fly){document.querySelectorAll('#r-results .site').forEach(el=>el.classList.toggle('on',el.dataset.id===id));
  const el=document.querySelector(`#r-results .site[data-id="${id}"]`);if(el&&!fly)el.scrollIntoView({block:'nearest',behavior:'smooth'});
  if(fly&&markers[id]){map.flyTo(markers[id].getLatLng(),15,{duration:.7});markers[id].openPopup()}}
$('#r-results').addEventListener('click',e=>{if(e.target.closest('a'))return;const c=e.target.closest('.site');if(c)hl(c.dataset.id,true)});

/* ---------- 반전세 지원 계산 ---------- */
function calcHalf(){const g=+$('#r-grade').value,cap=H.grades[g].cap;const dep=+$('#h-dep').value||0,rent=+$('#h-rent').value||0,rate=(+$('#h-rate').value||0)/100;
  const box=$('#h-out');
  if(dep>=cap){$('#h-val').textContent='0만';$('#h-msg').textContent=`보증금이 ${H.grades[g].label} 상한(${fmtWon(cap)}) 이상이라 월세 지원이 없어요.`;box.dataset.level='warn';return}
  const sup=Math.min((cap-dep)*rate/12,rent);const mine=Math.max(0,rent-sup);
  $('#h-val').textContent=`월 ${sup.toFixed(1)}만`;$('#h-msg').textContent=`${H.grades[g].label} 상한 ${fmtWon(cap)} 기준 · 월세 ${rent}만 중 내 부담 약 ${mine.toFixed(1)}만`;box.dataset.level=mine>0?'warn':''}
['h-dep','h-rent','h-rate'].forEach(id=>$('#'+id).addEventListener('input',calcHalf));

/* ---------- 비교 ---------- */
function renderCompare(focus){const b=base(),g=+$('#r-grade').value,G=H.grades[g],allow=+$('#r-allow').value;
  const yearly=allow*12;
  const rows=[
    ['quarters','관사','월 주거비 거의 없음','배정 대기 · 이동 잦음 · 주택수당 없음'],
    ['jeonse','전세 지원',`최대 ${fmtWon(G.cap)} (${G.label})`,'월세 부담 없음 · 추천서 필요 · 전세사기 점검 필수'],
    ['allowance','주택수당',`월 ${allow}만 · 연 ${yearly}만`,'관사 · 전세 지원과 함께 받기 어려움 · 월세 일부 충당']];
  $('#compare').innerHTML=`<div class="cmp">${rows.map(r=>`<div style="${r[0]===focus?'':'opacity:.6'}"><b>${r[0]===focus?'▶ ':''}${r[1]}</b><strong>${r[2]}</strong><span>${r[3]}</span></div>`).join('')}</div>
    <p class="hint" style="margin-top:10px">기준 위치 ${b.name} · ${G.label}. 실제 지급 여부와 금액은 부대 인사과 · 국군복지단에서 확인하세요.</p>`}

/* ---------- 이벤트 ---------- */
$('#r-base').addEventListener('change',()=>{const b=base();if(!gradeManual)$('#r-grade').value=gradeOf(b.pc);map.flyTo([b.lat,b.lon],12,{duration:.7});render()});
$('#r-grade').addEventListener('change',()=>{gradeManual=true;render()});
$('#rform').addEventListener('input',e=>{if(e.target.id!=='r-grade'&&e.target.id!=='r-base')render()});
$('#rform').addEventListener('submit',e=>e.preventDefault());
if(!gradeManual)$('#r-grade').value=gradeOf(base().pc);
setMode(mode);
map.setView([base().lat,base().lon],12);
// 지도가 처음에 숨어 있다가 보이면 크기 다시 계산
new IntersectionObserver(es=>{if(es[0].isIntersecting)map.invalidateSize()}).observe($('#rmap'));
})();
