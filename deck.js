(() => {
  const W = 1600, H = 900;
  const root = document.documentElement;
  if (location.search.includes('static')) root.classList.add('static');
  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const secEl = document.getElementById('sec'), countEl = document.getElementById('count');
  const bar = document.querySelector('#progress i');
  const prevBtn = document.getElementById('prev'), nextBtn = document.getElementById('next');
  let cur = 0, mobile = false;
  const nf = new Intl.NumberFormat('es-CL');

  slides.forEach(s => s.querySelectorAll('.a').forEach((el, i) => el.style.setProperty('--i', i)));

  function countUp(el) {
    const to = +el.dataset.to, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const t0 = performance.now(), dur = 1500, delay = +(el.dataset.delay || 600);
    const fmt = v => pre + (dec ? v.toFixed(dec).replace('.', ',') : nf.format(Math.round(v))) + suf;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const step = t => {
      const p = Math.min(1, (t - t0 - delay) / dur);
      if (p > 0) el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = fmt(to); }, delay + dur + 400);
  }

  function activate(s) {
    void s.offsetWidth;
    s.classList.add('active');
    s.querySelectorAll('.count').forEach(countUp);
  }

  function updateChrome() {
    const s = slides[cur];
    stage.classList.toggle('dark', s.classList.contains('dark') || s.classList.contains('s1') || s.classList.contains('s7'));
    secEl.textContent = s.dataset.sec || '';
    countEl.textContent = `${cur + 1} / ${slides.length}`;
    bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    prevBtn.disabled = cur === 0; nextBtn.disabled = cur === slides.length - 1;
  }

  function go(n, fromHash) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (mobile) {
      cur = n; updateChrome();
      if (!fromHash) slides[n].scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    slides[cur].classList.remove('active');
    cur = n;
    activate(slides[cur]);
    updateChrome();
    if (!fromHash) history.replaceState(null, '', '#' + (cur + 1));
  }

  function fit() {
    const wasMobile = mobile;
    mobile = innerWidth < 900;
    root.classList.toggle('m', mobile);
    if (mobile) {
      stage.style.transform = '';
      if (!wasMobile) setupMobile();
    } else {
      const k = Math.min(innerWidth / W, innerHeight / H);
      stage.style.transform = `translate(-50%, -50%) scale(${k})`;
      if (wasMobile) { slides.forEach(s => s.classList.remove('active', 'vis')); activate(slides[cur]); updateChrome(); }
    }
  }

  let io = null;
  function setupMobile() {
    slides.forEach(s => s.classList.remove('active'));
    io?.disconnect();
    io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const s = e.target;
          if (!s.classList.contains('vis')) { s.classList.add('vis'); s.querySelectorAll('.count').forEach(countUp); }
          cur = slides.indexOf(s); updateChrome();
        }
      });
    }, { threshold: 0.22 });
    slides.forEach(s => io.observe(s));
    updateChrome();
  }

  addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key) && !mobile) { e.preventDefault(); go(cur + 1); }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key) && !mobile) { e.preventDefault(); go(cur - 1); }
    if (e.key === 'Home') go(0);
    if (e.key === 'End') go(slides.length - 1);
    if (e.key === 'f') document.documentElement.requestFullscreen?.();
  });
  nextBtn.onclick = () => go(cur + 1);
  prevBtn.onclick = () => go(cur - 1);

  let tx = null, ty = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx === null || mobile) { tx = null; return; }
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });
  addEventListener('resize', fit);
  addEventListener('hashchange', () => go((parseInt(location.hash.slice(1)) || 1) - 1, true));

  // FAQ: un clic resalta la respuesta
  document.querySelectorAll('.q').forEach(q => q.addEventListener('click', () => {
    const was = q.classList.contains('open');
    document.querySelectorAll('.q.open').forEach(o => o.classList.remove('open'));
    if (!was) q.classList.add('open');
  }));

  // Decisión final
  const verdict = document.getElementById('verdict'), decide = document.querySelector('.decide');
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#fff', '#7ad7ff', '#ffd25e', '#8be3b6', '#ff9ea6'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * .6 + 's'; p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
      box.appendChild(p);
    }
    decide.appendChild(box); setTimeout(() => box.remove(), 4200);
  }
  document.getElementById('btn-go')?.addEventListener('click', () => {
    verdict.textContent = '✓ Check dado. Se activa la campaña en pausa y el tópico de Telegram de Jacinta; el primer reporte llega en el siguiente horario (09:00 o 21:00).';
    verdict.classList.add('show'); confetti();
  });
  document.getElementById('btn-adj')?.addEventListener('click', () => {
    verdict.textContent = 'Anotado. Dinos qué ajustar (presupuesto, textos, horarios o reglas de María) y lo dejamos listo antes de activar.';
    verdict.classList.add('show');
  });

  fit();
  if (mobile) { setupMobile(); const n = (parseInt(location.hash.slice(1)) || 1) - 1; if (n > 0) setTimeout(() => slides[n]?.scrollIntoView(), 80); }
  else go((parseInt(location.hash.slice(1)) || 1) - 1, true);
})();
