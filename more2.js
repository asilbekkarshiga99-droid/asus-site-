// ===== more2: жаңа функциялар =====
(function () {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const clickCat = c => { const b = document.querySelector('.category[data-category="' + c + '"]'); if (b) b.click(); };

  // ---- конфетти (өз ішінде) ----
  function confetti(n = 130) { if (reduce) return; const c = document.createElement("canvas"); c.className = "cf"; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext("2d"), ps = Array.from({ length: n }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .4, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: `hsl(${Math.random() * 360},90%,60%)`, r: Math.random() * 6 })); let f = 0;
    (function t() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); ++f < 170 ? requestAnimationFrame(t) : c.remove(); })(); }

  // ---- 1. Сен кімсің? ----
  const per = document.createElement("section"); per.className = "persona";
  per.innerHTML = `<span class="section-label">FIND YOURS</span><h2>Сен кімсің?</h2><p>Бірін таңда — каталог саған лайықтысын көрсетеді.</p>
    <div class="persona-grid">
      <button class="p-card" style="--g:linear-gradient(135deg,#e63946,#7a0f1d)" data-c="gaming"><span class="p-emoji">🎮</span><h3>Ойыншы</h3><p>Жоғары FPS, қуатты видеокарта және жылдам экран.</p><b>GAMING ҚҰРЫЛҒЫЛАРЫ →</b></button>
      <button class="p-card" style="--g:linear-gradient(135deg,#3a86ff,#14307a)" data-c="laptop"><span class="p-emoji">📚</span><h3>Студент / жұмыс</h3><p>Жеңіл, ұзақ жұмыс істейтін, қалтаға ыңғайлы ноутбуктер.</p><b>НОУТБУКТЕР →</b></button>
      <button class="p-card" style="--g:linear-gradient(135deg,#ff9f1c,#a64b00)" data-c="pc"><span class="p-emoji">🎨</span><h3>Дизайнер / монтаж</h3><p>Ауыр бағдарламаларға арналған өнімді компьютерлер.</p><b>КОМПЬЮТЕРЛЕР →</b></button>
    </div>`;
  const prod = $("#products"); prod.before(per);
  per.addEventListener("click", e => { const b = e.target.closest(".p-card"); if (!b) return; clickCat(b.dataset.c);
    prod.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.querySelectorAll(".product").forEach((p, i) => { if (p.style.display !== "none") setTimeout(() => { p.classList.add("flash"); setTimeout(() => p.classList.remove("flash"), 1300); }, i * 140); }), 700); });

  // ---- 2. Қуатты талда (сақиналар + рейтинг) ----
  const pcs = storeProducts.filter(p => p.cat !== "accessory");
  const S = p => { const t = (p.specs || []).join(" | ");
    const cpu = /i9|Ultra 9/.test(t) ? 95 : /Ultra 7|i7/.test(t) ? 82 : /Ryzen 7/.test(t) ? 80 : /i5|Ryzen 5/.test(t) ? 62 : 50;
    const gpu = /4090/.test(t) ? 99 : /4080/.test(t) ? 95 : /4070/.test(t) ? 82 : /4060/.test(t) ? 68 : /RTX|Radeon/.test(t) ? 55 : 35;
    const rs = (p.specs || []).find(s => /RAM|DDR/.test(s)) || "", g = +(rs.match(/(\d+)\s*GB/) || [0, 8])[1], ram = g >= 32 ? 92 : g >= 16 ? 68 : 42;
    const ss = (p.specs || []).find(s => /SSD/.test(s)) || "", m = ss.match(/(\d+)\s*(TB|GB)/), gb = m ? (m[2] === "TB" ? m[1] * 1000 : +m[1]) : 256, ssd = gb >= 2000 ? 95 : gb >= 1000 ? 76 : gb >= 512 ? 56 : 38;
    return { cpu, gpu, ram, ssd, all: Math.round((cpu + gpu + ram + ssd) / 4), game: Math.round(gpu * .7 + cpu * .3), work: Math.round(cpu * .6 + ram * .25 + ssd * .15) }; };
  const pw = document.createElement("section"); pw.className = "power"; pw.id = "power";
  pw.innerHTML = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e63946"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient></defs></svg>
    <span class="section-label">POWER</span><h2>Қуатты талда</h2><p>Өнімді таңда: көрсеткіштері анимациямен шығады.</p>
    <select id="pwSel" class="sort-select">${pcs.map(p => `<option>${esc(p.name)}</option>`).join("")}</select>
    <div class="rings">${[["cpu", "ПРОЦЕССОР"], ["gpu", "ГРАФИКА"], ["ram", "ЖАД"], ["ssd", "САҚТАУ"]].map(([k, l]) => `<div><div class="ring" data-k="${k}"><svg viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="34"/><circle class="fg" cx="40" cy="40" r="34"/></svg><strong>0</strong></div><div class="ring-cap">${l}<small data-s="${k}"></small></div></div>`).join("")}</div>
    <div class="rank"><div class="rank-tabs"><button data-m="all" class="on">Жалпы</button><button data-m="game">Ойын</button><button data-m="work">Жұмыс</button></div><div id="bars"></div></div>
    <small class="note">Көрсеткіштер құрылғы сипаттамасы бойынша шамамен бағаланған, нақты тест нәтижесі емес.</small>`;
  (document.getElementById("viewer3d") || prod).after(pw);
  const sel = pw.querySelector("#pwSel"), CAP = { cpu: /i9|i7|i5|Ultra \d|Ryzen \d/, gpu: /RTX \d+|Radeon.*|Integrated/, ram: /RAM|DDR/, ssd: /SSD/ };
  let metric = "all", seen = false;
  const countTo = (el, v) => { const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1300); el.textContent = Math.round(v * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); };
  function paintRings() { const p = pcs.find(x => x.name === sel.value); if (!p) return; const sc = S(p);
    pw.querySelectorAll(".ring").forEach(r => { const k = r.dataset.k, v = sc[k]; r.querySelector(".fg").style.strokeDashoffset = 213.6 * (1 - v / 100); countTo(r.querySelector("strong"), v);
      const spec = (p.specs || []).find(s => CAP[k].test(s)) || "Integrated"; pw.querySelector(`[data-s=${k}]`).textContent = spec; }); }
  function paintBars() { const list = pcs.map(p => ({ n: p.name, v: S(p)[metric] })).sort((a, b) => b.v - a.v);
    pw.querySelector("#bars").innerHTML = list.map(r => `<div class="bar-row"><span>${esc(r.n)}</span><div class="bar"><i data-w="${r.v}"></i></div><b>${r.v}</b></div>`).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => pw.querySelectorAll(".bar i").forEach((i, k) => setTimeout(() => i.style.width = i.dataset.w + "%", k * 90)))); }
  sel.onchange = paintRings;
  pw.querySelector(".rank-tabs").onclick = e => { const b = e.target.closest("button"); if (!b) return; pw.querySelectorAll(".rank-tabs button").forEach(x => x.classList.toggle("on", x === b)); metric = b.dataset.m; paintBars(); };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !seen) { seen = true; o.disconnect(); paintRings(); paintBars(); } }, { threshold: .25 }).observe(pw);

  // ---- 3. Жүрек жарылысы ----
  document.addEventListener("click", e => { const w = e.target.closest(".wish"); if (!w || reduce) return; setTimeout(() => { if (!w.classList.contains("on")) return;
    for (let i = 0; i < 10; i++) { const p = document.createElement("i"), a = i / 10 * Math.PI * 2, d = 26 + Math.random() * 14; p.className = "heart-p"; p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px"); w.appendChild(p); setTimeout(() => p.remove(), 750); } }, 0); });

  // ---- 4. Тақырып ауысуы: дөңгелек толқын ----
  const tb = $("#themeButton");
  if (tb && document.startViewTransition && !reduce) tb.addEventListener("click", e => { e.stopImmediatePropagation();
    const r = tb.getBoundingClientRect(); document.documentElement.style.setProperty("--tx", r.left + r.width / 2 + "px"); document.documentElement.style.setProperty("--ty", r.top + r.height / 2 + "px");
    document.startViewTransition(() => { document.body.classList.toggle("dark"); tb.textContent = document.body.classList.contains("dark") ? "☾" : "☼"; }); }, true);

  // ---- 5. Тегін жеткізуге жеткенде конфетти ----
  let reached = false; const _u = window.updateCart;
  window.updateCart = function () { _u.apply(this, arguments); const ok = cartSum() >= FREE_SHIP; if (ok && !reached) { reached = true; confetti(90); showNotification("🚚 Жеткізу тегін болды!"); } if (!ok) reached = false; };
  reached = cartSum() >= FREE_SHIP;

  // ---- 6. Бөлім нүктелері ----
  const secs = [["#home", "Басты бет"], ["#products", "Өнімдер"], ["#power", "Қуат"], ["#about", "Компания"], ["#faq", "Сұрақ-жауап"], ["#contact", "Байланыс"]].filter(s => $(s[0]));
  const dots = document.createElement("nav"); dots.className = "dots"; dots.innerHTML = secs.map(s => `<a href="${s[0]}"><span>${s[1]}</span></a>`).join(""); document.body.appendChild(dots);
  const da = [...dots.children];
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) da.forEach((a, i) => a.classList.toggle("on", secs[i][0] === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach(s => spy.observe($(s[0])));

  // ---- 7. Жаңалықтарға жазылу ----
  const nw = document.createElement("section"); nw.className = "news";
  nw.innerHTML = `<span class="section-label" style="color:#ff9f1c">NEWSLETTER</span><h2>Акциялардан бірінші біл</h2><p>Жаңа өнімдер мен жеңілдіктер туралы хабар алыңыз. Спам жоқ.</p>
    <form><input type="email" placeholder="Email мекенжайыңыз" required><button>Жазылу →</button></form>
    <div class="ok"><svg width="34" height="34" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="15" stroke="#2a9d5c" stroke-width="2"/><path d="M9 17.5l5.5 5.5L25 12" stroke="#2a9d5c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Рахмет! Сіз жазылдыңыз 🎉</span></div>`;
  (document.querySelector(".faq") || $("footer")).after(nw);
  try { if (localStorage.getItem("asusNews")) nw.classList.add("done"); } catch (e) {}
  nw.querySelector("form").onsubmit = e => { e.preventDefault(); try { localStorage.setItem("asusNews", nw.querySelector("input").value); } catch (x) {} nw.classList.add("done"); confetti(80); };
})();
