/* ============================================
   SHIN COMPANY — Thumbnail fallback handler
   이미지 로드 실패 시 그라디언트 폴백 적용
   ============================================ */
(function () {
  'use strict';

  const fallbacks = {
    'MDh2bsQC': { bg: 'linear-gradient(135deg,#0d1f2d,#0e0a1f,#112240)', icon: 'fa-car-side',       color: 'rgba(100,200,255,0.85)', label: '캠퍼 밴 컨셉 디자인' },
    'N5dkZzWs': { bg: 'linear-gradient(135deg,#001a33,#0e0a1f,#001a44)', icon: 'fa-wind',           color: 'rgba(0,180,255,0.75)',   label: 'DX 공조기 설계' },
    'PX5TcIJ9': { bg: 'linear-gradient(135deg,#0a001f,#1a0533,#2d1060)', icon: 'fa-cube',           color: 'rgba(200,150,255,0.85)', label: 'DX MoodUP 냉장고' },
    'zHZpUGG7': { bg: 'linear-gradient(135deg,#001433,#0a0e1f,#002244)', icon: 'fa-sync-alt',       color: 'rgba(80,180,255,0.85)',  label: 'DX 세탁기 설계' },
    'BLgRDRRA': { bg: 'linear-gradient(135deg,#001a0d,#0a0e1f,#003322)', icon: 'fa-industry',       color: 'rgba(0,255,160,0.8)',    label: 'Digital Twin 스마트 팩토리' },
    'TKHjhpZ1': { bg: 'linear-gradient(135deg,#0d001f,#0a0e1f,#1a0040)', icon: 'fa-robot',         color: 'rgba(180,100,255,0.85)', label: 'CLOi 로봇 시뮬레이션' },
    'bQarHVYf': { bg: 'linear-gradient(135deg,#001a00,#0a2010,#003311)', icon: 'fa-golf-ball',     color: 'rgba(60,220,100,0.85)',  label: 'Golf CaddyBot 전동 로봇' },
    'IwYR3w6D': { bg: 'linear-gradient(135deg,#001a33,#002244,#003355)', icon: 'fa-solar-panel',   color: 'rgba(50,200,255,0.85)',  label: '신재생 에너지 시설 소개' },
    'JhJna402': { bg: 'linear-gradient(135deg,#0a1a0a,#0e1a14,#1a2a1a)', icon: 'fa-building',      color: 'rgba(100,220,120,0.85)', label: '대형 건설 프로젝트 타임랩스' },
    '60i0SWc3': { bg: 'linear-gradient(135deg,#0d0d1a,#1a1a2e,#16213e)', icon: 'fa-car-side',      color: 'rgba(100,150,255,0.85)', label: '자동차 생산 라인' },
    'RWCJ9fBK': { bg: 'linear-gradient(135deg,#0a001a,#150a2a,#1a0a33)', icon: 'fa-network-wired', color: 'rgba(160,100,255,0.85)', label: '스마트 팩토리 로봇 자동화' },
    'zbZmKHoM': { bg: 'linear-gradient(135deg,#001433,#0a0e2a,#003355)', icon: 'fa-microchip',      color: 'rgba(0,210,255,0.85)',   label: '반도체 클린룸 로봇 자동화' },
    'qXLe9xtS': { bg: 'linear-gradient(135deg,#001a0a,#0a1a0e,#003322)', icon: 'fa-cogs',           color: 'rgba(0,255,120,0.85)',   label: '첨단 스마트 팩토리 솔루션' },
    '4qWTneMt': { bg: 'linear-gradient(135deg,#1a0a00,#1f0e0a,#3a1500)', icon: 'fa-car',            color: 'rgba(255,160,50,0.85)',  label: '자동차 부품 사출성형 공정' },
    'fo105J2o': { bg: 'linear-gradient(135deg,#1a0a00,#2a1500,#1f1000)', icon: 'fa-cog',            color: 'rgba(255,140,30,0.85)',  label: '엔진 분해 조립 과정' },
    'L6qigPn6': { bg: 'linear-gradient(135deg,#1a1000,#1f1a0a,#2a1f00)', icon: 'fa-cubes',          color: 'rgba(255,210,50,0.85)',  label: '셋트금형 조립 (MOLD)' },
  };

  function applyFallback(imgEl) {
    const wrap = imgEl.closest('.thumb-img-wrap');
    if (!wrap) return;
    const mp4  = imgEl.closest('.portfolio-card')?.dataset.mp4 || '';
    const key  = Object.keys(fallbacks).find(k => mp4.includes(k));
    const f    = fallbacks[key] || { bg: 'linear-gradient(135deg,#0e0a1f,#140f2a)', icon: 'fa-film', color: 'rgba(167,139,250,0.7)', label: '' };

    wrap.style.background = f.bg;
    wrap.style.display    = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'center';
    wrap.innerHTML = `
      <div style="text-align:center;color:${f.color};">
        <i class="fas ${f.icon}" style="font-size:2.5rem;margin-bottom:8px;display:block;"></i>
        <span style="font-size:0.72rem;font-weight:600;letter-spacing:0.06em;">${f.label}</span>
      </div>`;
  }

  function init() {
    document.querySelectorAll('.thumb-img-wrap img').forEach(img => {
      if (img.complete && img.naturalWidth === 0) {
        applyFallback(img);
      } else {
        img.addEventListener('error', () => applyFallback(img));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
