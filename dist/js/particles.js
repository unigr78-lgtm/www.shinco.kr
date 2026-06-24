/* ============================================
   SHIN COMPANY — Global Canvas Particle System
   ✅ 성능 최적화 버전
   - Page Visibility API: 탭 비활성 시 RAF 중단
   - 모바일 파티클 수 / 연결선 거리 축소
   - 저사양 감지 시 단순화 모드
   - 연결선 O(n²) 루프 조기 종료 최적화
   ============================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true }); // ✅ 알파 명시

  // ✅ 모바일 여부 감지
  const isMobile  = window.innerWidth < 768;
  const isLowEnd  = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;

  const CONFIG = {
    // ✅ 파티클 수 줄임 (PC: 80→60, 모바일: 30, 저사양: 20)
    count: () => {
      const w = window.innerWidth;
      if (isLowEnd)   return Math.min(Math.floor(w / 30), 20);
      if (isMobile)   return Math.min(Math.floor(w / 22), 30);
      return Math.min(Math.floor(w / 18), 60);
    },
    minR:         1.2,
    maxR:         3.0,
    maxSpeed:     isMobile ? 0.3 : 0.45,
    // ✅ 연결선 거리 축소 (모바일: 100, PC: 130) — O(n²) 비용 절감
    linkDistance: isMobile ? 100 : 130,
    mouseRadius:  isMobile ? 120 : 180,
    mouseForce:   -0.012,
    colors: [
      'rgba(167,139,250,ALPHA)',
      'rgba(192,132,252,ALPHA)',
      'rgba(96,165,250,ALPHA)',
      'rgba(232,121,249,ALPHA)',
      'rgba(216,180,254,ALPHA)',
      'rgba(147,197,253,ALPHA)',
    ],
    bgColor:   'rgba(7,5,15,0)',
    linkColor: 'rgba(167,139,250,LINK_ALPHA)',
  };

  let particles = [];
  let W = 0, H = 0;
  let mouse = { x: -9999, y: -9999 };
  let raf;
  let resizeTimer;
  // ✅ Page Visibility 상태 추적
  let isVisible = !document.hidden;

  class Particle {
    constructor() { this.reset(true); }

    reset(randomY = false) {
      this.x    = Math.random() * W;
      this.y    = randomY ? Math.random() * H : H + 10;
      this.r    = CONFIG.minR + Math.random() * (CONFIG.maxR - CONFIG.minR);
      const spd = CONFIG.maxSpeed * (0.3 + Math.random() * 0.7);
      const ang = Math.random() * Math.PI * 2;
      this.vx   = Math.cos(ang) * spd;
      this.vy   = Math.sin(ang) * spd;
      this.baseAlpha   = 0.25 + Math.random() * 0.55;
      this.alpha       = 0;
      this.targetAlpha = this.baseAlpha;
      this.fadeSpeed   = 0.008 + Math.random() * 0.012;
      this.colorTpl    = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.twinkleAmp  = 0.1  + Math.random() * 0.2;
      this.twinkleSpd  = 0.008 + Math.random() * 0.016;
      this.twinkleOff  = Math.random() * Math.PI * 2;
      this.phase = 0;
      this.dvx   = 0;
      this.dvy   = 0;
    }

    color(alpha) {
      return this.colorTpl.replace('ALPHA', alpha.toFixed(3));
    }

    update() {
      if (this.alpha < this.targetAlpha) {
        this.alpha = Math.min(this.alpha + this.fadeSpeed, this.targetAlpha);
      }
      this.phase += this.twinkleSpd;
      const twinkle = Math.sin(this.phase + this.twinkleOff) * this.twinkleAmp;
      this.displayAlpha = Math.max(0, this.alpha + twinkle);

      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        const force = CONFIG.mouseForce * (1 - dist / CONFIG.mouseRadius);
        this.dvx += dx / dist * force * 60;
        this.dvy += dy / dist * force * 60;
      }

      this.dvx *= 0.92;
      this.dvy *= 0.92;
      this.x   += this.vx + this.dvx;
      this.y   += this.vy + this.dvy;

      const pad = 10;
      if (this.x < -pad)    this.x = W + pad;
      if (this.x > W + pad) this.x = -pad;
      if (this.y < -pad)    this.y = H + pad;
      if (this.y > H + pad) this.y = -pad;
    }

    draw() {
      // ✅ 저사양 모드: 글로우 생략, 단색 원으로 단순화
      if (isLowEnd) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color(Math.min(this.displayAlpha, 1));
        ctx.fill();
        return;
      }

      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.5);
      grd.addColorStop(0,   this.color(this.displayAlpha));
      grd.addColorStop(0.5, this.color(this.displayAlpha * 0.4));
      grd.addColorStop(1,   this.color(0));

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color(Math.min(this.displayAlpha * 1.5, 1));
      ctx.fill();
    }
  }

  // ✅ 연결선: linkDistanceSq 사전 계산으로 sqrt 호출 절반 감소
  const linkDistSq = CONFIG.linkDistance * CONFIG.linkDistance;

  function drawLinks() {
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dsq = dx * dx + dy * dy;

        if (dsq > linkDistSq) continue; // ✅ 조기 종료

        const dist      = Math.sqrt(dsq);
        const ratio     = 1 - dist / CONFIG.linkDistance;
        const alphaA    = a.displayAlpha ?? a.alpha;
        const alphaB    = b.displayAlpha ?? b.alpha;
        const linkAlpha = ratio * ratio * Math.min(alphaA, alphaB) * 0.6;

        if (linkAlpha < 0.005) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        // ✅ 저사양: 단색 선
        if (isLowEnd) {
          ctx.strokeStyle = a.color(linkAlpha);
        } else {
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.color(linkAlpha));
          grad.addColorStop(1, b.color(linkAlpha));
          ctx.strokeStyle = grad;
        }
        ctx.lineWidth = ratio * 1.2;
        ctx.stroke();
      }
    }
  }

  const mouseRadSq = CONFIG.mouseRadius * CONFIG.mouseRadius;

  function drawMouseLinks() {
    if (mouse.x < 0 || mouse.x > W) return;
    const len    = particles.length;
    const mDist  = CONFIG.mouseRadius * 0.85;
    const mDistSq = mDist * mDist;

    for (let i = 0; i < len; i++) {
      const p   = particles[i];
      const dx  = mouse.x - p.x;
      const dy  = mouse.y - p.y;
      const dsq = dx * dx + dy * dy;
      if (dsq > mDistSq) continue; // ✅ 조기 종료

      const dist  = Math.sqrt(dsq);
      const ratio = 1 - dist / mDist;
      const alpha = ratio * ratio * 0.35;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouse.x, mouse.y);

      const grad = ctx.createLinearGradient(p.x, p.y, mouse.x, mouse.y);
      grad.addColorStop(0, p.color(alpha));
      grad.addColorStop(1, 'rgba(192,132,252,' + (alpha * 0.5).toFixed(3) + ')');

      ctx.strokeStyle = grad;
      ctx.lineWidth   = ratio * 0.8;
      ctx.stroke();
    }
  }

  function drawMouseGlow() {
    if (mouse.x < 0 || mouse.x > W) return;
    const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CONFIG.mouseRadius * 0.5);
    grd.addColorStop(0,   'rgba(167,139,250,0.06)');
    grd.addColorStop(0.5, 'rgba(124,58,237,0.02)');
    grd.addColorStop(1,   'rgba(124,58,237,0)');
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, CONFIG.mouseRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // ✅ Page Visibility API — 탭 비활성 시 RAF 중단
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && isHeroVisible) {
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
    }
  });

  // ✅ IntersectionObserver — Hero 섹션 벗어나면 파티클 중단 (CPU 절약)
  let isHeroVisible = true;
  const heroSection = document.getElementById('hero');
  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          isHeroVisible = entry.isIntersecting;
          if (isHeroVisible && isVisible) {
            // Hero 섹션 보임 → 파티클 재개
            if (!raf) raf = requestAnimationFrame(loop);
          } else {
            // Hero 섹션 안 보임 → 파티클 중단 + 캔버스 투명하게
            cancelAnimationFrame(raf);
            raf = null;
            ctx.clearRect(0, 0, W, H);
          }
        });
      },
      {
        // Hero의 10% 이상 보일 때만 활성화 (부드러운 전환)
        threshold: 0.1,
        rootMargin: '0px 0px 100px 0px'
      }
    );
    heroObserver.observe(heroSection);
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);

    ctx.clearRect(0, 0, W, H);

    if (!isLowEnd) drawMouseGlow();

    ctx.save();
    drawLinks();
    ctx.restore();

    if (!isMobile) {
      ctx.save();
      drawMouseLinks();
      ctx.restore();
    }

    ctx.save();
    particles.forEach(p => { p.update(); p.draw(); });
    ctx.restore();
  }

  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const n  = CONFIG.count();
    particles = Array.from({ length: n }, () => new Particle());
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      init();
      if (isVisible) raf = requestAnimationFrame(loop);
    }, 250);
  }

  // ✅ passive: true — 스크롤 블로킹 방지
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  }, { passive: true });

  window.addEventListener('resize', onResize, { passive: true });

  init();
  // ✅ 초기 시작: Hero가 보이고 탭이 활성일 때만 시작
  if (isVisible && isHeroVisible) raf = requestAnimationFrame(loop);

})();
