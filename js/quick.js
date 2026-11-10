/* =====================================================================
 * 안부 — 30초 체험: 나와 비슷한 상황을 고르면 조건을 채우고 '내 안부 리포트'를 보여줘요.
 * 숫자는 아래 청약 찾기 · 집 구하기 화면이 계산한 값을 그대로 읽어 와요.
 * ===================================================================== */
(function(){
const $=s=>document.querySelector(s);
const box=$('#personas'),rep=$('#report');
if(!box||!rep)return;

const P={
  junior:{name:'초급간부',mode:'monthly',
    f:{'p-status':'short','p-years':3,'p-homeless':true,'p-hy':0,'p-bank':24,'p-dep':0,'p-kids':0,'p-married':false,'p-my':0,'r-extra':55,'r-deposit':2000},
    tip:'군인 청약 특례는 장기복무 10년부터 열려요. 지금은 청약통장을 꾸준히 넣고, 주택수당으로 구하는 첫 월세 계약을 안전하게 하는 게 먼저예요.'},
  mid:{name:'장기복무 간부',mode:'jeonse',
    f:{'p-status':'long','p-years':12,'p-homeless':true,'p-hy':5,'p-bank':84,'p-dep':2,'p-kids':1,'p-married':true,'p-my':6},
    tip:'10년을 넘겨서 군인 기관추천 특별공급과 수도권 기타지역 자격이 열렸어요. 관사가 부족하면 전세자금 지원으로 집을 구할 수 있어요.'},
  senior:{name:'고참 간부',mode:'jeonse',
    f:{'p-status':'long','p-years':26,'p-homeless':true,'p-hy':12,'p-bank':180,'p-dep':3,'p-kids':2,'p-married':true,'p-my':20},
    tip:'25년 이상이라 국방부 추천을 받으면 해당지역 거주자로도 청약할 수 있어요. 가점도 높은 편이니 전역 전에 내 집 마련 일정을 잡아 보세요.'},
  vet:{name:'전역 간부',mode:null,
    f:{'p-status':'vet','p-years':11,'p-homeless':true,'p-hy':3,'p-bank':60,'p-dep':0,'p-kids':0,'p-married':false,'p-my':0},
    tip:'전역 뒤에는 관사도 전세 지원도 없어서 계약을 혼자 해야 해요. 장기복무 제대군인 특별공급을 확인하고, 계약 전에 체크리스트와 AI 점검을 꼭 거치세요.'}
};

const num=s=>(String(s||'').match(/\d+/)||['0'])[0];
function apply(k){
  const p=P[k];
  Object.entries(p.f).forEach(([id,v])=>{const el=document.getElementById(id);if(!el)return;if(el.type==='checkbox')el.checked=v;else el.value=v});
  const any=document.getElementById('p-years');
  if(any)any.dispatchEvent(new Event('input',{bubbles:true}));   // 청약 찾기 다시 계산
  if(p.mode){const b=document.getElementById(p.mode==='jeonse'?'m-jeonse':'m-monthly');if(b)b.click()}   // 집 구하기 방식
  box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===k));
  try{localStorage.setItem('anbu-persona',k)}catch(e){}
  render(k)}

function render(k){
  const p=P[k];
  const cards=[...document.querySelectorAll('#elig .ecard')];
  const ok=cards.filter(c=>c.dataset.s==='ok'),chk=cards.filter(c=>c.dataset.s==='check');
  const score=num(($('#score .total strong')||{}).textContent),sites=num(($('#site-count')||{}).textContent),homes=num(($('#r-count')||{}).textContent);
  const radius=(document.getElementById('p-radius')||{}).value||20;
  const mood=ok.length+chk.length>=3?'ok':'idle';
  const tile=(href,n,label,unit)=>`<a class="tile" href="${href}"><strong>${n}<small>${unit||''}</small></strong><span>${label}</span></a>`;
  const t4=p.mode?tile('#support',homes,`예산 안 ${p.mode==='jeonse'?'전세':'월세'} <em>예시</em>`,'건'):tile('#check',14,'계약 전 체크 항목','개');
  const chips=[...ok.map(c=>`<span class="t me">${c.querySelector('h4').textContent}</span>`),...chk.map(c=>`<span class="t mil">${c.querySelector('h4').textContent} · 조건 확인</span>`)].join('');
  rep.innerHTML=`
    <div class="rep-head">${window.anbuFace?anbuFace(mood):''}<div><b>${p.name} 안부 리포트</b><p>${p.tip}</p></div></div>
    <div class="rep-tiles">
      ${tile('#mil',ok.length+chk.length,'지원 가능한 청약 유형','개')}
      ${tile('#mil',score,'청약 가점 (84점 만점)','점')}
      ${tile('#mil',sites,`반경 ${radius}km 분양 <em>예시</em>`,'건')}
      ${t4}
    </div>
    ${chips?`<div class="rep-chips">${chips}</div>`:''}
    <div class="rep-next">
      <a class="btn primary" href="#mil">내 조건으로 자세히 보기 →</a>
      <button type="button" class="btn" id="rep-ask">AI에게 다음 할 일 묻기</button>
      <span class="hint">예시 인물의 값이에요. 아래 ‘내 조건’에서 내 값으로 바꾸면 결과가 바로 달라져요.</span>
    </div>`;
  rep.hidden=false;
  const a=$('#rep-ask');
  if(a)a.addEventListener('click',()=>{location.hash='#ai';if(window.anbuAI)anbuAI.ask('내 조건이면 뭐부터 해야 해?')});
}

box.addEventListener('click',e=>{const b=e.target.closest('button[data-p]');if(b)apply(b.dataset.p)});
})();
