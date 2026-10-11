// ===== Анимациялар =====
(function () {
  const lb = document.querySelector(".hero-label");
  if (lb) { const t = lb.textContent.trim(); lb.textContent = ""; lb.classList.add("typing"); let i = 0;
    const id = setInterval(() => { lb.textContent = t.slice(0, ++i); if (i >= t.length) { clearInterval(id); lb.classList.remove("typing"); } }, 70); }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll(".feature,.stat,.review,.section-heading,.faq-box,.about-image,.about-text,.contact-info,#contactForm").forEach((el, i) => {
    el.classList.add("js-reveal");
    if (el.matches(".about-image,.contact-info")) el.classList.add("from-left");
    if (el.matches(".about-text,#contactForm")) el.classList.add("from-right");
    el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });

  const strip = document.createElement("div"); strip.className = "brand-strip";
  const row = ["ROG", "TUF GAMING", "ZENBOOK", "VIVOBOOK", "OLED", "RTX 40", "REPUBLIC OF GAMERS", "IN SEARCH OF INCREDIBLE"].map(w => `<span>${w}</span>`).join("");
  strip.innerHTML = `<div>${row}${row}</div>`; document.querySelector(".stats").after(strip);

  document.addEventListener("click", e => { const b = e.target.closest(".main-button,.outline-button"); if (!b) return;
    const r = b.getBoundingClientRect(), s = document.createElement("span"), d = Math.max(r.width, r.height);
    s.className = "ripple"; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 600); });

  document.addEventListener("click", e => { const btn = e.target.closest(".add-cart"); if (!btn || btn.disabled) return;
    const cnt = document.getElementById("cartCount"); cnt.classList.add("bump"); setTimeout(() => cnt.classList.remove("bump"), 500);
    const card = btn.closest(".product"), img = card && card.querySelector(".product-image img"), cart = document.getElementById("openCart");
    if (!img || !cart) return;
    const a = img.getBoundingClientRect(), c = cart.getBoundingClientRect(), f = img.cloneNode();
    f.className = "fly"; f.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`; document.body.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = c.left + "px"; f.style.top = c.top + "px"; f.style.width = f.style.height = "30px"; f.style.opacity = ".2"; }));
    setTimeout(() => f.remove(), 900); });

  const circle = document.querySelector(".hero-circle");
  addEventListener("scroll", () => { if (circle && scrollY < 900) circle.style.transform = `translateY(${scrollY * .18}px) scale(${1 + scrollY / 3000})`; });
})();
