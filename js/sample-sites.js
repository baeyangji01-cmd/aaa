/*
 * 시연용 예시 분양 데이터 (실제 단지 · 실제 일정이 아니에요)
 * 필드: id, name, addr, lat, lon, kind(공공/민영), units, mil10(10년 이상 장기복무군인 기관추천 물량),
 *       vet(장기복무 제대군인 물량), types(특별공급 종류), metro(수도권), reg(규제지역 예시),
 *       notice(모집공고일), spBegin/spEnd(특별공급 접수), r1(1순위 접수), win(당첨자 발표)
 */
window.ANBU_SAMPLE_SITES = [
  {id:'s01',name:'위례 A1-5블록 공공분양',addr:'서울 송파구 거여동 일원 (위례신도시)',lat:37.4780,lon:127.1430,kind:'공공',units:520,mil10:12,vet:6,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:true,notice:'2026-11-12',spBegin:'2026-11-24',spEnd:'2026-11-24',r1:'2026-11-25',win:'2026-12-03'},
  {id:'s02',name:'하남 감일 B-3블록',addr:'경기 하남시 감일동 일원',lat:37.5070,lon:127.1650,kind:'민영',units:812,mil10:15,vet:8,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:true,notice:'2026-11-20',spBegin:'2026-12-01',spEnd:'2026-12-01',r1:'2026-12-02',win:'2026-12-09'},
  {id:'s03',name:'성남 복정2 A-1블록',addr:'경기 성남시 수정구 복정동 일원',lat:37.4620,lon:127.1270,kind:'공공',units:640,mil10:10,vet:5,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:true,notice:'2026-12-03',spBegin:'2026-12-15',spEnd:'2026-12-15',r1:'2026-12-16',win:'2026-12-23'},
  {id:'s04',name:'과천 지식정보타운 S-9',addr:'경기 과천시 갈현동 일원',lat:37.4140,lon:126.9960,kind:'민영',units:433,mil10:8,vet:4,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:true,notice:'2026-11-05',spBegin:'2026-11-17',spEnd:'2026-11-17',r1:'2026-11-18',win:'2026-11-25'},
  {id:'s05',name:'남양주 왕숙 A-8블록',addr:'경기 남양주시 진접읍 일원',lat:37.6600,lon:127.1850,kind:'공공',units:900,mil10:18,vet:9,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2026-12-10',spBegin:'2026-12-22',spEnd:'2026-12-22',r1:'2026-12-23',win:'2026-12-31'},
  {id:'s06',name:'강동 고덕 C-2블록',addr:'서울 강동구 고덕동 일원',lat:37.5660,lon:127.1550,kind:'민영',units:350,mil10:6,vet:3,types:['기관추천','신혼부부','생애최초','다자녀'],metro:true,reg:true,notice:'2027-01-07',spBegin:'2027-01-19',spEnd:'2027-01-19',r1:'2027-01-20',win:'2027-01-27'},
  {id:'s07',name:'광주 역동 2블록',addr:'경기 광주시 역동 일원',lat:37.4150,lon:127.2580,kind:'민영',units:620,mil10:12,vet:6,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2026-11-26',spBegin:'2026-12-07',spEnd:'2026-12-07',r1:'2026-12-08',win:'2026-12-15'},
  {id:'s08',name:'평택 고덕 A-49블록',addr:'경기 평택시 고덕동 일원',lat:37.0500,lon:127.0450,kind:'공공',units:760,mil10:20,vet:10,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2026-12-01',spBegin:'2026-12-11',spEnd:'2026-12-11',r1:'2026-12-14',win:'2026-12-21'},
  {id:'s09',name:'의정부 탑석 3블록',addr:'경기 의정부시 용현동 일원',lat:37.7450,lon:127.0600,kind:'민영',units:540,mil10:15,vet:10,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2026-11-18',spBegin:'2026-11-30',spEnd:'2026-11-30',r1:'2026-12-01',win:'2026-12-08'},
  {id:'s10',name:'파주 운정3 A-23블록',addr:'경기 파주시 동패동 일원',lat:37.7300,lon:126.7400,kind:'공공',units:880,mil10:20,vet:10,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2027-01-14',spBegin:'2027-01-26',spEnd:'2027-01-26',r1:'2027-01-27',win:'2027-02-03'},
  {id:'s11',name:'계룡 대실지구 B-1블록',addr:'충남 계룡시 두마면 일원',lat:36.2930,lon:127.2400,kind:'민영',units:498,mil10:25,vet:12,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:false,reg:false,notice:'2026-12-08',spBegin:'2026-12-18',spEnd:'2026-12-18',r1:'2026-12-21',win:'2026-12-29'},
  {id:'s12',name:'세종 5-1생활권 L3블록',addr:'세종 연기면 일원',lat:36.4740,lon:127.2550,kind:'공공',units:700,mil10:14,vet:7,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:false,reg:false,notice:'2027-01-20',spBegin:'2027-02-01',spEnd:'2027-02-01',r1:'2027-02-02',win:'2027-02-09'},
  {id:'s13',name:'대전 도안 2-5구역',addr:'대전 유성구 학하동 일원',lat:36.3300,lon:127.3350,kind:'민영',units:950,mil10:18,vet:9,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:false,reg:false,notice:'2026-12-15',spBegin:'2026-12-28',spEnd:'2026-12-28',r1:'2026-12-29',win:'2027-01-06'},
  {id:'s14',name:'원주 기업도시 7블록',addr:'강원 원주시 지정면 일원',lat:37.3830,lon:127.8350,kind:'민영',units:600,mil10:15,vet:8,types:['기관추천','신혼부부','생애최초','다자녀'],metro:false,reg:false,notice:'2026-11-30',spBegin:'2026-12-10',spEnd:'2026-12-10',r1:'2026-12-11',win:'2026-12-18'},
  {id:'s15',name:'춘천 동내 2블록',addr:'강원 춘천시 동내면 일원',lat:37.8730,lon:127.7350,kind:'민영',units:450,mil10:12,vet:6,types:['기관추천','신혼부부','생애최초','다자녀'],metro:false,reg:false,notice:'2027-02-03',spBegin:'2027-02-15',spEnd:'2027-02-15',r1:'2027-02-16',win:'2027-02-23'},
  {id:'s16',name:'동탄2 C-14블록',addr:'경기 화성시 오산동 일원 (동탄2)',lat:37.1700,lon:127.1100,kind:'민영',units:1100,mil10:22,vet:11,types:['기관추천','신혼부부','생애최초','다자녀','노부모'],metro:true,reg:false,notice:'2026-12-18',spBegin:'2026-12-29',spEnd:'2026-12-29',r1:'2026-12-30',win:'2027-01-07'}
];

/* 기준 위치 프리셋 (동네 · 신도시 중심점. 관사나 부대 위치가 아니에요) */
window.ANBU_BASES = [
  {id:'wirye',pc:'11',name:'위례신도시 (송파 · 성남 · 하남)',lat:37.4790,lon:127.1460},
  {id:'yongsan',pc:'11',name:'서울 용산구',lat:37.5320,lon:126.9900},
  {id:'bundang',pc:'31',name:'성남 분당',lat:37.3820,lon:127.1190},
  {id:'uijeongbu',pc:'31',name:'의정부시',lat:37.7380,lon:127.0340},
  {id:'paju',pc:'31',name:'파주 운정',lat:37.7150,lon:126.7550},
  {id:'pyeongtaek',pc:'31',name:'평택시',lat:36.9920,lon:127.1120},
  {id:'dongtan',pc:'31',name:'화성 동탄',lat:37.2000,lon:127.0980},
  {id:'gyeryong',pc:'34',name:'계룡시',lat:36.2740,lon:127.2490},
  {id:'sejong',pc:'29',name:'세종시',lat:36.4800,lon:127.2890},
  {id:'yuseong',pc:'25',name:'대전 유성구',lat:36.3620,lon:127.3560},
  {id:'chuncheon',pc:'32',name:'춘천시',lat:37.8810,lon:127.7300},
  {id:'wonju',pc:'32',name:'원주시',lat:37.3420,lon:127.9200}
];
