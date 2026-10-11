// ===== Қосымша анимациялар (2-пакет) =====
(function () {
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

  // 1. Hero фонындағы бөлшектер (байланысқан нүктелер)
  const hero = document.querySelector(".hero");
  if (hero && !reduce) {
    const c = document.createElement("canvas"); c.id = "heroParticles"; hero.prepend(c);
    const g = c.getContext("2d"); let W, H, pts = [], mouse = { x: -999, y: -999 };
    const fit = () => { W = c.width = hero.clientWidth; H = c.height = hero.clientHeight;
      pts = Array.from({ length: Math.min(70, Math.floor(W / 22)) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 })); };
    fit(); addEventListener("resize", fit);
    hero.addEventListener("mousemove", e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener("mouseleave", () => mouse.x = -999);
    let on = true; new IntersectionObserver(es => on = es[0].isIntersecting).observe(hero);
    (function loop() { requestAnimationFrame(loop); if (!on || document.hidden) return;
      g.clearRect(0, 0, W, H); const dark = document.body.classList.contains("dark"), col = dark ? "255,255,255" : "17,17,17";
      pts.forEach((p, i) => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        g.fillStyle = `rgba(${col},.35)`; g.beginPath(); g.arc(p.x, p.y, 1.8, 0, 7); g.fill();
        for (let j = i + 1; j < pts.length; j++) { const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) { g.strokeStyle = `rgba(${col},${(1 - d / 120) * .18})`; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } }
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 160) { g.strokeStyle = `rgba(230,57,70,${(1 - dm / 160) * .5})`; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(mouse.x, mouse.y); g.stroke(); } }); })();
  }

  // 2. Өнім карточкалары бірінен соң бірі шығады, суреттер жүктелгенде бірте-бірте көрінеді
  document.querySelectorAll(".product").forEach((p, i) => p.style.transitionDelay = (i % 4) * 80 + "ms");
  document.querySelectorAll(".product-image img").forEach(im => { const ok = () => im.classList.add("loaded"); im.complete ? ok() : im.addEventListener("load", ok); im.addEventListener("error", ok); });

  // 3. Магнитті батырмалар
  if (!reduce && matchMedia("(hover:hover)").matches) document.querySelectorAll(".hero-buttons a,.main-button").forEach(b => {
    b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener("mouseleave", () => b.style.transform = ""); });

  // 4. Scrollspy: қай бөлімде тұрғанын мәзірде белгілейді
  const links = [...document.querySelectorAll(".navigation a")], secs = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => spy.observe(s));

  // 5. Header төмен айналғанда жасырылады, жоғары айналғанда қайта шығады
  const header = document.querySelector(".header"); let last = scrollY;
  addEventListener("scroll", () => { const y = scrollY; header.classList.toggle("hide", y > last && y > 300 && !document.querySelector(".navigation.open")); last = y; });

  // 6. Feature карточкалары: тышқан бағытына қарай еңкейеді
  if (!reduce && matchMedia("(hover:hover)").matches) document.querySelectorAll(".feature").forEach(f => {
    f.addEventListener("mousemove", e => { const r = f.getBoundingClientRect(); f.style.transform = `perspective(500px) rotateX(${-((e.clientY - r.top) / r.height - .5) * 8}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 8}deg) translateY(-6px)`; });
    f.addEventListener("mouseleave", () => f.style.transform = ""); });
})();
