/* =====================================================================
 * 안부 — 군인 청약 내비 (지도 · 자격 진단 · 가점 · 반경 내 분양 일정)
 * 자격 진단은 안내용 단순화 규칙이에요. 최종 자격은 입주자모집공고와 청약홈에서 확인해야 해요.
 * ===================================================================== */
(function(){
const $=s=>document.querySelector(s);
const CFG=window.ANBU_CONFIG||{};
const BASES=window.ANBU_BASES;
const TODAY=new Date();TODAY.setHours(0,0,0,0);

/* ---------- 행정구역 ---------- */
const PROV={'11':'서울','21':'부산','22':'대구','23':'인천','24':'광주','25':'대전','26':'울산','29':'세종','31':'경기','32':'강원','33':'충북','34':'충남','35':'전북','36':'전남','37':'경북','38':'경남','39':'제주'};
const PROV_FULL={'11':'서울특별시','21':'부산광역시','22':'대구광역시','23':'인천광역시','24':'광주광역시','25':'대전광역시','26':'울산광역시','29':'세종특별자치시','31':'경기도','32':'강원','33':'충청북도','34':'충청남도','35':'전라북도','36':'전라남도','37':'경상북도','38':'경상남도','39':'제주특별자치도'};
const BORDER={'23':['강화군','옹진군'],'31':['김포시','파주시','연천군','고양시','양주시','동두천시','포천시'],'32':['철원군','화천군','양구군','인제군','고성군','춘천시']};
const topo=window.KOREA_TOPO;const objKey=Object.keys(topo.objects)[0];
const fc=topojson.feature(topo,topo.objects[objKey]);
const cityOf=n=>{const m=n.match(/^(.+?시)(.+구)$/);return m?m[1]:n};
fc.features.forEach(f=>{const p=f.properties,pc=p.code.slice(0,2);p.pc=pc;p.prov=PROV[pc]||'';p.city=cityOf(p.name);p.border=(BORDER[pc]||[]).includes(p.city)});

/* ---------- 지도 ---------- */
const map=L.map('lmap',{zoomControl:true,attributionControl:true,minZoom:6,maxZoom:16}).setView([36.9,127.6],7);
map.zoomControl.setPosition('topright');map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
{const T=(window.ANBU_CONFIG||{}).tiles;
  L.tileLayer(T.base,{maxNativeZoom:T.maxZoom,maxZoom:18,attribution:T.attribution+' · 경계: 통계청(2013)'}).addTo(map);
  if(T.labels)L.tileLayer(T.labels,{maxNativeZoom:T.maxZoom,maxZoom:18,pane:'overlayPane',opacity:.7}).addTo(map);}
let showBorder=true,showSites=true,selCity=null;
function regionStyle(f){const p=f.properties;const sel=selCity&&selCity.key===p.pc+'|'+p.city;
  if(sel)return{color:'#3FD0E0',weight:2,fillColor:'#3FD0E0',fillOpacity:.18};
  if(showBorder&&p.border)return{color:'#F2A93B',weight:1.2,fillColor:'#F2A93B',fillOpacity:.10};
  return{color:'#3A5060',weight:.6,fillColor:'#0A0E13',fillOpacity:.05}}
const regionLayer=L.geoJSON(fc,{style:regionStyle,onEachFeature:(f,l)=>{
  const p=f.properties;l.bindTooltip(`${p.prov} ${p.name}${p.border?' · 접경지역':''}`,{className:'anbu-tip',sticky:true});
  l.on('click',()=>selectCity(p.pc+'|'+p.city,false))}}).addTo(map);
map.on('mousemove',e=>{$('#hud-coord').textContent=`LAT ${e.latlng.lat.toFixed(4)} / LON ${e.latlng.lng.toFixed(4)}`});

const cities=[],cityIdx={};
regionLayer.eachLayer(l=>{const p=l.feature.properties,k=p.pc+'|'+p.city;
  if(!cityIdx[k]){cityIdx[k]={key:k,pc:p.pc,prov:p.prov,city:p.city,code:p.code,border:p.border,eng:p.name_eng,layers:[]};cities.push(cityIdx[k])}
  cityIdx[k].layers.push(l)});
cities.forEach(c=>{c.bounds=L.featureGroup(c.layers).getBounds();c.center=c.bounds.getCenter()});

/* ---------- 프로필 ---------- */
const PK='anbu-profile';
const baseSel=$('#p-base');
baseSel.innerHTML=BASES.map(b=>`<option value="${b.id}">${b.name}</option>`).join('')+'<option value="custom">지도에서 직접 고른 위치</option>';
let custom=null;
const fields=['p-base','p-radius','p-status','p-years','p-homeless','p-hy','p-bank','p-dep','p-kids','p-married','p-my','f-mine'];
try{const s=JSON.parse(localStorage.getItem(PK)||'null');if(s){fields.forEach(id=>{if(!(id in s))return;const el=$('#'+id);if(el.type==='checkbox')el.checked=s[id];else el.value=s[id]});custom=s.custom||null}}catch(e){}
if(baseSel.value==='custom'&&!custom)baseSel.value='wirye';
function readProfile(){const n=id=>Math.max(0,+$('#'+id).value||0);
  return{status:$('#p-status').value,years:n('p-years'),homeless:$('#p-homeless').checked,hy:n('p-hy'),bank:n('p-bank'),dep:n('p-dep'),kids:n('p-kids'),married:$('#p-married').checked,my:n('p-my'),radius:n('p-radius')||20}}
function saveProfile(){const s={custom};fields.forEach(id=>{const el=$('#'+id);s[id]=el.type==='checkbox'?el.checked:el.value});try{localStorage.setItem(PK,JSON.stringify(s))}catch(e){}}
function base(){if(baseSel.value==='custom'&&custom)return{name:custom.name,lat:custom.lat,lon:custom.lon};const b=BASES.find(x=>x.id===baseSel.value)||BASES[0];return b}

/* ---------- 자격 진단 (단순화 규칙) ---------- */
function eligibility(P){
  const long=P.status==='long',vet=P.status==='vet';
  const E=[];
  const add=(key,title,s,why,desc,src)=>E.push({key,title,s,why,desc,src});
  // 일반공급
  if(P.bank>=24)add('gen1','일반공급 1순위','ok',`통장 ${P.bank}개월 · 규제지역 기준(24개월)까지 충족`,'수도권 비규제 12개월, 규제지역 24개월 이상이 기본 요건이에요. 규제지역은 세대주 · 무주택 등 추가 요건이 있어요.','주택공급에 관한 규칙 제27조·제28조');
  else if(P.bank>=12)add('gen1','일반공급 1순위','check',`통장 ${P.bank}개월 · 비규제 수도권만 1순위`,'규제지역 단지는 24개월이 필요해서 2순위가 돼요.','주택공급에 관한 규칙 제27조·제28조');
  else add('gen1','일반공급 1순위','no',`통장 ${P.bank}개월 · 수도권 1순위는 12개월부터`,'지금은 2순위로만 청약할 수 있어요.','주택공급에 관한 규칙 제27조·제28조');
  // 군인 기관추천
  if(long&&P.years>=10&&P.homeless&&P.bank>=6)add('mil10','기관추천 특별공급 · 10년 이상 장기복무 군인','ok',`복무 ${P.years}년 · 무주택 · 통장 ${P.bank}개월`,'단지마다 군인 배정 물량이 따로 있어요. 국방부(국군복지단) 추천 절차를 거쳐 접수해요.','입주자모집공고 기관추천 특별공급');
  else if(long&&P.years>=10)add('mil10','기관추천 특별공급 · 10년 이상 장기복무 군인','no',!P.homeless?'세대 전원 무주택이어야 해요':'통장 6개월 이상이 필요해요','특별공급은 무주택세대구성원에게 평생 1회 공급돼요.','입주자모집공고 기관추천 특별공급');
  else add('mil10','기관추천 특별공급 · 10년 이상 장기복무 군인','no',long?`복무 ${P.years}년 · 10년부터 대상`:'현역 장기복무 군인 대상이에요','장기복무 10년을 채우면 열려요.','입주자모집공고 기관추천 특별공급');
  // 거주지역 특례
  if(long&&P.years>=10)add('mil10region','수도권 기타지역 거주자격','ok',`복무 ${P.years}년 · 실제 거주지와 무관`,'수도권 단지에 기타지역(수도권) 자격으로 청약할 수 있어요. 해당지역 자격은 안 돼요.','입주자모집공고 (예: 의정부 탑석 푸르지오 파크7)');
  else add('mil10region','수도권 기타지역 거주자격','no','10년 이상 장기복무 현역 대상','지방 근무 중에도 수도권 청약 길이 열리는 특례예요.','입주자모집공고');
  if(long&&P.years>=25)add('mil25','해당지역 거주자로 간주 (25년 이상)','check',`복무 ${P.years}년 · 국방부(국군복지단) 추천 필요`,'수도권 투기과열지구가 아닌 단지에서 해당지역 거주자로 청약할 수 있어요. 청약홈 인터넷 접수만 가능해요.','주택공급에 관한 규칙 제4조 · 군 주택공급 입주자 선정 훈령');
  else add('mil25','해당지역 거주자로 간주 (25년 이상)','no',long?`복무 ${P.years}년 · 25년부터 대상`:'현역 장기복무 군인 대상이에요','장기 근속 군인을 위한 특례예요.','주택공급에 관한 규칙 제4조');
  // 제대군인
  if(vet&&P.years>=10&&P.homeless)add('vet','기관추천 특별공급 · 장기복무 제대군인','check',`복무 ${P.years}년 후 전역 · 무주택`,'단지별 제대군인 물량이 있어요. 추천 기관과 요건은 공고에서 확인하세요.','주택공급에 관한 규칙 제36조');
  else add('vet','기관추천 특별공급 · 장기복무 제대군인','no',vet?'10년 이상 복무 후 전역 · 무주택이어야 해요':'전역한 장기복무 제대군인 대상이에요','전역 후에도 이어지는 특별공급이에요.','주택공급에 관한 규칙 제36조');
  // 신혼부부
  if(P.married&&P.my<=7&&P.homeless)add('newlywed','신혼부부 특별공급','check',`혼인 ${P.my}년 · 무주택`,'혼인 7년 이내 무주택 세대가 대상이에요. 소득 · 자산 기준을 따로 확인하세요.','주택공급에 관한 규칙 제41조');
  else add('newlywed','신혼부부 특별공급','no',!P.married?'기혼 세대 대상이에요':P.my>7?`혼인 ${P.my}년 · 7년 이내만 대상`:'무주택이어야 해요','','주택공급에 관한 규칙 제41조');
  // 생애최초
  if(P.homeless&&P.bank>=24)add('first','생애최초 특별공급','check','세대 전원 무주택 · 통장 1순위','과거에 집을 가진 적이 없어야 하고, 소득세 납부 5년 등 요건이 있어요.','주택공급에 관한 규칙 제43조');
  else add('first','생애최초 특별공급','no',P.homeless?'통장 1순위(24개월 기준)가 필요해요':'무주택이어야 해요','','주택공급에 관한 규칙 제43조');
  // 다자녀
  if(P.kids>=2&&P.homeless)add('multi','다자녀 특별공급','ok',`미성년 자녀 ${P.kids}명 · 무주택`,'미성년 자녀 2명 이상 무주택 세대가 대상이에요.','주택공급에 관한 규칙 제40조');
  else add('multi','다자녀 특별공급','no',P.kids<2?`자녀 ${P.kids}명 · 2명부터 대상`:'무주택이어야 해요','','주택공급에 관한 규칙 제40조');
  return E;
}
function score(P){
  const home=P.homeless?Math.min(32,2+2*Math.floor(P.hy)):0;
  const dep=Math.min(35,5+5*Math.floor(P.dep));
  const bank=P.bank<6?1:P.bank<12?2:Math.min(17,2+Math.floor(P.bank/12));
  return{home,dep,bank,total:home+dep+bank};
}

/* ---------- 분양 데이터 ---------- */
let SITES=window.ANBU_SAMPLE_SITES.slice(),LIVE=false;
const d=s=>{const x=new Date(s+'T00:00:00');return isNaN(x)?null:x};
const dayDiff=(a,b)=>Math.round((a-b)/864e5);
function phase(s){const sp=d(s.spBegin),r1=d(s.r1),win=d(s.win),no=d(s.notice);
  if(sp&&TODAY<sp){return{k:'up',label:`특공 D-${dayDiff(sp,TODAY)}`,col:'var(--cyan)'}}
  if(r1&&TODAY<=r1)return{k:'open',label:'접수 진행 중',col:'var(--ok)'};
  if(win&&TODAY<=win)return{k:'wait',label:'발표 대기',col:'var(--warn)'};
  return{k:'done',label:'마감',col:'var(--dim)'}}
function hav(a,b,c,e){const R=6371,r=Math.PI/180,dl=(c-a)*r,dn=(e-b)*r;const x=Math.sin(dl/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}

async function tryLive(){
  const key=CFG.applyhomeServiceKey,proxy=CFG.proxyUrl;if(!key&&!proxy)return;
  const from=new Date(TODAY-30*864e5).toISOString().slice(0,10);
  const url=proxy?proxy:`${CFG.applyhomeEndpoint}?page=1&perPage=300&serviceKey=${encodeURIComponent(key)}&cond%5BRCRIT_PBLANC_DE%3A%3AGTE%5D=${from}`;
  try{const r=await fetch(url);if(!r.ok)throw new Error(r.status);const j=await r.json();const rows=j.data||j;
    const out=[];rows.forEach((x,i)=>{const addr=x.HSSPLY_ADRES||'';const c=matchCity(addr);if(!c)return;
      out.push({id:'L'+i,name:x.HOUSE_NM,addr,lat:c.center.lat,lon:c.center.lng,approx:true,kind:x.HOUSE_SECD_NM||'',units:+x.TOT_SUPLY_HSHLDCO||0,mil10:null,vet:null,
        types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:['11','23','31'].includes(c.pc),reg:(x.SPECLT_RDN_EARTH_AT==='Y'||x.MDAT_TRGET_AREA_SECD==='Y'),
        notice:x.RCRIT_PBLANC_DE,spBegin:x.SPSPLY_RCEPT_BGNDE||x.RCEPT_BGNDE,spEnd:x.SPSPLY_RCEPT_ENDDE,r1:x.GNRL_RNK1_CRSPAREA_RCPTDE||x.RCEPT_ENDDE,win:x.PRZWNER_PRESNATN_DE,url:x.PBLANC_URL||x.HMPG_ADRES})});
    if(out.length){SITES=out;LIVE=true;render()}}
  catch(e){console.warn('[안부] 청약홈 실데이터를 불러오지 못해 예시 데이터를 보여줘요.',e)}}
function matchCity(addr){const a=addr.replace(/\s/g,'');let best=null;
  cities.forEach(c=>{if(a.includes(c.city.replace(/\s/g,''))&&(a.startsWith(PROV[c.pc])||a.startsWith(PROV_FULL[c.pc])||a.includes(PROV_FULL[c.pc]))){if(!best||c.city.length>best.city.length)best=c}});return best}

/* ---------- 렌더 ---------- */
const siteLayer=L.layerGroup().addTo(map);let baseMarker=null,baseCircle=null,markers={};
function tagsFor(s,E){
  const ok=k=>{const e=E.find(x=>x.key===k);return e&&e.s!=='no'};const T=[];
  const P=readProfile();
  if(P.bank>=(s.reg?24:12))T.push(['1순위','me']);else T.push(['2순위','']);
  if(s.mil10!==0&&ok('mil10'))T.push([s.mil10?`군인 기관추천 ${s.mil10}세대`:'군인 기관추천 (공고 확인)','mil me']);
  else if(s.mil10)T.push([`군인 기관추천 ${s.mil10}세대`,'mil']);
  if(s.vet&&ok('vet'))T.push([`제대군인 ${s.vet}세대`,'mil me']);
  if(s.metro&&ok('mil10region'))T.push(['기타지역(수도권) 자격','mil me']);
  if(s.metro&&!s.reg&&ok('mil25'))T.push(['해당지역 간주 가능','mil me']);
  if(s.types.includes('신혼부부')&&ok('newlywed'))T.push(['신혼부부','me']);
  if(s.types.includes('생애최초')&&ok('first'))T.push(['생애최초','me']);
  if(s.types.includes('다자녀')&&ok('multi'))T.push(['다자녀','me']);
  if(s.reg)T.push(['규제지역','']);
  return T}
function render(){
  const P=readProfile(),B=base(),E=eligibility(P),S=score(P);
  $('#p-radius-out').textContent=P.radius+'km';
  // base
  const ll=[B.lat,B.lon];
  if(!baseMarker){baseMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="base-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:1000}).addTo(map);
    baseCircle=L.circle(ll,{radius:P.radius*1000,color:'#F2A93B',weight:1,dashArray:'4 6',fillColor:'#F2A93B',fillOpacity:.04,interactive:false}).addTo(map)}
  baseMarker.setLatLng(ll).bindTooltip('기준 위치 · '+B.name,{className:'anbu-tip'});baseCircle.setLatLng(ll).setRadius(P.radius*1000);
  // sites
  siteLayer.clearLayers();markers={};
  const list=SITES.map(s=>({s,dist:hav(B.lat,B.lon,s.lat,s.lon),ph:phase(s),tags:tagsFor(s,E)}))
    .filter(x=>x.dist<=P.radius).filter(x=>!$('#f-mine').checked||x.tags.some(t=>t[1].includes('me')))
    .sort((a,b)=>(a.ph.k==='done')-(b.ph.k==='done')||a.dist-b.dist);
  if(showSites)SITES.forEach(s=>{const inR=hav(B.lat,B.lon,s.lat,s.lon)<=P.radius;const ph=phase(s);
    const col=ph.k==='done'?'#4C5D6A':inR?'#3FD0E0':'#3A5060';
    const m=L.circleMarker([s.lat,s.lon],{radius:inR?8:5,color:col,weight:2,fillColor:col,fillOpacity:inR?.45:.2}).addTo(siteLayer);
    m.bindPopup(`<b>${s.name}</b>${LIVE?'':' <span class="demo-flag">예시</span>'}<br>${s.addr}<br>${s.kind} · ${s.units}세대 · <span style="color:${ph.col}">${ph.label}</span><br>특공 ${s.spBegin||'-'} · 1순위 ${s.r1||'-'}`);
    m.on('click',()=>highlight(s.id,false));markers[s.id]=m});
  $('#site-count').textContent=`(${list.length})`;
  $('#data-flag').innerHTML=LIVE?'<span class="live-flag">청약홈 실데이터</span>':'<span class="demo-flag">예시 데이터</span>';
  $('#results').innerHTML=list.length?list.map(({s,dist,ph,tags})=>`
    <article class="site" data-id="${s.id}" style="${ph.k==='done'?'opacity:.55':''}">
      <div class="top"><h4>${s.name}</h4><span class="dd" style="color:${ph.col}">${ph.label}</span></div>
      <div class="meta">${s.addr}<br>${dist.toFixed(1)}km${s.approx?' (시군구 중심 기준)':''} · ${s.kind} · ${s.units}세대</div>
      <div class="meta mono" style="font-size:11px">공고 ${s.notice||'-'} · 특공 ${s.spBegin||'-'} · 1순위 ${s.r1||'-'} · 발표 ${s.win||'-'}</div>
      <div class="tags">${tags.map(t=>`<span class="t ${t[1]}">${t[0]}</span>`).join('')}</div>
      <div class="links"><a href="${s.url||'https://www.applyhome.co.kr'}" target="_blank" rel="noopener">청약홈 ↗</a><a href="https://map.naver.com/p/search/${encodeURIComponent(s.addr.replace(/\(.*\)/,''))}" target="_blank" rel="noopener">네이버 지도 ↗</a><a href="https://www.google.com/maps/search/${encodeURIComponent(s.addr.replace(/\(.*\)/,''))}" target="_blank" rel="noopener">구글 지도 ↗</a></div>
    </article>`).join(''):`<p class="empty" style="padding:8px">반경 ${P.radius}km 안에 조건에 맞는 분양이 없어요. 반경을 넓히거나 "내가 지원 가능한 유형만"을 꺼 보세요.</p>`;
  // eligibility
  const lab={ok:'● 지원 가능',check:'◐ 조건 확인 필요',no:'○ 해당 없음'},col={ok:'var(--ok)',check:'var(--warn)',no:'var(--dim)'};
  $('#elig').innerHTML=E.map(e=>`<div class="ecard" data-s="${e.s}"><span class="st" style="color:${col[e.s]}">${lab[e.s]}</span><h4>${e.title}</h4><span class="why">${e.why}</span>${e.desc?`<p>${e.desc}</p>`:''}<span class="src">${e.src}</span></div>`).join('');
  // score
  const row=(n,v,max,c)=>`<div class="score-row"><span>${n}</span><b>${v} / ${max}</b><div class="bar"><i style="width:${v/max*100}%;background:${c}"></i></div></div>`;
  $('#score').innerHTML=`<div class="total"><strong>${S.total}</strong><span>/ 84점</span></div>
    <p class="hint" style="margin-bottom:8px">${P.homeless?`무주택 ${Math.floor(P.hy)}년`:'유주택 (무주택 점수 0)'} · 부양가족 ${P.dep}명 · 통장 ${P.bank}개월</p>
    ${row('무주택 기간',S.home,32,'var(--cyan)')}${row('부양가족 수',S.dep,35,'var(--amber)')}${row('통장 가입기간',S.bank,17,'var(--ok)')}
    <p class="hint" style="margin-top:10px">관사 거주는 주택 소유가 아니라서 무주택 기간이 이어져요. 다만 세대원 누구라도 집이 있으면 유주택이에요.</p>`;
  saveProfile();
}
function highlight(id,fly){document.querySelectorAll('.site').forEach(el=>el.classList.toggle('on',el.dataset.id===id));
  const el=document.querySelector(`.site[data-id="${id}"]`);if(el&&!fly)el.scrollIntoView({block:'nearest',behavior:'smooth'});
  const m=markers[id];if(m&&fly){map.flyTo(m.getLatLng(),12,{duration:.8});m.openPopup()}}
$('#results').addEventListener('click',e=>{if(e.target.closest('a'))return;const c=e.target.closest('.site');if(c)highlight(c.dataset.id,true)});

/* ---------- 지역 파일 ---------- */
function showTab(t){$('#tab-sites').setAttribute('aria-selected',t==='sites');$('#tab-region').setAttribute('aria-selected',t==='region');$('#pane-sites').hidden=t!=='sites';$('#pane-region').hidden=t!=='region'}
$('#tab-sites').onclick=()=>showTab('sites');$('#tab-region').onclick=()=>showTab('region');
function selectCity(k,fly=true){const c=cityIdx[k];if(!c)return;selCity=c;regionLayer.setStyle(regionStyle);
  if(fly)map.flyToBounds(c.bounds,{padding:[40,40],duration:.8,maxZoom:12});
  const near=SITES.filter(s=>hav(c.center.lat,c.center.lng,s.lat,s.lon)<=10).length;const q=encodeURIComponent(c.prov+' '+c.city);
  $('#dossier').innerHTML=`<div style="display:grid;gap:12px">
    <div><div class="d-sub">${c.prov} // ${c.eng||''} // ${c.code}</div><h3 class="d-name">${c.city}</h3></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${c.border?'<span class="badge" style="color:var(--amber)">법정 접경지역</span>':'<span class="badge" style="color:var(--muted)">일반 지역</span>'}${['11','23','31'].includes(c.pc)?'<span class="badge" style="color:var(--cyan)">수도권</span>':''}</div>
    <div class="d-grid"><div><span>주변 10km 분양</span><strong>${near}</strong><span>${LIVE?'청약홈':'예시 데이터'}</span></div><div><span>하위 구역</span><strong>${c.layers.length}</strong><span>${c.layers.length>1?'일반구 포함':'단일'}</span></div></div>
    <div class="d-links">
      <button type="button" id="setbase">여기를 기준 위치로 <small>◆ BASE</small></button>
      <a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">네이버 지도에서 보기 <small>↗ NAVER</small></a>
      <a href="https://www.google.com/maps/search/${q}" target="_blank" rel="noopener">구글 지도에서 보기 <small>↗ GOOGLE</small></a>
      <a href="https://rt.molit.go.kr" target="_blank" rel="noopener">실거래가 조회 <small>↗ 국토부</small></a>
      <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener">청약홈 분양 일정 <small>↗ 청약홈</small></a>
    </div></div>`;
  $('#setbase').onclick=()=>{custom={name:c.prov+' '+c.city,lat:c.center.lat,lon:c.center.lng};baseSel.value='custom';showTab('sites');render();map.flyTo(c.center,10,{duration:.8})};
  showTab('region')}
$('#dossier').innerHTML='<p class="lbl" style="color:var(--cyan)">NO REGION SELECTED</p><p style="margin:0">지도에서 시·군·구를 클릭하거나 지도 위 검색창을 쓰세요.</p>';

/* ---------- 검색 ---------- */
const qEl=$('#q'),sugg=$('#sugg');
const matches=s=>{s=s.replace(/\s/g,'');if(!s)return[];return cities.filter(c=>(c.prov+c.city).includes(s)||c.city.includes(s)).slice(0,8)};
qEl.addEventListener('input',()=>{const m=matches(qEl.value);sugg.hidden=!m.length;sugg.innerHTML=m.map(c=>`<li><button type="button" data-k="${c.key}">${c.city}<small>${c.prov}${c.border?' · 접경':''}</small></button></li>`).join('')});
qEl.addEventListener('keydown',e=>{if(e.key==='Enter'){const m=matches(qEl.value);if(m[0])pick(m[0].key)}});
sugg.addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(b.dataset.k)});
function pick(k){sugg.hidden=true;const c=cityIdx[k];qEl.value=c.prov+' '+c.city;selectCity(k)}

/* ---------- 이벤트 ---------- */
$('#profile').addEventListener('input',render);$('#profile').addEventListener('change',render);
$('#profile').addEventListener('submit',e=>e.preventDefault());
$('#f-mine').addEventListener('change',render);
baseSel.addEventListener('change',()=>{const B=base();map.flyTo([B.lat,B.lon],10,{duration:.8});render()});
map.on('contextmenu',e=>{custom={name:'직접 고른 위치',lat:e.latlng.lat,lon:e.latlng.lng};baseSel.value='custom';render()});
const tg=(id,fn)=>$('#'+id).addEventListener('click',e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);fn(on)});
tg('ly-border',on=>{showBorder=on;regionLayer.setStyle(regionStyle)});
tg('ly-sites',on=>{showSites=on;render()});

render();
const B0=base();map.setView([B0.lat,B0.lon],10);
tryLive();
})();
