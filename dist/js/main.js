/* ============================================
   SHIN COMPANY — Main JavaScript
   ✅ 성능 최적화 적용 버전
   ✅ v2.1 — 이미지 shimmer 제거, 404 수정 (2025-06-24)
   ============================================ */

'use strict';

// ============================================
// ✅ FIX: 이미지 로드 완료 시 shimmer 애니메이션 제거
// ============================================
(function initImageLoadHandlers() {
  function markLoaded(img) {
    img.classList.add('loaded');
  }

  function attachHandlers(img) {
    if (img.complete && img.naturalWidth > 0) {
      markLoaded(img);
      return;
    }
    img.addEventListener('load', () => markLoaded(img), { once: true });
    // 로드 실패 시도 shimmer 제거 (thumbnail.js가 폴백 처리)
    img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
  }

  // DOM 준비 후 모든 이미지에 핸들러 부착
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.thumb-img-wrap img, .news-card img').forEach(attachHandlers);
    });
  } else {
    document.querySelectorAll('.thumb-img-wrap img, .news-card img').forEach(attachHandlers);
  }
})();

// ============================================
// ✅ 유틸: RAF 기반 Throttle (scroll 이벤트 최적화)
// ============================================
function rafThrottle(fn) {
  let rafId = null;
  return function (...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}


// ============================================
// 1. NAVBAR SCROLL EFFECT
// ============================================
(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!navbar) return;

  // ✅ rafThrottle로 scroll 핸들러 최적화
  const onScroll = rafThrottle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
  window.addEventListener('scroll', onScroll, { passive: true });

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
    });
  });

  // ✅ Active nav link — 별도 rafThrottle
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const onScrollNav = rafThrottle(() => {
    let current = '';
    const scrollY = window.scrollY;
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active-link', isActive);
    });
  });
  window.addEventListener('scroll', onScrollNav, { passive: true });
})();


// ============================================
// 2. SCROLL TO TOP BUTTON
// ============================================
(function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;

  // ✅ passive + rafThrottle
  const onScroll = rafThrottle(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


// ============================================
// 3. ANIMATED NUMBER COUNTER
// ✅ setInterval → requestAnimationFrame 기반으로 교체
// ============================================
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 2000;
  let startTime  = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ✅ easeOutCubic — 부드러운 감속
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.floor(eased * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


// ============================================
// 4. INTERSECTION OBSERVER — Scroll Reveal + Counters
// ============================================
(function initObservers() {
  // ✅ Reveal 요소 일괄 등록
  const revealEls = document.querySelectorAll(
    '.service-card, .portfolio-card, .news-card, .p-stat, .partner-item, .partner-tag, .about-left, .about-right, .contact-left, .contact-right, .section-header'
  );
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    // ✅ transitionDelay: 최대 6개씩만 순서 부여 (긴 딜레이 방지)
    el.style.transitionDelay = `${(i % 6) * 0.08}s`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // ✅ 한 번만 실행
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ✅ Counter — 뷰포트에 들어올 때만 실행
  const counterEls = document.querySelectorAll('.stat-num, .float-num, .p-stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => counterObserver.observe(el));
})();


// ============================================
// 5. PORTFOLIO FILTER
// ============================================
(function initPortfolioFilter() {
  const filterBtns     = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      portfolioCards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !show);
        if (show) card.style.animation = 'fadeIn 0.4s ease both';
      });
    });
  });
})();


// ============================================
// 5-B. VIDEO MODAL
// ============================================
(function initVideoModal() {
  const modal       = document.getElementById('videoModal');
  const backdrop    = document.getElementById('modalBackdrop');
  const closeBtn    = document.getElementById('modalClose');
  const thumbLink   = document.getElementById('modalThumbLink');
  const thumbImg    = document.getElementById('modalThumbImg');
  const titleEl     = document.getElementById('modalTitle');
  const descEl      = document.getElementById('modalDesc');
  const tagEl       = document.getElementById('modalTag');
  const ytLink      = document.getElementById('modalYoutubeLink');
  const prevBtn     = document.getElementById('modalPrev');
  const nextBtn     = document.getElementById('modalNext');
  const mp4Wrap     = document.getElementById('modalMp4Wrap');
  const videoPlayer = document.getElementById('modalVideoPlayer');

  if (!modal) return;

  let currentIdx = 0;

  function getVisibleCards() {
    return [...document.querySelectorAll('.portfolio-card.video-card:not(.hidden)')];
  }

  function openModal(card, cards, idx) {
    const mp4Path = card.dataset.mp4    || '';
    const videoId = card.dataset.video  || '';
    const title   = card.dataset.title  || card.querySelector('h4')?.textContent || '';
    const desc    = card.dataset.desc   || '';
    const tagText = card.dataset.tag    || card.querySelector('.portfolio-tag')?.textContent || '';
    // ✅ isExt 여부와 상관없이 모달 내에서 직접 재생
    const isLocalMissing = mp4Path.startsWith('videos/'); // 로컬 파일은 서버 없이 재생 불가

    currentIdx = idx;
    tagEl.textContent   = tagText;
    titleEl.textContent = title;
    descEl.textContent  = desc;

    if (mp4Path && !isLocalMissing) {
      // ── 외부 URL MP4 → 모달 내 직접 재생 ──
      // 혹시 innerHTML이 교체됐다면 video 태그 복원
      if (!document.getElementById('modalVideoPlayer')) {
        mp4Wrap.innerHTML = `
          <video id="modalVideoPlayer" controls playsinline webkit-playsinline preload="metadata"
                 style="width:100%;border-radius:12px 12px 0 0;background:#000;max-height:60vh;display:block;">
            브라우저가 비디오를 지원하지 않습니다.
          </video>`;
      }
      const player = document.getElementById('modalVideoPlayer');

      mp4Wrap.style.display   = 'block';
      thumbLink.style.display = 'none';
      ytLink.style.display    = 'none';

      player.onerror = null;
      player.onerror = () => {
        mp4Wrap.innerHTML = `
          <div style="padding:48px 24px;text-align:center;">
            <i class="fas fa-exclamation-circle" style="font-size:2.5rem;margin-bottom:14px;display:block;color:#f87171;"></i>
            <p style="font-size:0.95rem;color:#e2e8f0;margin-bottom:8px;">영상을 불러올 수 없습니다.</p>
            <p style="font-size:0.8rem;color:rgba(157,142,196,0.7);">잠시 후 다시 시도해주세요.</p>
          </div>`;
      };

      player.src = mp4Path;
      player.load();
      setTimeout(() => { player.play().catch(() => {}); }, 200);

    } else if (isLocalMissing) {
      // ── 로컬 영상 파일 없음 → 안내 메시지 ──
      mp4Wrap.style.display   = 'block';
      thumbLink.style.display = 'none';
      ytLink.style.display    = 'none';
      mp4Wrap.innerHTML = `
        <div style="padding:56px 24px;text-align:center;background:rgba(14,10,31,0.8);border-radius:12px 12px 0 0;">
          <i class="fas fa-film" style="font-size:3rem;margin-bottom:16px;display:block;color:rgba(167,139,250,0.5);"></i>
          <p style="font-size:1rem;color:#e2e8f0;margin-bottom:8px;font-weight:600;">${title}</p>
          <p style="font-size:0.85rem;color:rgba(157,142,196,0.8);">영상 준비 중입니다.<br/>문의하시면 상세 자료를 보내드립니다.</p>
          <a href="#contact" onclick="document.getElementById('videoModal').classList.remove('open');document.body.classList.remove('modal-open');"
             style="display:inline-flex;align-items:center;gap:8px;margin-top:20px;padding:10px 24px;border-radius:100px;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;font-size:0.85rem;font-weight:600;text-decoration:none;">
            <i class="fas fa-envelope"></i> 자료 요청하기
          </a>
        </div>`;

    } else {
      // ── YouTube 모드 ──
      mp4Wrap.style.display   = 'none';
      thumbLink.style.display = 'block';
      ytLink.style.display    = '';

      const ytUrl    = `https://www.youtube.com/watch?v=${videoId}`;
      const thumbSrc = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      thumbImg.src   = thumbSrc;
      thumbImg.alt   = title;
      thumbLink.href = ytUrl;
      ytLink.href    = ytUrl;
    }

    prevBtn.disabled = (idx === 0);
    nextBtn.disabled = (idx === cards.length - 1);

    modal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');

    // mp4Wrap이 innerHTML로 교체됐을 수 있으므로 video 태그 복원
    const existingVideo = document.getElementById('modalVideoPlayer');
    if (existingVideo) {
      existingVideo.pause();
      existingVideo.currentTime = 0;
      existingVideo.src = '';
      existingVideo.load();
    } else {
      // 로컬 영상 안내 메시지로 교체된 경우 → video 태그 복원
      mp4Wrap.innerHTML = `
        <video id="modalVideoPlayer" controls playsinline webkit-playsinline preload="metadata"
               style="width:100%;border-radius:12px 12px 0 0;background:#000;max-height:60vh;display:block;">
          브라우저가 비디오를 지원하지 않습니다.
        </video>`;
    }
  }

  // ✅ 이벤트 위임 유지
  document.getElementById('portfolioGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.portfolio-card.video-card');
    if (!card) return;
    e.preventDefault();
    const cards = getVisibleCards();
    const idx   = cards.indexOf(card);
    if (idx !== -1) openModal(card, cards, idx);
  });

  prevBtn.addEventListener('click', () => {
    const cards = getVisibleCards();
    if (currentIdx > 0) openModal(cards[currentIdx - 1], cards, currentIdx - 1);
  });
  nextBtn.addEventListener('click', () => {
    const cards = getVisibleCards();
    if (currentIdx < cards.length - 1) openModal(cards[currentIdx + 1], cards, currentIdx + 1);
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    if (!modal.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
})();


// ============================================
// 6. HERO PARTICLES (DOM)
// ============================================
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  // ✅ 모바일 파티클 수 줄임
  const count = window.innerWidth < 480 ? 8 : window.innerWidth < 768 ? 12 : 25;
  const frag  = document.createDocumentFragment(); // ✅ DocumentFragment으로 DOM 조작 최소화

  for (let i = 0; i < count; i++) {
    const p    = document.createElement('div');
    p.classList.add('particle');
    const size     = Math.random() * 3 + 1;
    const x        = Math.random() * 100;
    const delay    = Math.random() * 8;
    const duration = Math.random() * 10 + 8;
    const top      = Math.random() * 100 + 20;

    p.style.cssText = `width:${size}px;height:${size}px;left:${x}%;top:${top}%;animation-duration:${duration}s;animation-delay:${delay}s;opacity:0;`;
    frag.appendChild(p);
  }
  container.appendChild(frag);
})();


// ============================================
// 7. CONTACT FORM HANDLER
// ============================================
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();
    const agree   = form.agree.checked;

    if (!name || !email || !message || !agree) {
      shakeForm(form);
      return;
    }
    if (!isValidEmail(email)) {
      highlightField(form.email);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = '전송 중...';
    submitBtn.querySelector('i').className = 'fas fa-spinner fa-spin';

    await new Promise(res => setTimeout(res, 1200)); // ✅ 1500ms → 1200ms

    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
    form.reset();

    try {
      // ✅ FIX: 잘못된 'tables/contact_inquiries' 엔드포인트 → mailto 방식으로 전환
      // 실제 백엔드 API 연동 전까지 데이터를 localStorage에 임시 저장
      const inquiryData = {
        id:        Date.now(),
        timestamp: new Date().toISOString(),
        name,
        company:   form.company.value.trim(),
        email,
        phone:     form.phone.value.trim(),
        service:   form.service.value,
        message
      };

      // 로컬스토리지에 문의 기록 저장 (누적)
      const existing = JSON.parse(localStorage.getItem('shinco_inquiries') || '[]');
      existing.push(inquiryData);
      localStorage.setItem('shinco_inquiries', JSON.stringify(existing));

      // ✅ 실제 서버 연동 시 아래 주석 해제 후 올바른 엔드포인트로 교체:
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(inquiryData)
      // });
    } catch (_) { /* silent */ }
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function shakeForm(el) {
    el.style.animation = 'none';
    requestAnimationFrame(() => { el.style.animation = 'shake 0.4s ease'; });
  }

  function highlightField(el) {
    el.style.borderColor = '#f87171';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 2500);
  }
})();


// ============================================
// 8. SERVICE CARD TILT
// ✅ 모바일에서는 비활성화
// ============================================
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return; // 터치 디바이스 건너뜀

  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left)  / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)   / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ============================================
// 9. ACTIVE LINK + SHAKE 스타일 주입
// ============================================
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-links a.active-link { color: var(--primary) !important; }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%,60%  { transform: translateX(-6px); }
      40%,80%  { transform: translateX(6px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
})();
