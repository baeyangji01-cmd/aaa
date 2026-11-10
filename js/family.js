/* =====================================================================
 * 안부 — 가족 · 교육 (지역 맘카페 · 군인가족 커뮤니티 연결, 군인 자녀 특별전형 검색 · 자격 진단)
 * 전형 정보는 확인된 예시예요. 해마다 바뀌니 모집요강으로 꼭 확인해야 해요.
 * ===================================================================== */
(function(){
const $=s=>document.querySelector(s);
const enc=encodeURIComponent;

/* ---------- 지역 커뮤니티 ---------- */
const CHIPS=['위례','안양','분당','동탄','평택','운정','의정부','계룡','논산','세종','화천','철원','춘천','원주','진해','포항'];
const short=n=>n.replace(/\s*\(.*\)/,'').replace(/(특별자치시|특별자치도|광역시|특별시)$/,'').replace(/(시|군|구)$/,'').replace(/신도시$/,'');
let regions=[];
if(window.KOREA_TOPO&&window.topojson){const k=Object.keys(KOREA_TOPO.objects)[0];const PROV={'11':'서울','21':'부산','22':'대구','23':'인천','24':'광주','25':'대전','26':'울산','29':'세종','31':'경기','32':'강원','33':'충북','34':'충남','35':'전북','36':'전남','37':'경북','38':'경남','39':'제주'};
  const seen={};KOREA_TOPO.objects[k].geometries.forEach(g=>{const p=g.properties;const m=p.name.match(/^(.+?시)(.+구)$/);const city=m?m[1]:p.name;const key=p.code.slice(0,2)+city;
    if(!seen[key]){seen[key]=1;regions.push({label:city,prov:PROV[p.code.slice(0,2)]||'',short:short(city)})}
    if(m){regions.push({label:p.name.replace(m[1],m[1]+' '),prov:PROV[p.code.slice(0,2)]||'',short:short(m[2])})}})}
CHIPS.forEach(c=>{if(!regions.some(r=>r.short===c))regions.unshift({label:c,prov:'',short:c})});

function renderComm(name){
  const R=short(name);
  const cafe=q=>`https://section.cafe.naver.com/ca-fe/home/search/cafes?q=${enc(q)}`;
  const art=q=>`https://section.cafe.naver.com/ca-fe/home/search/articles?q=${enc(q)}`;
  const cards=[
    {k:'MOM CAFE',t:`${R}맘 카페`,d:`"${R}맘"으로 네이버 카페를 찾아요. 지역 맘카페는 학교 · 학원 · 소아과 정보가 가장 빨라요.`,u:cafe(R+'맘'),kw:[R+'맘',R+'맘카페']},
    {k:'MIL FAMILY',t:`${R} 군인가족 카페`,d:'같은 부대 · 같은 지역 군인 가족 모임을 찾아요. 관사 생활, 전입 정보를 나눠요.',u:cafe(R+' 군인가족'),kw:[R+' 군인가족',R+' 군인아내']},
    {k:'SCHOOL',t:`${R} 학교 · 학원 이야기`,d:'맘카페 글에서 학교 분위기, 학원가, 통학 이야기를 찾아요.',u:art(R+' 맘카페 학교'),kw:[R+' 중학교 추천',R+' 학원가']},
    {k:'MOVE-IN',t:`${R} 전입 · 이사 꿀팁`,d:'이사 업체, 관사 입주, 전입신고 경험담을 찾아요.',u:art(R+' 이사 전입'),kw:[R+' 이사',R+' 관사']},
    {k:'HEALTH',t:`${R} 소아과 · 병원`,d:'아이 키우는 집이 가장 먼저 찾는 정보예요.',u:art(R+' 소아과 추천'),kw:[R+' 소아과',R+' 야간진료']},
    {k:'OFFICIAL',t:'학교알리미 (공식)',d:'전학 갈 학교의 학생 수, 진학 실적, 교육과정을 공식 자료로 확인해요.',u:'https://www.schoolinfo.go.kr',kw:['학교알리미']}
  ];
  $('#comm').innerHTML=`<div class="pnl-h" style="grid-column:1/-1"><b>${R}</b><span>지역 커뮤니티 · 네이버 카페 검색 연결</span></div>`+cards.map(c=>`
    <a class="ccard" href="${c.u}" target="_blank" rel="noopener">
      <span class="q">${c.k}</span><h4>${c.t} <small>↗</small></h4><p>${c.d}</p>
      <span class="kw">${c.kw.map(x=>`<span class="t">${x}</span>`).join('')}</span>
    </a>`).join('');
  try{localStorage.setItem('anbu-comm',name)}catch(e){}
  loadTips(R);
}
$('#c-chips').innerHTML=CHIPS.map(c=>`<button type="button" class="chip" data-r="${c}">${c}</button>`).join('');
$('#c-chips').addEventListener('click',e=>{const b=e.target.closest('button');if(b){$('#c-q').value=b.dataset.r;renderComm(b.dataset.r)}});
const cq=$('#c-q'),cs=$('#c-sugg');
cq.addEventListener('input',()=>{const s=cq.value.replace(/\s/g,'');if(!s){cs.hidden=true;return}
  const m=regions.filter(r=>(r.prov+r.label).replace(/\s/g,'').includes(s)||r.short.includes(s)).slice(0,8);cs.hidden=!m.length;
  cs.innerHTML=m.map(r=>`<li><button type="button" data-r="${r.label}">${r.label}<small>${r.prov}</small></button></li>`).join('')});
cs.addEventListener('click',e=>{const b=e.target.closest('button');if(b){cs.hidden=true;cq.value=b.dataset.r;renderComm(b.dataset.r)}});
cq.addEventListener('keydown',e=>{if(e.key==='Enter'&&cq.value.trim()){e.preventDefault();cs.hidden=true;renderComm(cq.value.trim())}});

/* ---------- 군인가족 추천 카페 (Supabase) ---------- */
const CFG=window.ANBU_CONFIG||{};const SB=CFG.supabaseUrl&&CFG.supabaseAnonKey;
let tipRegion='';
const sbH={apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+CFG.supabaseAnonKey,'Content-Type':'application/json'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadTips(R){tipRegion=R;const el=document.getElementById('tips-list');if(!el)return;
  document.getElementById('tips-region').textContent='· '+R;
  if(!SB){el.innerHTML='<li class="empty" style="background:none;border:0;padding:0">Supabase 연결 후 사용할 수 있어요.</li>';document.getElementById('tips-form').hidden=true;return}
  el.innerHTML='<li class="empty" style="background:none;border:0;padding:0">불러오는 중…</li>';
  try{const r=await fetch(`${CFG.supabaseUrl}/rest/v1/cafe_tips?select=name,url,note&region=eq.${enc(R)}&order=created_at.desc&limit=20`,{headers:sbH});
    if(!r.ok)throw new Error(r.status);const rows=await r.json();if(R!==tipRegion)return;
    el.innerHTML=rows.length?rows.map(x=>`<li><a class="go" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)} ↗</a>${x.note?`<small style="color:var(--muted);font-size:12px">${esc(x.note)}</small>`:''}</li>`).join(''):'<li class="empty" style="background:none;border:0;padding:0">아직 추천이 없어요. 첫 번째로 알려주세요.</li>'}
  catch(e){el.innerHTML='<li class="empty" style="background:none;border:0;padding:0">추천 목록을 불러오지 못했어요.</li>'}}
document.getElementById('tips-form').addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('t-msg');
  const name=document.getElementById('t-name').value.trim(),url=document.getElementById('t-url').value.trim(),note=document.getElementById('t-note').value.trim();
  if(!/^https:\/\/(m\.)?cafe\.naver\.com\//.test(url)){msg.textContent='네이버 카페 주소(https://cafe.naver.com/...)만 등록할 수 있어요.';return}
  msg.textContent='등록 중…';
  try{const r=await fetch(`${CFG.supabaseUrl}/rest/v1/cafe_tips`,{method:'POST',headers:{...sbH,Prefer:'return=minimal'},body:JSON.stringify({region:tipRegion,name,url,note:note||null})});
    if(!r.ok)throw new Error(r.status);msg.textContent='등록했어요. 고마워요!';e.target.reset();loadTips(tipRegion)}
  catch(err){msg.textContent='등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.'}});
let last='위례';try{last=localStorage.getItem('anbu-comm')||last}catch(e){}
cq.value=last;renderComm(last);

/* ---------- 주소 → 읍 · 면 · 동 판정 ---------- */
function areaType(addr){const toks=addr.trim().split(/\s+/);let t=null;
  for(const w of toks){if(/(읍|면)$/.test(w))t={k:'rural',w};else if(!t&&/(동|가|로)$/.test(w)&&!/(시|군|구)$/.test(w))t={k:'urban',w}}
  if(/도서|벽지/.test(addr))t={k:'rural',w:'도서 · 벽지'};
  const metro=/^(서울|경기|인천)/.test(addr.trim());return{...(t||{k:'unknown',w:''}),metro}}

/* ---------- 전형 데이터 ---------- */
const GR={e:{done:0,left:6},m1:{done:1,left:5},m2:{done:2,left:4},m3:{done:3,left:3},h1:{done:4,left:2},h2:{done:5,left:1},h3:{done:6,left:0}};
const PROGRAMS=[
  {id:'hanmin',cat:'high',title:'한민고등학교 · 군인자녀 전국단위 모집',org:'경기 파주 · 기숙형 사립 일반고',tags:['고교','기숙사','전국단위'],
   desc:'군인 자녀를 위해 2014년 문을 연 전교생 기숙형 학교예요. 군인자녀는 전국단위로, 일반 학생은 경기도 거주자로 뽑아요 (2019년 기사 기준 군인자녀 70% · 일반 30%).',
   rule:P=>!P.active?['no','현역 군인 자녀 대상이에요']:P.g.done>=4?['no','고교 신입생 모집이라 지금은 지원 시기가 지났어요']:['ok','중학생 군인 자녀 · 중3 때 지원해요 (내신 위주 선발)'],
   src:['로컬내일 한민고 탐방 (2019)','https://www.localnaeil.com/News/View/640112/1']},
  {id:'milpub',cat:'high',title:'군인자녀 자율형 공립고 (추진)',org:'국방부 · 교육부 · 지자체 협약',tags:['고교','추진 중'],
   desc:'한민고를 본뜬 군인자녀 공립고를 기존 고교 중에서 지정하는 계획이에요. 2024년 협약 당시 춘천 · 포항 · 영천이 관심을 보였고, 2026년 신입생 모집을 목표로 했어요.',
   rule:P=>!P.active?['no','현역 군인 자녀 대상이에요']:P.g.done>=4?['no','고교 신입생 대상이에요']:['check','지정 학교와 모집 여부는 지역 교육청에서 확인하세요'],
   src:['뉴데일리 (2024.3.11)','https://www.newdaily.co.kr/site/data/html/2024/03/11/2024031100139.html']},
  {id:'hanyang',cat:'univ',title:'한양대 사회통합전형 · 장기복무 직업군인 자녀',org:'2027학년도 수시 · 5명 (한양인터칼리지학부 자연)',tags:['대입','정원내','15년'],
   desc:'15년 이상 장기복무 직업군인 · 소방 · 경찰 공무원 자녀가 지원할 수 있어요. 다자녀 · 다문화 가정과 같은 전형이에요.',
   rule:P=>!P.active?['check','현역 기준 복무연수 확인이 필요해요']:P.years>=15?['ok',`부모 복무 ${P.years}년 · 15년 이상 충족`]:['no',`부모 복무 ${P.years}년 · ${15-P.years}년 더 필요해요`],
   src:['세계일보 (2026.9.3)','https://www.segye.com/newsView/20260902516446']},
  {id:'dju',cat:'univ',title:'대전대 고른기회전형 · 직업군인 자녀',org:'2027학년도 수시 · 고른기회 33명 (교과 90 + 출결 10)',tags:['대입','정원내','15년'],
   desc:'원서접수 마감일 기준 15년 이상 근무한 직업군인 자녀 (의무복무기간 제외). 경찰 · 소방 · 교정 · 보호직 공무원 자녀와 함께 뽑아요.',
   rule:P=>!P.active?['check','직업군인 근무연수 확인이 필요해요']:P.years>=15?['ok',`부모 복무 ${P.years}년 · 15년 이상 충족`]:['no',`부모 복무 ${P.years}년 · ${15-P.years}년 더 필요해요`],
   src:['대전대 2027 수시 모집요강','https://ipsi.dju.ac.kr/upload/GUIDES/2027_rolling.pdf']},
  {id:'rural6',cat:'univ',title:'농어촌학생 전형 · 중 · 고 6년 유형',org:'정원외 · 입학정원 4% 이내 (대학별)',tags:['대입','정원외','읍·면'],
   desc:'농어촌(읍 · 면 · 도서벽지) 학교에서 중 · 고 전 과정을 다니고, 그 기간 동안 학생과 부모 모두 농어촌에 살아야 해요. 읍 · 면 부대 근처 관사에서 가족이 함께 살면 이 요건으로 볼 수 있어요.',
   rule:P=>{if(P.rural6<P.g.done)return['no',`중 · 고 ${P.g.done}년 중 읍 · 면 ${P.rural6}년 · 이미 동 지역 학교를 다녔어요`];
     if(!P.parent)return['no','부모도 같은 기간 농어촌에 살아야 해요'];
     if(P.area.k!=='rural')return['no',`지금 주소가 ${P.area.k==='urban'?'동 지역':'확인 안 됨'}이에요`];
     return P.g.left?['check',`지금까지 충족 · 졸업까지 ${P.g.left}년 더 읍 · 면에 살면 돼요`]:['ok','중 · 고 6년 모두 충족']},
   src:['고려대 2027 수시 모집요강 (농어촌 자격)','https://oku.korea.ac.kr/attach/202607/1783652032558_0.pdf']},
  {id:'rural12',cat:'univ',title:'농어촌학생 전형 · 초 · 중 · 고 12년 유형',org:'정원외 · 대학별',tags:['대입','정원외','읍·면'],
   desc:'초 · 중 · 고 12년 전 과정을 농어촌 학교에서 다니고 학생 본인이 그 기간 농어촌에 살았다면 부모 거주와 관계없이 지원할 수 있어요.',
   rule:P=>{const done=6+P.g.done,left=P.g.left;if(P.rural12<Math.min(done,12)&&P.g.done>0)return['no',`초 · 중 · 고 ${done}년 중 읍 · 면 ${P.rural12}년 · 12년 유형은 어려워요`];
     if(P.area.k!=='rural')return['no','지금 주소가 읍 · 면이 아니에요'];return left?['check',`졸업까지 ${left}년 더 읍 · 면 학교를 다니면 돼요`]:['ok','12년 모두 충족']},
   src:['뉴스토마토 (2026.10.28)','https://newstomato.com/ReadNews.aspx?no=1318126']},
  {id:'abroad',cat:'univ',title:'재외국민 특별전형 · 3년 특례',org:'정원외 · 부모 국외근무',tags:['대입','정원외','해외근무'],
   desc:'부모 중 1명이 국외 근무자로 통산 3년(1,095일) 이상 근무하고, 학생이 고교 과정 1개 학년 이상을 해외에서 다닌 경우예요. 해외 파병 · 무관 근무 가족은 대학별 인정 여부를 확인하세요.',
   rule:P=>P.abroad>=1095?['check',`부모 국외근무 ${P.abroad}일 · 학생 해외 재학 요건 확인`]:['no',`부모 국외근무 ${P.abroad}일 · 1,095일부터`],
   src:['세계일보 (2026.8.11)','https://www.segye.com/newsView/20260810515958']},
  {id:'regional',cat:'univ',title:'지역인재전형 (의약계열 등) · 이사 주의',org:'비수도권 대학',tags:['대입','이사 주의'],
   desc:'2022학년도 이후 중학교 입학자는 비수도권에서 중 · 고 6년을 다니고 그 지역에 살아야 지원할 수 있어요. 전학이 잦은 군인 자녀는 수도권으로 옮기면 자격이 끊길 수 있어요.',
   rule:P=>P.area.metro?['no','지금 수도권에 살고 있어요 · 지역인재 요건이 끊길 수 있어요']:P.moves>=2?['check',`이사 ${P.moves}번 · 중 · 고 6년 동안 같은 권역인지 확인하세요`]:['check','비수도권 중 · 고 6년 · 거주 요건 확인'],
   src:['아주경제 (2024.8.28)','https://www.ajunews.com/view/20240828152053894']},
  {id:'adiga',cat:'univ',title:'대학별 직업군인 자녀 전형 더 찾기',org:'대입정보포털 어디가 (대교협)',tags:['대입','검색'],
   desc:'여러 대학이 고른기회 · 사회통합 · 사회공헌자 전형에 직업군인 자녀를 넣어요. 어디가에서 대학별 모집요강을 검색하세요.',
   rule:P=>P.active&&P.years>=15?['check','15년 이상 · 대상 전형이 많아요']:['check','복무연수 기준(보통 15년 이상)을 확인하세요'],
   src:['대입정보포털 어디가','https://www.adiga.kr']}
];

/* ---------- 렌더 ---------- */
let cat='all';
function readP(){const n=id=>Math.max(0,+$('#'+id).value||0);const addr=$('#e-addr').value;
  return{years:n('e-years'),active:$('#e-active').checked,g:GR[$('#e-grade').value],rural6:n('e-rural6'),rural12:n('e-rural12'),parent:$('#e-parentrural').checked,abroad:n('e-abroad'),moves:n('e-moves'),area:areaType(addr)}}
function render(){
  const P=readP();
  const a=P.area,box=$('#e-area');
  box.dataset.k=a.k;box.innerHTML=a.k==='rural'?`<b>농어촌 지역</b> · '${a.w}' (읍 · 면)`:a.k==='urban'?`<b>도시 지역</b> · '${a.w}' (동) · 농어촌 전형 해당 없음`:'읍 · 면 · 동까지 입력하면 농어촌 여부를 알려줘요';
  const q=$('#p-q').value.replace(/\s/g,'');
  const lab={ok:'● 지원 가능',check:'◐ 확인 필요',no:'○ 해당 없음'},col={ok:'var(--ok)',check:'var(--warn)',no:'var(--dim)'};
  const list=PROGRAMS.filter(p=>cat==='all'||p.cat===cat).filter(p=>!q||(p.title+p.org+p.desc+p.tags.join('')).replace(/\s/g,'').includes(q))
    .map(p=>{const [s,why]=p.rule(P);return{...p,s,why}}).sort((x,y)=>({ok:0,check:1,no:2}[x.s]-{ok:0,check:1,no:2}[y.s]));
  $('#programs').innerHTML=list.length?list.map(p=>`<div class="ecard" data-s="${p.s}">
    <span class="st" style="color:${col[p.s]}">${lab[p.s]}</span><h4>${p.title}</h4><span class="src" style="color:var(--muted)">${p.org}</span>
    <span class="why">${p.why}</span><p>${p.desc}</p>
    <div class="tags">${p.tags.map(t=>`<span class="t">${t}</span>`).join('')}</div>
    <a class="src" href="${p.src[1]}" target="_blank" rel="noopener">출처 · ${p.src[0]} ↗</a></div>`).join(''):'<p class="empty">검색어에 맞는 전형이 없어요.</p>';
  try{const s={};['e-years','e-grade','e-addr','e-rural6','e-rural12','e-abroad','e-moves'].forEach(id=>s[id]=$('#'+id).value);s.active=$('#e-active').checked;s.parent=$('#e-parentrural').checked;localStorage.setItem('anbu-edu',JSON.stringify(s))}catch(e){}
}
try{const s=JSON.parse(localStorage.getItem('anbu-edu')||'null');if(s){Object.keys(s).forEach(k=>{const el=$('#'+k);if(el)el.value=s[k]});$('#e-active').checked=s.active!==false;$('#e-parentrural').checked=s.parent!==false}}catch(e){}
$('#eform').addEventListener('input',render);$('#eform').addEventListener('change',render);$('#eform').addEventListener('submit',e=>e.preventDefault());
$('#p-q').addEventListener('input',render);
$('#p-cat').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;$('#p-cat').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
render();
})();
