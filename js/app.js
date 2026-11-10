/* ---------- clock ---------- */
(function(){const el=document.getElementById('clock');function t(){const d=new Date(Date.now()+9*3600e3);el.textContent='KST '+d.toISOString().slice(11,19)}t();setInterval(t,1000)})();

/* ---------- radar hero ---------- */
(function(){
  const cv=document.getElementById('radar'),ctx=cv.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w,h,dpr,blips=[];
  function size(){dpr=Math.min(2,devicePixelRatio||1);w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    blips=Array.from({length:26},()=>({a:Math.random()*Math.PI*2,r:.15+Math.random()*.8,risk:Math.random()}))}
  size();addEventListener('resize',size);
  let ang=0;
  function draw(){
    ctx.clearRect(0,0,w,h);
    const cx=w*.7,cy=h*.42,R=Math.min(w,h)*.62;
    ctx.strokeStyle='rgba(63,208,224,.10)';ctx.lineWidth=1;
    for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
    for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    ctx.strokeStyle='rgba(63,208,224,.35)';
    for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,R*i/4,0,Math.PI*2);ctx.stroke()}
    ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
    const g=ctx.createConicGradient?ctx.createConicGradient(ang,cx,cy):null;
    if(g){g.addColorStop(0,'rgba(63,208,224,.35)');g.addColorStop(.12,'rgba(63,208,224,0)');g.addColorStop(1,'rgba(63,208,224,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,ang-Math.PI*0.0,ang+Math.PI*2);ctx.fill()}
    blips.forEach(b=>{
      let d=((ang-b.a)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
      const life=reduce?1:Math.max(0,1-d/(Math.PI*1.6));
      const x=cx+Math.cos(b.a)*b.r*R,y=cy+Math.sin(b.a)*b.r*R;
      const c=b.risk>.82?'242,85,74':b.risk>.6?'242,169,59':'63,208,224';
      ctx.fillStyle=`rgba(${c},${.25+life*.75})`;ctx.beginPath();ctx.arc(x,y,2.5+life*2,0,Math.PI*2);ctx.fill();
      if(b.risk>.82&&life>.2){ctx.strokeStyle=`rgba(${c},${life})`;ctx.strokeRect(x-8,y-8,16,16);
        ctx.font='10px "IBM Plex Mono",monospace';ctx.fillText('RISK '+Math.round(70+b.risk*25)+'%',x+12,y-6)}
    });
    ctx.fillStyle='rgba(126,144,158,.8)';ctx.font='10px "IBM Plex Mono",monospace';
    ctx.fillText('SCAN // JEONSE RISK SWEEP',16,22);ctx.fillText('AZ '+((ang*180/Math.PI)%360).toFixed(1).padStart(5,'0')+'°',16,36);
    if(!reduce){ang+=.012;requestAnimationFrame(draw)}
  }
  draw();
})();

/* ---------- checklist ---------- */
const CHECK=[
  {g:"집 확인하기",note:"등기부등본 · 건축물대장",items:[
    {t:"등기부등본 '갑구'의 소유자가 계약하는 집주인과 같다",d:"인터넷등기소에서 700원이면 열람할 수 있어요.",w:10,must:true},
    {t:"'을구'의 근저당 금액을 확인했고, 크지 않다",d:"근저당은 나보다 먼저 돈을 받아 가는 빚이에요.",w:9,must:true},
    {t:"신탁 · 가압류 · 경매 기록이 없다",d:"'신탁'이 있으면 집주인에게 계약 권한이 없을 수 있어요.",w:9,must:true},
    {t:"주변 실거래가로 시세를 확인했다",d:"국토부 실거래가 공개시스템에서 같은 단지 · 동네를 검색해요.",w:7},
    {t:"건축물대장에 '위반건축물'이나 주거용이 아닌 용도가 없다",d:"근린생활시설(상가)이면 보증보험 가입이 어려워요.",w:6}]},
  {g:"사람 확인하기",note:"집주인 · 중개사",items:[
    {t:"집주인 신분증 진위를 확인했다",d:"정부24 또는 ARS 1382로 확인할 수 있어요.",w:6},
    {t:"대리인이라면 위임장 · 인감증명서를 받고 집주인과 직접 통화했다",d:"대리 계약은 사기가 가장 많이 끼어드는 지점이에요.",w:7},
    {t:"공인중개사 등록 여부를 조회했다",d:"국가공간정보포털 '부동산중개업 조회'에서 확인해요.",w:6},
    {t:"집주인의 세금 체납이 없다",d:"체납 세금은 내 보증금보다 먼저 빠져나갈 수 있어요.",w:6}]},
  {g:"계약 · 입주하기",note:"계약서 · 잔금 · 전입",items:[
    {t:"전세보증보험 가입이 가능한 집인지 확인했다",d:"HUG · HF · SGI 중 한 곳이라도 가입이 되는지 미리 물어보세요.",w:9,must:true},
    {t:"특약에 '잔금일 다음날까지 근저당 설정 금지'를 넣었다",d:"어기면 계약 해지 · 보증금 반환한다는 문구도 함께 넣어요.",w:7},
    {t:"보증금은 등기부상 집주인 명의 계좌로 보낸다",d:"중개사나 대리인 계좌로 보내면 안 돼요.",w:6},
    {t:"잔금 당일에 등기부등본을 다시 뽑아봤다",d:"계약일과 잔금일 사이에 대출이 잡히는 경우가 있어요.",w:6},
    {t:"잔금 당일 전입신고 + 확정일자를 받는다",d:"이게 있어야 '대항력'과 '우선변제권'이 생겨요.",w:6,must:true}]}
];
const TOTAL=CHECK.flatMap(x=>x.items).reduce((a,b)=>a+b.w,0);
const groups=document.getElementById('groups');let idx=0;
CHECK.forEach(gr=>{const box=document.createElement('div');box.className='pnl group';
  box.innerHTML=`<div class="pnl-h"><b>${gr.g}</b><span>${gr.note}</span></div>`;
  gr.items.forEach(it=>{const id='chk-'+(idx++);it.id=id;const lab=document.createElement('label');lab.className='item';lab.htmlFor=id;
    lab.innerHTML=`<input type="checkbox" id="${id}"><span><span class="t">${it.t}</span>${it.must?'<span class="tag">필수</span>':''}<span class="d">${it.d}</span></span>`;box.appendChild(lab)});
  groups.appendChild(box)});
const all=CHECK.flatMap(x=>x.items);const KEY='anbu-checks';
try{JSON.parse(localStorage.getItem(KEY)||'[]').forEach(id=>{const e=document.getElementById(id);if(e)e.checked=true})}catch(e){}
function update(){let sc=0;const miss=[],done=[];
  all.forEach(it=>{const on=document.getElementById(it.id).checked;if(on){sc+=it.w;done.push(it.id)}else if(it.must)miss.push(it.t)});
  const pct=Math.round(sc/TOTAL*100);let st,msg,col;
  if(!done.length){st='답장 대기 중';msg='체크리스트를 하나씩 확인해 보세요.';col='var(--muted)'}
  else if(!miss.length&&pct>=85){st='잘 지내요';msg='필수 항목을 모두 확인했어요. 이 집은 안녕한 편이에요. 잔금일까지 긴장을 놓지 마세요.';col='var(--ok)'}
  else if(miss.length<=1&&pct>=55){st='조금 걱정돼요';msg='대부분 확인했지만 빠진 부분이 있어요. 계약 전에 꼭 채워 주세요.';col='var(--warn)'}
  else{st='안부가 불안해요';msg='확인하지 않은 위험 신호가 많아요. 아직 계약금을 보내지 마세요.';col='var(--bad)'}
  const s=document.getElementById('status');s.textContent=st;s.style.color=col;document.getElementById('msg').textContent=msg;
  const bar=document.getElementById('bar');bar.style.width=pct+'%';bar.style.background=col==='var(--muted)'?'var(--cyan)':col;
  document.getElementById('score').textContent=pct+' / 100';
  const m=document.getElementById('missing');
  if(miss.length){m.dataset.empty='false';m.innerHTML='<b>미확인 필수 항목</b><ul>'+miss.map(x=>`<li>${x}</li>`).join('')+'</ul>'}
  else{m.dataset.empty='true';m.innerHTML='<b>필수 항목 모두 확인 완료</b>'}
  try{localStorage.setItem(KEY,JSON.stringify(done))}catch(e){}}
groups.addEventListener('change',update);
document.getElementById('reset').addEventListener('click',()=>{all.forEach(it=>document.getElementById(it.id).checked=false);update()});
update();

function calc(){const p=+document.getElementById('c-price').value||0,d=+document.getElementById('c-debt').value||0,b=+document.getElementById('c-dep').value||0;
  const box=document.getElementById('ratio');
  if(p<=0){document.getElementById('r-val').textContent='—';document.getElementById('r-msg').textContent='집 시세를 입력해 주세요.';box.dataset.level='';return}
  const r=Math.round((d+b)/p*100);document.getElementById('r-val').textContent=r+'%';let lv,ms;
  if(r<=70){lv='ok';ms='비교적 안전한 편이에요. 그래도 등기부등본은 꼭 확인하세요.'}
  else if(r<=80){lv='warn';ms='주의 구간이에요. 집값이 조금만 떨어져도 보증금이 위험할 수 있어요.'}
  else{lv='bad';ms='깡통전세 위험! 보증금을 돌려받지 못할 가능성이 커요.'}
  box.dataset.level=lv;document.getElementById('r-msg').textContent=ms}
['c-price','c-debt','c-dep'].forEach(id=>document.getElementById(id).addEventListener('input',calc));calc();

const FRAUD=[
  {n:"깡통전세",lv:"HIGH",h:"집값보다 보증금과 빚을 합친 금액이 더 커서, 집이 경매로 팔려도 보증금을 다 돌려받지 못해요. 신축 빌라에서 특히 많아요.",g:"전세가율 계산기로 70%를 넘는지 보고, 전세보증보험 가입이 되는 집만 계약하세요."},
  {n:"이중계약",lv:"HIGH",h:"한 집을 여러 사람에게 동시에 세 놓거나, 월세 계약을 전세로 속여 보증금을 따로 챙겨요.",g:"보증금은 등기부상 집주인 계좌로만 보내고, 확정일자 부여 현황을 확인하세요."},
  {n:"신탁 사기",lv:"MED",h:"집 소유권이 신탁회사에 넘어가 있는데, 원래 집주인이 마치 자기 집인 것처럼 계약해요.",g:"등기부 갑구에 '신탁'이 보이면 신탁원부를 떼어 보고, 신탁회사 동의서 없이는 계약하지 마세요."},
  {n:"바지 집주인",lv:"MED",h:"계약 직후 집을 재산이 없는 사람에게 넘겨서, 만기에 보증금을 돌려줄 사람이 사라져요.",g:"특약에 '임대인 변경 시 사전 고지, 동의 없으면 해지 가능'을 넣고 보증보험에 가입하세요."},
  {n:"가짜 집주인 · 대리인",lv:"HIGH",h:"위조 신분증이나 가짜 위임장으로 집주인 행세를 하며 계약금을 받아 사라져요.",g:"신분증 진위 확인, 인감증명서 확인, 집주인과 직접 영상통화를 하세요."},
  {n:"잔금일 대출 끼워넣기",lv:"MED",h:"잔금일 당일에 집주인이 몰래 대출을 받아, 내 순위가 은행보다 밀려나요.",g:"전입신고 효력은 다음날 0시에 생겨요. '잔금일 다음날까지 근저당 금지' 특약을 꼭 넣으세요."}];
document.getElementById('fraudList').innerHTML=FRAUD.map((f,i)=>`<details class="pnl fcard"><summary><span class="lv" style="color:${f.lv==='HIGH'?'var(--bad)':'var(--warn)'}">${f.lv==='HIGH'?'위험 높음':'주의'}</span><h3>${f.n}</h3></summary><div class="pnl-b"><p class="how">${f.h}</p><p class="guard"><b>막는 법</b> · ${f.g}</p></div></details>`).join('');

const STEPS=[
  {n:"집 알아보기",w:"계약 2~4주 전",l:["지역 탐색으로 시세 · 지역 파악하기","등기부등본 · 건축물대장 미리 열람하기","공인중개사 등록 여부 조회하기","보증보험 가입 가능 여부 물어보기"]},
  {n:"계약하는 날",w:"계약 당일",l:["집주인 신분증 · 등기부 소유자 일치 확인","대리인이면 위임장 · 인감증명서 받기","특약 넣기 (근저당 금지, 보증보험 미가입 시 해지 등)","계약금은 집주인 명의 계좌로 송금"]},
  {n:"잔금 치르는 날",w:"이사 당일",l:["등기부등본 다시 뽑아 변동 사항 확인","잔금 송금 후 영수증 받기","관리비 · 공과금 정산하기"]},
  {n:"입주한 날",w:"이사 당일 바로",l:["주민센터 또는 정부24에서 전입신고","확정일자 받기 (전입신고와 함께 가능)","전세보증보험 가입 신청"]},
  {n:"사는 동안",w:"거주 중",l:["계약서 · 영수증 사진으로 백업해 두기","집주인 변경 소식이 있으면 등기부 확인","전입 주소를 함부로 옮기지 않기"]},
  {n:"만기 다가올 때",w:"만기 6~2개월 전",l:["재계약 또는 이사 의사를 문자로 남기기","보증금 반환 일정 확인하기","못 받을 것 같으면 임차권등기명령 신청 후 이사"]}];
document.getElementById('steps').innerHTML=STEPS.map(s=>`<li class="pnl step"><div class="pnl-h"><span>${s.w}</span></div><div class="pnl-b"><h3>${s.n}</h3><ul>${s.l.map(x=>`<li>${x}</li>`).join('')}</ul></div></li>`).join('');

const HELP=[
  {k:"등기부등본 열람",n:"대법원 인터넷등기소",p:"집 주인, 근저당, 신탁 여부를 확인해요.",u:"https://www.iros.go.kr"},
  {k:"시세 확인",n:"국토교통부 실거래가 공개시스템",p:"같은 동네 집이 실제로 얼마에 거래됐는지 봐요.",u:"https://rt.molit.go.kr"},
  {k:"전입신고 · 확정일자",n:"정부24",p:"온라인으로 전입신고와 확정일자를 함께 처리할 수 있어요.",u:"https://www.gov.kr"},
  {k:"보증보험 · 안심전세",n:"주택도시보증공사 (HUG)",p:"전세보증금 반환보증 가입, 안심전세 앱 안내.",tel:"1566-9009",u:"https://www.khug.or.kr"},
  {k:"피해 상담",n:"전세피해지원센터",p:"전세사기 피해가 의심될 때 법률 · 금융 · 주거 상담을 받아요.",tel:"1533-8119"},
  {k:"무료 법률 상담",n:"대한법률구조공단",p:"임차권등기명령, 보증금 반환 소송 등 법률 도움.",tel:"132",u:"https://www.klac.or.kr"}];
document.getElementById('helpList').innerHTML=HELP.map(h=>`<div class="pnl hcard"><div class="pnl-h"><span>${h.k}</span></div><div class="pnl-b"><h3>${h.n}</h3><p>${h.p}</p>${h.tel?`<span class="tel">☎ ${h.tel}</span>`:''}${h.u?`<a href="${h.u}" target="_blank" rel="noopener">${h.u.replace('https://','')} ↗</a>`:''}</div></div>`).join('');
