/* =====================================================================
 * 안부 AI — 등기부등본 해석 · 특약 점검 · AI 상담 (화면 쪽)
 * - 실제 AI 호출은 서버 함수 /api/ai 가 해요 (Claude API 키는 서버에만 있어요).
 * - 서버에 키가 없거나 파일을 직접 연 경우(file://)에는 '예시 모드'로 예시 결과를 보여줘요.
 * - AI가 돌려준 글은 전부 esc()로 이스케이프한 뒤에 화면에 넣어요.
 * ===================================================================== */
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API='api/ai';
const MAX_FILE=3*1024*1024;
let live=false;   // 서버에 AI 키가 연결돼 있는지

/* ---------- 예시 서류와 예시 결과 (가상의 내용) ---------- */
const SAMPLE={
registry:`[예시] 등기사항전부증명서 (집합건물) — 가상의 서류입니다

【 표제부 】 (전유부분의 건물의 표시)
경기도 ○○시 ○○동 123  ○○빌 제3층 제302호
철근콘크리트구조 다세대주택 49.50㎡

【 갑 구 】 (소유권에 관한 사항)
1  소유권보존  2019년3월5일  소유자 주식회사 ○○건설
2  소유권이전  2021년7월12일  매매  소유자 김○○  거래가액 금230,000,000원
3  소유권이전  2024년5월20일  신탁  수탁자 ○○부동산신탁 주식회사 (신탁원부 제2024-1234호)

【 을 구 】 (소유권 이외의 권리에 관한 사항)
1  근저당권설정  2021년7월12일  채권최고액 금156,000,000원  채무자 김○○  근저당권자 ○○은행
2  근저당권설정  2023년11월3일  채권최고액 금60,000,000원  채무자 김○○  근저당권자 ○○캐피탈`,
terms:`[예시] 특약사항 — 가상의 계약서입니다

1. 임차인은 계약 기간 중 임대인의 동의 없이 전대할 수 없다.
2. 임대인은 잔금일까지 현재 등기부 상태를 유지한다.
3. 임차인은 전세보증보험 가입에 임대인이 협조하지 않더라도 이의를 제기하지 않는다.
4. 퇴거 시 도배 · 장판 비용은 임차인이 부담한다.`};

const DEMO={
registry:{is_registry:true,grade:'danger',headline:'집이 신탁회사 명의이고, 근저당이 2건(합계 2억 1,600만 원) 잡혀 있어요. 지금 상태로는 계약하면 안 돼요.',senior_debt_manwon:21600,
 findings:[
  {part:'갑구',level:'danger',title:'소유권이 신탁회사로 넘어가 있어요',plain:'2024년 5월부터 이 집의 법적 주인은 신탁회사예요. 김○○ 씨는 신탁회사 동의 없이 전세 계약을 맺을 권한이 없을 수 있어요.',action:'등기소에서 신탁원부를 떼어 임대 권한이 누구에게 있는지 확인하고, 신탁회사의 서면 동의가 없으면 계약하지 마세요.'},
  {part:'을구',level:'danger',title:'근저당이 2건, 합계 2억 1,600만 원이에요',plain:'은행과 캐피탈이 나보다 먼저 돈을 받아 가요. 2021년 거래가(2억 3,000만 원)에 거의 맞먹는 금액이라, 집이 경매로 넘어가면 보증금이 남지 않을 수 있어요.',action:'잔금과 동시에 근저당을 말소한다는 특약을 넣고, 말소되지 않으면 계약을 해제할 수 있게 하세요.'},
  {part:'을구',level:'caution',title:'캐피탈(2금융권) 대출이 추가됐어요',plain:'2023년에 캐피탈 대출이 더해졌어요. 집주인의 자금 사정이 넉넉하지 않다는 신호일 수 있어요.',action:'집주인의 국세 · 지방세 완납증명서를 요청하세요.'},
  {part:'표제부',level:'ok',title:'용도는 다세대주택이에요',plain:'주거용 건물이라 전세보증보험 가입 대상이 될 수 있어요. 다만 위 문제 때문에 실제 가입은 거절될 가능성이 커요.',action:'계약 전에 보증보험 가입이 되는지 HUG에 먼저 물어보세요.'}],
 todo:['신탁원부를 발급받아 임대 권한과 신탁회사 동의 여부 확인','주변 실거래가로 현재 시세 확인 (깡통전세 계산기에 넣어 보기)','전세보증보험 가입 가능 여부를 HUG에 사전 문의','확인이 끝나기 전에는 가계약금도 보내지 않기']},
terms:{grade:'danger',headline:'세입자를 지키는 핵심 조항이 빠져 있고, 보증보험을 포기하게 만드는 불리한 조항이 있어요.',
 present:[{title:'잔금일까지 등기부 상태 유지',quote:'임대인은 잔금일까지 현재 등기부 상태를 유지한다.'}],
 missing:[
  {title:'잔금일 다음 날까지 근저당 설정 금지',why:'전입신고 효력은 다음 날 0시에 생겨요. 잔금 당일에 대출이 잡히면 내 순위가 은행보다 밀려요.',suggested:'임대인은 잔금 지급일 다음 날까지 근저당권 등 새로운 권리를 설정하지 않으며, 이를 위반하면 임차인은 계약을 해제할 수 있고 임대인은 보증금 전액을 즉시 반환한다.'},
  {title:'전세보증보험 가입 불가 시 계약 해제',why:'보증보험은 보증금을 지키는 마지막 안전장치예요.',suggested:'임대인은 임차인의 전세보증금 반환보증 가입에 필요한 절차에 협조하며, 임대인 또는 목적물의 사유로 가입이 거절되면 계약은 무효로 하고 임대인은 받은 돈 전액을 즉시 반환한다.'},
  {title:'임대인 변경 시 사전 고지',why:'계약 뒤에 집을 재산 없는 사람에게 넘기는 수법(바지 집주인)을 막아요.',suggested:'임대인은 목적물을 매매하려면 사전에 임차인에게 알려야 하며, 임차인이 원하면 계약을 해지하고 보증금을 반환받을 수 있다.'}],
 risky:[
  {quote:'임차인은 전세보증보험 가입에 임대인이 협조하지 않더라도 이의를 제기하지 않는다.',why:'보증보험 가입을 사실상 포기하게 만드는 조항이에요.',fix:'이 조항은 삭제하고, 위의 보증보험 협조 조항으로 바꾸세요.'},
  {quote:'퇴거 시 도배 · 장판 비용은 임차인이 부담한다.',why:'일반적인 생활 마모(통상의 손모)는 원래 집주인 부담이에요.',fix:"'임차인의 고의 · 과실로 인한 훼손에 한해 임차인이 부담한다'로 고치세요."}]},
chat:{
 '내 조건이면 뭐부터 해야 해?':'**1. 청약 자격부터 확인하세요.** 10년 이상 장기복무라면 수도권 단지에 \'기타지역(수도권) 거주자\' 자격으로 청약할 수 있어요.\n**2. 가점을 올릴 수 있는지 보세요.** 무주택 기간 · 부양가족 · 통장 가입기간으로 84점 만점이에요. 관사에 살아도 무주택 기간은 이어져요.\n**3. 당장 살 집은 지원 방식을 비교하세요.** 관사, 전세자금 지원, 주택수당 중에서 골라요. 상한과 금액은 부대 인사과 · 국군복지단 공지로 확인하세요.\n\n위쪽 **청약 찾기**에서 반경 안 분양 일정을 바로 볼 수 있어요.',
 '관사에 살면 무주택 기간이 인정돼?':'네, 인정돼요. 관사 · 간부숙소는 내 집이 아니라서 **관사에 사는 동안에도 무주택 기간은 계속 쌓여요.** 다만 무주택은 세대 전원 기준이라 배우자 명의 집이 있으면 해당하지 않아요. 무주택 기간 점수는 만 30세 또는 혼인신고일 중 빠른 날부터 계산해요.\n\n**청약 찾기**의 가점 패널에서 내 점수를 확인해 보세요.',
 '전입신고는 언제 해야 안전해?':'**잔금을 치른 당일에 바로** 전입신고와 확정일자를 받으세요. 전입신고의 대항력은 **다음 날 0시**에 생기기 때문에, 그 사이에 집주인이 대출을 받으면 내 순위가 밀릴 수 있어요. 그래서 계약서에 \'잔금일 다음 날까지 근저당 설정 금지\' 특약을 꼭 넣어야 해요.\n\n**AI 특약 점검**에 계약서 특약을 넣으면 이 조항이 있는지 확인해 드려요.',
 '깡통전세는 어떻게 피해?':'**1. 전세가율을 계산하세요.** (선순위 빚 + 내 보증금) ÷ 집 시세가 70% 이하면 비교적 안전하고, 80%를 넘으면 위험해요.\n**2. 등기부등본 을구의 근저당을 확인하세요.**\n**3. 전세보증보험에 가입되는 집만 계약하세요.**\n\n아래 **깡통전세 계산기**에 숫자를 넣어 보거나, **AI 등기부 해석**에 등기부등본을 넣어 보세요.'}
};

/* ---------- 연결 상태 ---------- */
const flag=$('#ai-flag');
function setFlag(){flag.textContent=live?'AI 연결됨':'예시 모드';flag.className='ai-flag '+(live?'on':'demo');
  flag.title=live?'Claude API에 연결돼 있어요.':'AI 키가 연결되지 않아 예시 결과를 보여줘요.'}
(async()=>{try{const r=await fetch(API,{cache:'no-store'});const j=await r.json();live=!!(r.ok&&j.ready)}catch(e){live=false}setFlag()})();

/* ---------- 탭 ---------- */
const TABS=['registry','terms','chat'];
function selectTab(k){TABS.forEach(t=>{$('#ai-t-'+t).setAttribute('aria-selected',t===k);$('#ai-p-'+t).hidden=t!==k})}
TABS.forEach(t=>$('#ai-t-'+t).addEventListener('click',()=>selectTab(t)));

/* ---------- 서버 호출 (줄 단위 JSON 스트림) ---------- */
class DemoMode extends Error{}
async function callAI(payload,onDelta){
  let res;
  try{res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})}
  catch(e){throw new DemoMode()}
  if(res.status===503||res.status===404||res.status===405){live=false;setFlag();throw new DemoMode()}
  if(!res.ok){let m='요청을 처리하지 못했어요.';try{m=(await res.json()).m||m}catch(e){}throw new Error(m)}
  const reader=res.body.getReader(),dec=new TextDecoder();let buf='',full='',done=false;
  for(;;){const{value,done:end}=await reader.read();if(value)buf+=dec.decode(value,{stream:true});
    let i;while((i=buf.indexOf('\n'))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!line)continue;
      const ev=JSON.parse(line);
      if(ev.t==='delta'){full+=ev.v;onDelta&&onDelta(full)}
      else if(ev.t==='error')throw new Error(ev.m);
      else if(ev.t==='done')done=true}
    if(end)break}
  if(!done)throw new Error('연결이 중간에 끊겼어요. 다시 시도해 주세요.');
  return full}

const maskIds=s=>s.replace(/(\d{6})\s?[-–]\s?[1-8]\d{6}/g,'$1-*******');
const readFile=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]||'');r.onerror=()=>no(new Error('파일을 읽지 못했어요.'));r.readAsDataURL(f)});
const won=m=>{const e=Math.floor(m/10000),r=m%10000;return (e?e+'억 ':'')+(r?r.toLocaleString()+'만 ':'')+'원'};

/* ---------- 서류 분석 공통 (등기부 · 특약) ---------- */
const GRADE={safe:['안전','ok'],caution:['주의','warn'],danger:['위험','bad'],unknown:['판단 불가','dim']};
const STEPS=['서류를 읽는 중','위험 신호를 찾는 중','쉬운 말로 정리하는 중'];
function loading(out){let n=0;out.innerHTML=`<div class="ai-load"><i></i><span>${STEPS[0]}…</span></div>`;
  const span=out.querySelector('span');const t=setInterval(()=>{n=Math.min(n+1,STEPS.length-1);span.textContent=STEPS[n]+'…'},3500);
  return {stop:()=>clearInterval(t),progress:len=>{span.textContent=`결과를 받는 중… (${len.toLocaleString()}자)`}}}
const head=(d,demo)=>{const[g,c]=GRADE[d.grade]||GRADE.unknown;
  return `${demo?'<div class="ai-demo"><b>예시</b> AI 키가 연결되지 않아 예시 서류의 분석 결과를 보여줘요.</div>':''}
  <div class="ai-grade" data-g="${c}"><span>${g}</span><strong>${esc(d.headline)}</strong></div>`};
const foot=demo=>`<p class="ai-meta">${demo?'예시 결과':'Claude AI 분석'} · 참고용이에요. 계약 전에 원본 서류와 공식 기관에서 다시 확인하세요.</p>`;

function renderRegistry(out,d,demo){
  if(d.is_registry===false){out.innerHTML=`<div class="ai-grade" data-g="dim"><span>판단 불가</span><strong>${esc(d.headline||'등기부등본으로 보이지 않아요. 표제부 · 갑구 · 을구가 보이게 다시 넣어 주세요.')}</strong></div>`;return}
  const LV={ok:'ok',caution:'warn',danger:'bad'};
  const debt=Number.isInteger(d.senior_debt_manwon)&&d.senior_debt_manwon>0?
    `<div class="ai-debt"><span>살아 있는 근저당 합계 <b>${won(d.senior_debt_manwon)}</b></span><button type="button" class="btn" id="ai-to-calc">깡통전세 계산기에 넣기 →</button></div>`:'';
  out.innerHTML=head(d,demo)+debt+
    (d.findings||[]).map(f=>`<article class="ai-find" data-l="${LV[f.level]||'warn'}"><span class="part">${esc(f.part)}</span><h4>${esc(f.title)}</h4><p>${esc(f.plain)}</p><p class="act"><b>할 일</b> ${esc(f.action)}</p></article>`).join('')+
    ((d.todo||[]).length?`<div class="ai-todo"><b>계약 전에 할 일</b><ol>${d.todo.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`:'')+foot(demo);
  const b=$('#ai-to-calc');if(b)b.addEventListener('click',()=>{const el=$('#c-debt');el.value=d.senior_debt_manwon;el.dispatchEvent(new Event('input',{bubbles:true}));
    $('#calc').scrollIntoView({behavior:'smooth',block:'center'});el.focus({preventScroll:true})})}

function renderTerms(out,d,demo){
  const sec=(t,cls,items,fn)=>items&&items.length?`<div class="ai-sec ${cls}"><h4>${t} <small>${items.length}</small></h4>${items.map(fn).join('')}</div>`:'';
  out.innerHTML=head(d,demo)+
    sec('불리한 조항','bad',d.risky,x=>`<div class="ai-row"><q>${esc(x.quote)}</q><p>${esc(x.why)}</p><p class="act"><b>고치기</b> ${esc(x.fix)}</p></div>`)+
    sec('빠진 보호 조항','warn',d.missing,(x,i)=>`<div class="ai-row"><h5>${esc(x.title)}</h5><p>${esc(x.why)}</p><div class="ai-copy"><p>${esc(x.suggested)}</p><button type="button" class="btn" data-copy="${i}">문구 복사</button></div></div>`)+
    sec('들어 있는 보호 조항','ok',d.present,x=>`<div class="ai-row"><h5>${esc(x.title)}</h5><q>${esc(x.quote)}</q></div>`)+foot(demo);
  out.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(d.missing[+b.dataset.copy].suggested);b.textContent='복사됨 ✓'}catch(e){b.textContent='복사 실패'}
    setTimeout(()=>b.textContent='문구 복사',1800)}))}

const RENDER={registry:renderRegistry,terms:renderTerms};
function setupDoc(mode){
  const form=$('#ai-f-'+mode),ta=$('#ai-'+mode+'-text'),fi=$('#ai-'+mode+'-file'),nm=$('#ai-'+mode+'-name'),out=$('#ai-o-'+mode),btn=form.querySelector('[type=submit]');
  fi.addEventListener('change',()=>{const f=fi.files[0];nm.textContent=f?`${f.name} (${(f.size/1048576).toFixed(1)}MB)`:''});
  form.querySelector('[data-sample]').addEventListener('click',()=>{ta.value=SAMPLE[mode];fi.value='';nm.textContent='';ta.focus()});
  form.addEventListener('submit',async e=>{e.preventDefault();
    const text=maskIds(ta.value.trim()),file=fi.files[0];
    if(!file&&text.length<10){out.innerHTML='<p class="ai-err">분석할 내용을 붙여넣거나 파일을 올려 주세요. <b>예시 불러오기</b>로 먼저 체험할 수 있어요.</p>';return}
    if(file&&file.size>MAX_FILE){out.innerHTML='<p class="ai-err">파일이 3MB를 넘어요. 필요한 쪽만 캡처해서 올리거나 글자를 붙여넣어 주세요.</p>';return}
    btn.disabled=true;const ld=loading(out);
    try{
      const payload={mode,text};
      if(file)payload.file={type:file.type,data:await readFile(file)};
      const raw=await callAI(payload,full=>ld.progress(full.length));
      ld.stop();RENDER[mode](out,JSON.parse(raw),false);
    }catch(err){ld.stop();
      if(err instanceof DemoMode)RENDER[mode](out,DEMO[mode],true);
      else out.innerHTML=`<p class="ai-err">${esc(err instanceof SyntaxError?'AI 답변을 읽지 못했어요. 다시 시도해 주세요.':err.message)}</p>`}
    btn.disabled=false;
    if(matchMedia('(max-width:900px)').matches)out.scrollIntoView({behavior:'smooth',block:'start'})})}
setupDoc('registry');setupDoc('terms');

/* ---------- AI 상담 ---------- */
const log=$('#ai-chat-log'),qIn=$('#ai-chat-q'),chatForm=$('#ai-f-chat'),sendBtn=chatForm.querySelector('button');
let history=[],busy=false;
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^\s*[-*]\s+/gm,'• ').replace(/\n/g,'<br>');
function bubble(role,html){const d=document.createElement('div');d.className='bub '+role;d.innerHTML=`<p>${html}</p>`;log.appendChild(d);log.scrollTop=log.scrollHeight;return d.firstChild}

function context(){
  const val=id=>{const el=document.getElementById(id);return el?el.value:''},on=id=>{const el=document.getElementById(id);return !!(el&&el.checked)},
    opt=id=>{const el=document.getElementById(id);return el&&el.selectedOptions[0]?el.selectedOptions[0].textContent.trim():''};
  const L=[`신분: ${opt('p-status')}, 복무 ${val('p-years')}년`,
    `세대 전원 무주택: ${on('p-homeless')?'예':'아니오'}, 무주택 기간 ${val('p-hy')}년, 청약통장 ${val('p-bank')}개월`,
    `부양가족 ${val('p-dep')}명, 미성년 자녀 ${val('p-kids')}명, ${on('p-married')?`기혼(혼인 ${val('p-my')}년)`:'미혼'}`];
  if(val('p-base')!=='custom'&&opt('p-base'))L.push(`기준 동네: ${opt('p-base')}, 검색 반경 ${val('p-radius')}km`);
  const sc=document.querySelector('#score .total strong');if(sc)L.push(`사이트가 계산한 청약 가점: ${sc.textContent.trim()}점 / 84점`);
  const H=(window.ANBU_CONFIG||{}).housing;
  if(H){L.push('사이트 설정값(확인 필요) — 전세 지원 상한: '+Object.values(H.grades).map(g=>`${g.label}(${g.area}) ${won(g.cap)}`).join(', '));
    L.push(`사이트 설정값(확인 필요) — 주택수당 월 ${H.allowance.min}~${H.allowance.max}만 원, 월세자금대출 금리 예시 ${H.monthlyLoanRate}%`)}
  return L.join('\n')}

async function ask(q){
  q=maskIds(q.trim());if(!q||busy)return;
  busy=true;sendBtn.disabled=true;qIn.value='';
  bubble('me',esc(q));
  const p=bubble('ai','<span class="dots"><i></i><i></i><i></i></span>');
  history.push({role:'user',content:q});
  if(history.length>15)history=history.slice(history.length-15);   // 항상 홀수 개 → 사용자 질문으로 시작
  try{
    const payload={mode:'chat',messages:history};
    if($('#ai-chat-ctx').checked)payload.context=context();
    let raf=0,latest='';
    const full=await callAI(payload,t=>{latest=t;if(!raf)raf=requestAnimationFrame(()=>{raf=0;p.innerHTML=md(latest);log.scrollTop=log.scrollHeight})});
    cancelAnimationFrame(raf);p.innerHTML=md(full);history.push({role:'assistant',content:full});
  }catch(err){history.pop();
    if(err instanceof DemoMode){const a=DEMO.chat[q];
      p.innerHTML=a?`<span class="sim">예시 답변</span><br>${md(a)}`:'<span class="sim">예시 모드</span><br>지금은 AI 키가 연결되지 않아서 자유 질문에는 답하지 못해요. 위의 예시 질문을 눌러 보세요.'}
    else{p.classList.add('ai-err');p.textContent=err.message}}
  log.scrollTop=log.scrollHeight;busy=false;sendBtn.disabled=false}

chatForm.addEventListener('submit',e=>{e.preventDefault();ask(qIn.value)});
$('#ai-chat-chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b)ask(b.textContent)});
$('#ai-chat-reset').addEventListener('click',()=>{history=[];log.querySelectorAll('.bub:not(:first-child)').forEach(n=>n.remove())});

/* ---------- 어디서든 AI에게 묻기 버튼 ---------- */
const fab=document.createElement('a');fab.className='ai-fab';fab.href='#ai';fab.innerHTML='<b>AI</b> 물어보기';
fab.addEventListener('click',()=>{selectTab('chat');setTimeout(()=>qIn.focus({preventScroll:true}),400)});
document.body.appendChild(fab);
if('IntersectionObserver' in window)new IntersectionObserver(es=>fab.classList.toggle('hide',es[0].isIntersecting),{threshold:.05}).observe($('#ai'));
})();
