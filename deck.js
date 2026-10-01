// Navegación del deck: flechas, teclado, hash (#1…#7), swipe y puntos. Animaciones al entrar a cada lámina.
(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const dots = document.getElementById("dots");
  const count = document.getElementById("count");
  const progress = document.getElementById("progress");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => window.matchMedia("(max-width: 749px)").matches;
  let current = 0;
  // Lienzo fijo de 1600×900 escalado a la ventana (composición idéntica en cualquier pantalla de escritorio).
  const stage = document.getElementById("stage");
  function fit() {
    if (mobile()) { stage.style.transform = ""; stage.style.width = ""; stage.style.height = ""; return; }
    // Ancho de diseño 1600 px; el alto se adapta a la proporción de la pantalla (16:9, 16:10…) para no dejar franjas.
    const vw = window.innerWidth, vh = window.innerHeight, ratio = vh / vw;
    const w = ratio >= 900 / 1600 ? 1600 : 900 / ratio, h = ratio >= 900 / 1600 ? 1600 * ratio : 900;
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${vw / w})`;
  }
  window.addEventListener("resize", fit);
  fit();

  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.className = "nav__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir a la lámina ${i + 1}: ${slide.getAttribute("aria-label")}`);
    dot.addEventListener("click", () => go(i));
    dots.append(dot);
  });

  const fmt = (n, tipo) => (tipo === "clp" ? new Intl.NumberFormat("es-CL").format(n) : String(n));
  function countUp(slide) {
    slide.querySelectorAll("[data-count]").forEach((el) => {
      const fin = Number(el.dataset.count), tipo = el.dataset.format;
      if (reduce) { el.textContent = fmt(fin, tipo); return; }
      const t0 = performance.now(), dur = 1200;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(fin * e), tipo);
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }

  function go(i, fromHash = false) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (mobile()) { slides[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    slides[current].classList.remove("is-active");
    current = i;
    const slide = slides[current];
    // Reinicia las animaciones de entrada al volver a una lámina.
    slide.querySelectorAll(".rv").forEach((el) => { el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; });
    slide.classList.add("is-active");
    document.body.classList.toggle("on-dark", slide.dataset.theme === "dark");
    [...dots.children].forEach((d, k) => d.classList.toggle("is-active", k === current));
    count.innerHTML = `<b>${String(current + 1).padStart(2, "0")}</b> / ${String(slides.length).padStart(2, "0")}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    countUp(slide);
    if (!fromHash) history.replaceState(null, "", `#${current + 1}`);
  }

  prev.addEventListener("click", () => go(current - 1));
  next.addEventListener("click", () => go(current + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("summary, button") && (e.key === " " || e.key === "Enter")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(current + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(current - 1); }
    if (e.key === "Home") go(0);
    if (e.key === "End") go(slides.length - 1);
  });
  let x0 = null;
  document.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (x0 === null || mobile()) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  window.addEventListener("hashchange", () => go(Number(location.hash.slice(1)) - 1 || 0, true));

  // Visto bueno: confirma sin recargar la página.
  const cta = document.getElementById("cta");
  document.getElementById("cta-btn").addEventListener("click", (e) => {
    cta.classList.add("is-done");
    e.currentTarget.textContent = "Visto bueno ✓";
  });

  go((Number(location.hash.slice(1)) || 1) - 1, true);
})();
