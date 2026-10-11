// ================== ТОЛЫҚ ПАКЕТ: көбірек функциялар ==================
const TG_USER = "username"; // ← өз Telegram username-іңді жаз (@-сыз)
(function () {
  const $ = s => document.querySelector(s);
  const find = n => storeProducts.find(p => p.name === n);
  const cardOf = n => productList.find(x => x.dataset.name === n);
  const addToCart = n => { const c = cardOf(n); if (c) c.querySelector(".add-cart").click(); };
  const modal = h => { const d = document.createElement("div"); d.className = "cart-modal"; d.innerHTML = h; document.body.appendChild(d);
    d.addEventListener("click", e => { if (e.target === d || e.target.classList.contains("x")) d.classList.remove("show"); }); return d; };
  const head = (tag, title) => `<div class="cart-header"><div><span>${tag}</span><h2>${title}</h2></div><button class="x">×</button></div>`;
  const store = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // 1. Бөліп төлеу калькуляторы + "Бірге аласыз" (себетте)
  const inst = document.createElement("div"); inst.className = "inst-box";
  inst.innerHTML = `<select id="instM" class="sort-select"><option value="6">6 ай</option><option value="12" selected>12 ай</option><option value="24">24 ай</option></select><span id="instT"></span><button class="remove-product" id="qrBtn">📱 QR</button>`;
  const up = document.createElement("div"); up.id = "upsell";
  const cb = $("#cartModal .cart-bottom"); cb.before(up); cb.before(inst);
  function renderExtra() {
    const t = cartSum(), m = Number($("#instM").value);
    inst.style.display = t ? "" : "none";
    $("#instT").textContent = t ? "Айына " + formatPrice(Math.round(t / m)) + " × " + m : "";
    const hasMain = cart.some(i => { const p = find(i.name); return !p || p.cat !== "accessory"; });
    const sugg = hasMain ? storeProducts.filter(p => p.cat === "accessory" && p.stock !== 0 && !cart.some(i => i.name === p.name)).slice(0, 2) : [];
    up.innerHTML = sugg.length ? `<p class="quiz-step">БІРГЕ АЛСАҢЫЗ</p>` + sugg.map(p => `<button class="chip" data-n="${esc(p.name)}">+ ${esc(p.name)} · ${formatPrice(p.price)}</button>`).join("") : "";
  }
  up.addEventListener("click", e => { const b = e.target.closest("[data-n]"); if (b) addToCart(b.dataset.n); });
  $("#instM").onchange = renderExtra;
  const _uc = updateCart; window.updateCart = function () { _uc(); renderExtra(); }; renderExtra();

  // 2. QR код (себет → телефон)
  const qrM = modal(`<div class="cart-window quick-window">${head("QR", "Тапсырыс QR")}<div id="qrBox" style="display:flex;justify-content:center;margin:20px 0"></div><p class="install">Телефонмен сканерлесең, тапсырыс мәтіні шығады.</p></div>`);
  $("#qrBtn").onclick = () => {
    const txt = ("ASUS тапсырыс:\n" + cart.map(i => `${i.name} x${i.quantity}`).join("\n") + "\nЖалпы: " + formatPrice(cartSum())).slice(0, 600), box = $("#qrBox");
    box.innerHTML = ""; qrM.classList.add("show");
    const mk = () => new QRCode(box, { text: txt, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.L });
    if (window.QRCode) return mk();
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = mk; s.onerror = () => box.textContent = "QR жүктелмеді (интернет керек)"; document.head.appendChild(s);
  };

  // 3. Таусылған тауарға "Хабарла"
  productList.forEach(p => { if (!p.querySelector(".add-cart").disabled) return;
    const n = document.createElement("button"); n.className = "remove-product notify-btn"; n.textContent = "🔔 Қайта түскенде хабарла";
    n.onclick = () => { const m = prompt("Email немесе телефон:"); if (!m) return; const l = store("asusNotify", []); l.push({ n: p.dataset.name, c: m }); save("asusNotify", l); showNotification("Қайта түскенде хабарлаймыз ✓"); };
    p.querySelector(".product-content").appendChild(n); });

  // 4. Дауыспен іздеу
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) { const mic = document.createElement("button"); mic.className = "mic"; mic.type = "button"; mic.textContent = "🎤"; $(".search").appendChild(mic);
    mic.onclick = () => { const r = new SR(); r.lang = "ru-RU"; r.onresult = e => { searchInput.value = e.results[0][0].transcript; searchInput.dispatchEvent(new Event("input")); }; r.start(); showNotification("Тыңдап тұрмын... 🎤"); }; }

  // 5. Өнім беті (#product=...), zoom, пікірлер
  const pp = document.createElement("div"); pp.className = "pp"; pp.hidden = true; document.body.appendChild(pp);
  let curPage = null;
  const go = n => { location.hash = "product=" + encodeURIComponent(n); };
  function closePage() { pp.hidden = true; curPage = null; document.body.style.overflow = ""; history.replaceState(null, "", location.pathname + location.search); }
  function renderPage(n) {
    const p = find(n); if (!p) return closePage();
    curPage = n; const rv = store("asusReviews", {})[n] || [];
    const avg = rv.length ? (rv.reduce((a, r) => a + r.r, 0) / rv.length).toFixed(1) : null;
    const rel = storeProducts.filter(x => x.cat === p.cat && x.name !== n).slice(0, 3);
    pp.innerHTML = `<div class="pp-in"><button class="remove-product" id="ppBack">← Артқа</button>
      <div class="pp-grid"><div class="pp-img" id="ppImg">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}">` : "<h2>" + esc(p.name) + "</h2>"}</div>
      <div><span class="quiz-step">${esc(p.type || "ASUS")}</span><h1>${esc(p.name)}</h1>
      <div class="rating">${avg ? "★".repeat(Math.round(avg)) + `<small>${avg} · ${rv.length} пікір</small>` : "<small>Пікір әзірге жоқ</small>"}</div>
      <p>${esc(p.desc)}</p><ul class="specs">${(p.specs || []).map(s => "<li>" + esc(s) + "</li>").join("")}</ul>
      <div class="pp-price">${p.old ? `<s>${formatPrice(p.old)}</s> ` : ""}${formatPrice(p.price)}</div>
      <p class="install">Айына ${formatPrice(Math.round(p.price / 12))}-дан · 12 айға бөліп төлеу</p>
      <button class="main-button" id="ppAdd" ${p.stock === 0 ? "disabled" : ""}>${p.stock === 0 ? "Таусылды" : "Себетке қосу →"}</button>
      <button class="remove-product" id="ppShare">🔗 Сілтемені көшіру</button></div></div>
      <h3>Пікірлер</h3>${rv.map(r => `<div class="rev"><b>${"★".repeat(r.r)}</b> <strong>${esc(r.n)}</strong><br>${esc(r.t)}</div>`).join("") || "<p>Бірінші болып пікір қалдырыңыз!</p>"}
      <form id="ppForm" class="checkout-form show"><input name="n" placeholder="Атыңыз" required><select name="r" class="sort-select"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select><textarea name="t" placeholder="Пікіріңіз" required></textarea><button class="main-button">Пікір жіберу</button></form>
      ${rel.length ? `<h3>Ұқсас өнімдер</h3>${rel.map(x => `<button class="chip" data-go="${esc(x.name)}">${esc(x.name)} · ${formatPrice(x.price)}</button>`).join("")}` : ""}</div>`;
    pp.hidden = false; document.body.style.overflow = "hidden"; pp.scrollTop = 0;
    const im = $("#ppImg img"); if (im) $("#ppImg").addEventListener("mousemove", e => { const r = e.currentTarget.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%"; });
    $("#ppBack").onclick = closePage; $("#ppAdd").onclick = () => addToCart(n);
    $("#ppShare").onclick = () => { try { navigator.clipboard.writeText(location.href); } catch (e) {} showNotification("Сілтеме көшірілді ✓"); };
    pp.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
    $("#ppForm").onsubmit = e => { e.preventDefault(); const f = e.target.elements, all = store("asusReviews", {});
      (all[n] = all[n] || []).unshift({ n: f.n.value.trim(), r: Number(f.r.value), t: f.t.value.trim() }); save("asusReviews", all); renderPage(n); showNotification("Рахмет, пікір қосылды ✓"); };
  }
  const route = () => { const m = location.hash.match(/^#product=(.+)$/); m ? (curPage !== decodeURIComponent(m[1]) && renderPage(decodeURIComponent(m[1]))) : (curPage && closePage()); };
  addEventListener("hashchange", route); route();
  document.addEventListener("keydown", e => { if (e.key === "Escape" && curPage) closePage(); });
  productList.forEach(p => p.querySelector(".product-image").addEventListener("click", e => { if (e.target.tagName === "IMG") go(p.dataset.name); }));
  const pg = document.createElement("button"); pg.className = "remove-product"; pg.textContent = "Толық бет →"; $("#qvAdd").before(pg);
  pg.onclick = () => { quickModal.classList.remove("show"); go(quickProduct.dataset.name); };

  // 6. Trade-in калькуляторы
  const ti = modal(`<div class="cart-window quick-window">${head("TRADE-IN", "Ескі құрылғы бағасы")}
    <label class="cfg-row">Түрі<select id="tiT" class="sort-select"><option value="150000">Ноутбук</option><option value="130000">Компьютер</option></select></label>
    <label class="cfg-row">Жасы<select id="tiA" class="sort-select"><option value="1">1 жылға дейін</option><option value=".7">1–3 жыл</option><option value=".45">3–5 жыл</option><option value=".25">5 жылдан көп</option></select></label>
    <label class="cfg-row">Жағдайы<select id="tiC" class="sort-select"><option value="1">Өте жақсы</option><option value=".75">Жақсы</option><option value=".5">Қанағаттанарлық</option></select></label>
    <div class="cfg-total" id="tiR"></div><p class="install">Шамамен баға. Нақты бағаны маман тексергеннен кейін айтады.</p><button class="main-button" id="tiWa" style="width:100%">Нақты баға сұрау →</button></div>`);
  const tiCalc = () => { const v = Math.round($("#tiT").value * $("#tiA").value * $("#tiC").value / 1000) * 1000; $("#tiR").textContent = "≈ " + formatPrice(v); return v; };
  ["tiT", "tiA", "tiC"].forEach(i => $("#" + i).onchange = tiCalc); tiCalc();
  $("#tiWa").onclick = () => window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Сәлем! Trade-in: ескі құрылғымның шамамен бағасы " + $("#tiR").textContent + ". Нақтылап бере аласыз ба?"), "_blank");

  // 7. "Бұл ойын жүре ме?"
  const GAMES = { "Minecraft": 1, "Free Fire (PC)": 1, "CS2": 2, "Fortnite": 3, "GTA V": 3, "Cyberpunk 2077": 4, "Black Myth: Wukong": 5 };
  const tier = p => { const s = (p.specs || []).join(" "); return /4080/.test(s) ? 5 : /4070/.test(s) ? 4 : /4060/.test(s) ? 3 : /RTX|GTX|Radeon/.test(s) ? 2 : 1; };
  const pcs = storeProducts.filter(p => ["laptop", "gaming", "pc"].includes(p.cat));
  const gc = modal(`<div class="cart-window quick-window">${head("GAME CHECK", "Бұл ойын жүре ме?")}
    <label class="cfg-row">Құрылғы<select id="gcP" class="sort-select">${pcs.map(p => `<option>${esc(p.name)}</option>`).join("")}</select></label>
    <label class="cfg-row">Ойын<select id="gcG" class="sort-select">${Object.keys(GAMES).map(g => `<option>${g}</option>`).join("")}</select></label>
    <div class="cfg-total" id="gcR"></div><p class="install">Бұл жалпы бағалау (видеокарта деңгейі бойынша), нақты FPS емес.</p></div>`);
  const gcCalc = () => { const t = tier(find($("#gcP").value)), n = GAMES[$("#gcG").value];
    $("#gcR").textContent = t >= n + 1 ? "✅ Жоғары баптауда жүреді" : t >= n ? "🟡 Орташа баптауда жүреді" : "❌ Әлсіздеу, ұсынбаймыз"; };
  ["gcP", "gcG"].forEach(i => $("#" + i).onchange = gcCalc); if (pcs.length) gcCalc();

  // 8. Кеңесші чат (ережеге негізделген)
  const chat = modal(`<div class="cart-window quick-window">${head("ADVISOR", "Кеңесші")}<div class="chat-log" id="chatLog"></div>
    <form id="chatForm" class="promo-row"><input id="chatIn" placeholder="Мысалы: 500 мың, ойынға" autocomplete="off"><button class="main-button">→</button></form></div>`);
  const say = (t, me) => { const m = document.createElement("div"); m.className = "msg " + (me ? "me" : "bot"); m.innerHTML = t; $("#chatLog").appendChild(m); $("#chatLog").scrollTop = 1e6; };
  say("Сәлем! 👋 Бюджетіңіз бен мақсатыңызды жазыңыз, мысалы: <i>«400 мың, оқуға»</i>.");
  $("#chatForm").onsubmit = e => { e.preventDefault(); const q = $("#chatIn").value.trim(); if (!q) return; $("#chatIn").value = ""; say(esc(q), true);
    const l = q.toLowerCase(), m = l.match(/(\d+)\s*(мың|тыс|k|к)?/); let b = Infinity; if (m) { b = +m[1]; if (m[2] || b < 5000) b *= 1000; }
    const cats = /ойын|game|игр|gaming/.test(l) ? ["gaming", "pc"] : /дизайн|монтаж|видео/.test(l) ? ["laptop", "gaming", "pc"] : /оқу|жұмыс|студент|учеб|работ|study/.test(l) ? ["laptop"] : /монитор|клав|аксесс|тышқан/.test(l) ? ["accessory"] : null;
    if (!cats) return say("Не үшін керек екенін жазыңыз: <b>ойын</b>, <b>оқу/жұмыс</b>, <b>дизайн</b> немесе <b>аксессуар</b>.");
    const list = storeProducts.filter(p => cats.includes(p.cat) && p.stock !== 0), pick = list.filter(p => p.price <= b).sort((a, c) => c.price - a.price)[0] || list.sort((a, c) => a.price - c.price)[0];
    if (!pick) return say("Қазір сәйкес өнім жоқ 😕");
    say(`Сізге <b>${esc(pick.name)}</b> ұсынамын, ${formatPrice(pick.price)}.${pick.price > b ? " (бюджеттен сәл жоғары)" : ""}<br><button class="chip" data-go="${esc(pick.name)}">Қарау →</button>`); };
  $("#chatLog").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { chat.classList.remove("show"); go(b.dataset.go); } });

  // 10. Конфетти (тапсырыс өткенде)
  function confetti() { const c = document.createElement("canvas"); c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:4000"; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const x = c.getContext("2d"), ps = [...Array(140)].map(() => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 6, c: `hsl(${Math.random() * 360},90%,60%)`, r: Math.random() * 6 })); let f = 0;
    (function t() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); }); ++f < 180 ? requestAnimationFrame(t) : c.remove(); })(); }
  $("#checkoutForm").addEventListener("submit", () => { if (cart.length) { confetti(); } }, true);

  // 11. Telegram-ға тапсырыс (мәтін көшіріледі + чат ашылады)
  $("#checkoutForm").querySelector(".wa-check").insertAdjacentHTML("afterend", `<label class="wa-check"><input type="checkbox" id="tgSend"> Telegram-ға да жіберу (мәтін көшіріледі)</label>`);
  $("#checkoutForm").addEventListener("submit", () => { if (!$("#tgSend").checked || !cart.length) return; const f = $("#checkoutForm").elements;
    const msg = "Жаңа тапсырыс:\n" + cart.map(i => `• ${i.name} × ${i.quantity}`).join("\n") + `\nЖалпы: ${formatPrice(cartSum())}\n${f.customer.value}, ${f.phone.value}\n${f.city.value}, ${f.address.value}\nТөлем: ${f.pay.value}`;
    try { navigator.clipboard.writeText(msg); } catch (e) {} showNotification("Мәтін көшірілді, Telegram-да жібер ✓"); window.open("https://t.me/" + TG_USER, "_blank"); }, true);

  // 13. Құралдар мәзірі (батырмалар жиналады)
  const tools = $(".float-tools"); tools.classList.add("closed");
  const mk = (label, fn) => { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; tools.appendChild(b); };
  mk("♻️ Trade-in", () => ti.classList.add("show")); mk("🎮 Жүре ме?", () => gc.classList.add("show")); mk("💬 Кеңесші", () => chat.classList.add("show"));
  const tg = document.createElement("button"); tg.className = "ft-toggle"; tg.textContent = "🧰 Құралдар"; tg.onclick = () => tools.classList.toggle("closed"); tools.prepend(tg);
})();
