/* 안부 캐릭터 얼굴 — 기분(mood)에 따라 표정이 바뀌어요: 'ok' · 'warn' · 'bad' · 'idle' */
window.anbuFace=function(mood){
  const N='#0B1B33';
  const eyes={
    ok:`<path d="M38 82q7-10 14 0M68 82q7-10 14 0" fill="none" stroke="${N}" stroke-width="4.5" stroke-linecap="round"/>`,
    idle:`<ellipse cx="45" cy="79" rx="5" ry="6.5" fill="${N}"/><ellipse cx="75" cy="79" rx="5" ry="6.5" fill="${N}"/><circle cx="46.5" cy="76.5" r="2" fill="#fff"/><circle cx="76.5" cy="76.5" r="2" fill="#fff"/>`,
    warn:`<ellipse cx="45" cy="80" rx="5" ry="6" fill="${N}"/><ellipse cx="75" cy="80" rx="5" ry="6" fill="${N}"/><path d="M37 70l12 3M83 70l-12 3" stroke="${N}" stroke-width="3.5" stroke-linecap="round"/><path d="M92 62q5 8 0 12q-5-4 0-12z" fill="#3FD0E0" stroke="${N}" stroke-width="2"/>`,
    bad:`<path d="M39 75l11 5l-11 5M81 75l-11 5l11 5" fill="none" stroke="${N}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 88q4 7 0 11q-4-4 0-11z" fill="#3FD0E0" stroke="${N}" stroke-width="2"/>`
  };
  const mouth={
    ok:`<path d="M51 91q9 12 18 0z" fill="${N}"/>`,
    idle:`<path d="M53 93q7 6 14 0" fill="none" stroke="${N}" stroke-width="4" stroke-linecap="round"/>`,
    warn:`<path d="M51 96q4.5-5 9 0t9 0" fill="none" stroke="${N}" stroke-width="4" stroke-linecap="round"/>`,
    bad:`<path d="M50 100q10-11 20 0" fill="none" stroke="${N}" stroke-width="4.5" stroke-linecap="round"/>`
  };
  const m=eyes[mood]?mood:'idle';
  return `<svg class="face" data-mood="${m}" viewBox="0 0 120 120" aria-hidden="true">
    <g stroke="${N}" stroke-linejoin="round" stroke-linecap="round">
      <path d="M22 62L60 30L98 62V104a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8Z" fill="#FFF4DC" stroke-width="5"/>
      <path d="M12 66L60 26L108 66" fill="none" stroke-width="17"/>
      <path d="M12 66L60 26L108 66" fill="none" stroke="#F2901D" stroke-width="9"/>
      <path d="M33 38Q34 7 60 6Q86 7 87 38Q60 47 33 38Z" fill="#4E9160" stroke-width="5"/>
      <path d="M29 39Q60 51 91 39" fill="none" stroke-width="5"/>
    </g>
    <ellipse cx="35" cy="92" rx="6" ry="4" fill="#FF9E8A" opacity=".8"/><ellipse cx="85" cy="92" rx="6" ry="4" fill="#FF9E8A" opacity=".8"/>
    ${eyes[m]}${mouth[m]}
  </svg>`;
};
