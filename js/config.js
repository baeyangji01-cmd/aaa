/*
 * 안부 설정 파일
 * - applyhomeServiceKey: 공공데이터포털(data.go.kr)에서 발급받은 "한국부동산원_청약홈 분양정보 조회 서비스" 인증키.
 *   비워 두면 js/sample-sites.js 의 예시 분양 데이터로 시연해요.
 * - 주의: 브라우저 코드에 넣은 키는 누구나 볼 수 있어요. 배포할 때는 Supabase Edge Function 같은
 *   서버 쪽에서 API를 호출하고, 여기에는 그 함수 주소(proxyUrl)만 넣는 걸 권장해요.
 */
window.ANBU_CONFIG = {
  applyhomeServiceKey: '',
  applyhomeEndpoint: 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail',
  proxyUrl: '',  // 예: https://<project>.supabase.co/functions/v1/applyhome

  /* Supabase (군인가족 추천 카페 저장). anon 키는 공개용이라 브라우저에 넣어도 돼요 (RLS로 보호). */
  supabaseUrl: '',      // 예: https://<project>.supabase.co
  supabaseAnonKey: '',  // anon 또는 sb_publishable_… 키만 (service_role / sb_secret_ 금지)

  /* 군 주거 지원 기준값 — 제도 수치가 바뀌면 여기만 고치면 돼요. (부대 인사담당 · 국군복지단 공지로 확인) */
  housing: {
    grades: {
      1: { label: '1급지', area: '서울', cap: 35000 },               // 만 원
      2: { label: '2급지', area: '경기 · 인천 · 광역시 · 세종', cap: 29000 },
      3: { label: '3급지', area: '그 밖의 시 · 군', cap: 20000 }
    },
    // 시도 코드 → 급지 (예시 기준. 실제 급지는 부대 소재지 기준 공지 확인)
    gradeByProvince: { '11':1, '23':2, '31':2, '21':2, '22':2, '24':2, '25':2, '26':2, '29':2 },
    allowance: { min: 16, max: 20, step: 1, default: 16 },   // 주택수당 월 만 원
    monthlyLoanRate: 3.89   // 군간부 월세자금대출 금리 예시 (하나은행 상품설명, 2025.11.05 기준)
  }
};
