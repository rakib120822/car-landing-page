(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  // ---------- Navbar: solid on scroll, hide on scroll down / show on scroll up ----------
  const navbar = document.getElementById('navbar');
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 50);
    const menuOpen = navLinks.classList.contains('open');
    navbar.classList.toggle('hidden', !menuOpen && y > lastY && y > 300);
    lastY = y;
  }, { passive: true });

  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  hamburger.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Inventory filters ----------
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.car-card');
  filters.forEach((btn) => btn.addEventListener('click', () => {
    filters.forEach((b) => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    const type = btn.dataset.filter;
    const shown = [];
    cards.forEach((card) => {
      const match = type === 'all' || card.dataset.type === type;
      card.classList.toggle('is-hidden', !match);
      if (match) shown.push(card);
    });
    if (hasGsap && !reduceMotion) {
      gsap.fromTo(shown, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', overwrite: true });
      ScrollTrigger.refresh();
    }
  }));

  // ---------- Counters ----------
  const counters = document.querySelectorAll('[data-count]');
  const formatCount = (el, v) => {
    const decimals = +(el.dataset.decimals || 0);
    el.textContent = Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (el.dataset.suffix || '');
  };

  // Without GSAP or with reduced motion: show everything in its final state
  if (!hasGsap || reduceMotion) {
    root.classList.remove('js-anim');
    counters.forEach((el) => formatCount(el, el.dataset.count));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- Generic reveal: [data-animate] ----------
  const fromVars = {
    'fade-up': { y: 50 },
    'fade-right': { x: -60 }, // moves rightwards into place
    'fade-left': { x: 60 },   // moves leftwards into place
    'zoom': { scale: 0.88 }
  };
  document.querySelectorAll('[data-animate]').forEach((el) => {
    gsap.set(el, { opacity: 0, ...(fromVars[el.dataset.animate] || fromVars['fade-up']) });
  });
  ScrollTrigger.batch('[data-animate]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1, x: 0, y: 0, scale: 1,
      duration: 0.9, stagger: 0.12, ease: 'power3.out', overwrite: true
    })
  });

  // ---------- Hero copy drifts up and fades as you scroll ----------
  gsap.to('.hero-content', {
    y: -100, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true }
  });
  gsap.to('.scroll-hint', {
    opacity: 0,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '15% top', scrub: true }
  });

  // ---------- Stats counters ----------
  counters.forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2, ease: 'power2.out',
      onUpdate: () => formatCount(el, obj.v),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // ---------- Pinned showcase: cross-fade panels + images ----------
  const panels = gsap.utils.toArray('.sc-panel');
  const images = gsap.utils.toArray('.sc-img');
  const sc = gsap.timeline({
    scrollTrigger: { trigger: '.showcase', start: 'top top', end: '+=' + panels.length * 100 + '%', pin: true, scrub: 0.6 }
  });
  panels.forEach((panel, i) => {
    if (i === 0) return;
    const at = i - 0.5;
    sc.to(panels[i - 1], { opacity: 0, y: -40, duration: 0.4 }, at)
      .fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, at + 0.3)
      .to(images[i - 1], { opacity: 0, scale: 1.08, duration: 0.6 }, at)
      .fromTo(images[i], { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.6 }, at);
  });
  sc.fromTo('#sc-progress-fill', { width: '0%' }, { width: '100%', ease: 'none', duration: sc.duration() + 0.5 }, 0);
  sc.fromTo(images[0], { scale: 1.12 }, { scale: 1, duration: 0.5 }, 0);

  // ---------- How-it-works timeline line draws on scroll ----------
  gsap.to('.timeline-line', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true }
  });

  // ---------- CTA background parallax ----------
  gsap.fromTo('.cta-bg', { yPercent: -12 }, {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  // Recalculate trigger positions once images/fonts settle
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
