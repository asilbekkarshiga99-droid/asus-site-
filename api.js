// ===== Серверге қосылу: аккаунт, тапсырыс, төлем, пікірлер, статистика, AI-кеңесші =====
// Сайт серверсіз ашылса (жай файл не статикалық хостинг) — бәрі бұрынғыдай localStorage-та жұмыс істей береді.
(function () {
  const $ = s => document.querySelector(s);
  const E = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => (typeof formatPrice === "function" ? formatPrice(n) : n.toLocaleString("ru") + " ₸");
  const API = window.API = { on: false, ai: false, user: null };
  async function call(method, url, body) {
    const r = await fetch(url, { method, credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Қате " + r.status); return j;
  }
  API.call = call;
  const vid = (() => { try { let v = localStorage.getItem("asusVid"); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("asusVid", v); } return v; } catch (e) { return ""; } })();
  const track = (type, product) => API.on && call("POST", "/api/track", { type, product, vid }).catch(() => {});

  // ---------- модал терезе ----------
  const modal = document.createElement("div"); modal.className = "cart-modal acc-modal";
  modal.innerHTML = `<div class="cart-window quick-window"><div class="cart-header"><div><span>ACCOUNT</span><h2 id="accTitle">Жеке кабинет</h2></div><button id="accClose">×</button></div><div id="accBody"></div></div>`;
  document.body.appendChild(modal);
  const body = $("#accBody"), openM = () => modal.classList.add("show"), closeM = () => modal.classList.remove("show");
  $("#accClose").onclick = closeM; modal.addEventListener("click", e => { if (e.target === modal) closeM(); });

  const accBtn = document.createElement("button"); accBtn.className = "theme-button acc-btn"; accBtn.title = "Жеке кабинет"; accBtn.textContent = "👤"; accBtn.hidden = true;
  const ha = $(".header-actions"); if (ha) ha.insertBefore(accBtn, $("#openOrders") || ha.lastElementChild);
  accBtn.onclick = () => { render(); openM(); };

  function authForm(mode) {
    $("#accTitle").textContent = mode === "login" ? "Кіру" : "Тіркелу";
    body.innerHTML = `<div class="acc-tabs"><button data-m="login" class="${mode === "login" ? "on" : ""}">Кіру</button><button data-m="register" class="${mode === "register" ? "on" : ""}">Тіркелу</button></div>
      <form class="checkout-form show acc-form">${mode === "register" ? '<input name="name" placeholder="Атыңыз" required maxlength="60" autocomplete="name">' : ""}
      <input name="email" type="email" placeholder="Email" required autocomplete="email"><input name="password" type="password" placeholder="Құпиясөз (кемінде 6 таңба)" required minlength="6" autocomplete="${mode === "login" ? "current-password" : "new-password"}">
      <p class="acc-err" hidden></p><button class="main-button" type="submit">${mode === "login" ? "Кіру →" : "Тіркелу →"}</button></form>
      <p class="acc-note">Тіркелсең, тапсырыстарың барлық құрылғыда сақталады және статусын көре аласың.</p>`;
    body.querySelector(".acc-tabs").onclick = e => { const b = e.target.closest("button"); if (b) authForm(b.dataset.m); };
    body.querySelector("form").onsubmit = async e => { e.preventDefault(); const f = e.target, err = f.querySelector(".acc-err"), btn = f.querySelector("button"); btn.disabled = true; err.hidden = true;
      try { const r = await call("POST", "/api/" + mode, { name: f.name && f.name.value, email: f.email.value, password: f.password.value }); API.user = r.user; sync(); render(); showNotification && showNotification("Қош келдің, " + r.user.name + "!"); }
      catch (x) { err.textContent = x.message; err.hidden = false; } finally { btn.disabled = false; } };
  }
  const payBox = p => p ? `<div class="acc-pay ${p.method}"><b>${p.method === "kaspi" ? "Kaspi арқылы төлеу" : p.method === "card" ? "Картамен төлеу" : "Төлем"}</b><p>${E(p.text)}</p>${p.method === "kaspi" && p.phone ? `<div class="acc-copy"><code>${E(p.phone)}</code><button data-copy="${E(p.phone)}">Көшіру</button></div><div class="acc-copy"><code>${E(p.comment)}</code><button data-copy="${E(p.comment)}">Көшіру</button></div>` : ""}</div>` : "";
  const orderCard = o => `<div class="acc-order"><div class="acc-oh"><b>${E(o.id)}</b><span class="acc-st st-${E(o.status).replace(/\s/g, "")}">${E(o.status)}</span></div>
    <div class="acc-meta">${new Date(o.date).toLocaleString("ru")} · ${E(o.payName)}</div>
    <ul>${o.items.map(i => `<li>${E(i.name)} × ${i.quantity}<span>${money(i.price * i.quantity)}</span></li>`).join("")}</ul>
    ${o.discount ? `<div class="acc-row"><span>Жеңілдік (${E(o.promo)})</span><span>−${money(o.discount)}</span></div>` : ""}<div class="acc-row tot"><span>Жалпы</span><span>${money(o.total)}</span></div>${payBox(o.payment)}</div>`;
  async function render() {
    if (!API.user) return authForm("login");
    $("#accTitle").textContent = "Сәлем, " + API.user.name;
    body.innerHTML = `<div class="acc-head"><span>${E(API.user.email)}</span><div>${API.user.admin ? '<a class="remove-product" href="admin.html">📊 Әкімші панелі</a> ' : ""}<button class="remove-product" id="accOut">Шығу</button></div></div><h3>Тапсырыстарым</h3><div id="accOrders">Жүктелуде...</div>`;
    $("#accOut").onclick = async () => { await call("POST", "/api/logout").catch(() => {}); API.user = null; sync(); authForm("login"); };
    try { const r = await call("GET", "/api/orders"); $("#accOrders").innerHTML = r.orders.length ? r.orders.map(orderCard).join("") : "<p class='acc-note'>Әзірге тапсырыс жоқ.</p>"; }
    catch (x) { $("#accOrders").textContent = x.message; }
  }
  body.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) { navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy); b.textContent = "✓"; setTimeout(() => b.textContent = "Көшіру", 1200); } });
  function sync() { accBtn.classList.toggle("in", !!API.user); accBtn.title = API.user ? API.user.name : "Кіру / тіркелу"; }

  // ---------- Тапсырысты серверге жіберу ----------
  if (typeof saveOrder === "function") {
    const orig = saveOrder;
    window.saveOrder = function (o) {
      orig(o); if (!API.on) return;
      const f = document.getElementById("checkoutForm"), v = n => (f && f.querySelector(`[name=${n}]`) || {}).value || "";
      const data = { id: o.id, items: o.items.map(i => ({ name: i.name, quantity: i.quantity })), promo: typeof promoCode !== "undefined" ? promoCode : "",
        customer: { name: v("customer"), phone: v("phone"), address: v("address"), city: v("city"), pay: v("pay") } };
      call("POST", "/api/orders", data).then(r => {
        $("#accTitle").textContent = "Тапсырыс қабылданды ✓";
        body.innerHTML = `<p class="acc-note">Тапсырыс нөмірі: <b>${E(r.order.id)}</b>. ${API.user ? "Статусын «👤 Жеке кабинет» бөлімінен көре аласыз." : "Тіркелсеңіз, статусын кабинеттен көре аласыз."}</p>${orderCard(r.order)}`;
        openM();
      }).catch(x => showNotification && showNotification("Сервер: " + x.message));
    };
  }

  // ---------- Пікірлер, хабарландырулар, жазылу, байланыс ----------
  async function pullReviews() { try { const r = await call("GET", "/api/reviews"), loc = JSON.parse(localStorage.getItem("asusReviews") || "{}");
    for (const [p, list] of Object.entries(r.reviews)) { const have = loc[p] = loc[p] || []; list.forEach(x => { if (!have.some(h => h.n === x.n && h.t === x.t)) have.push({ n: x.n, r: x.r, t: x.t }); }); }
    localStorage.setItem("asusReviews", JSON.stringify(loc)); } catch (e) {} }
  document.addEventListener("submit", e => { if (!API.on) return; const f = e.target;
    if (f.id === "ppForm") { const m = location.hash.match(/^#product=(.+)$/), el = f.elements; if (m) call("POST", "/api/reviews", { product: decodeURIComponent(m[1]), n: el.n.value, r: el.r.value, t: el.t.value }).catch(() => {}); }
    if (f.id === "contactForm") { const i = f.querySelectorAll("input,textarea"); call("POST", "/api/contact", { name: i[0].value, email: i[1].value, text: (f.querySelector("textarea") || {}).value }).catch(() => {}); }
  }, true);
  try { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, val) { set.call(this, k, val);
    if (!API.on || this !== window.localStorage) return;
    if (k === "asusNews") call("POST", "/api/subscribe", { email: val }).catch(() => {});
    if (k === "asusNotify") { try { const l = JSON.parse(val), x = l[l.length - 1]; x && call("POST", "/api/notify", { product: x.n, contact: x.c }).catch(() => {}); } catch (e) {} } }; } catch (e) {}

  // ---------- Өнім қаралымын санау ----------
  let lastView = ""; const onHash = () => { const m = location.hash.match(/^#product=(.+)$/); if (m && m[1] !== lastView) { lastView = m[1]; track("view", decodeURIComponent(m[1])); } if (!m) lastView = ""; };
  addEventListener("hashchange", onHash);

  // ---------- Нағыз AI-кеңесші (Claude) ----------
  function aiChat() {
    const form = document.getElementById("chatForm"), log = document.getElementById("chatLog"); if (!form || !log) return;
    const hist = [], old = form.onsubmit;
    const say = (html, me) => { const m = document.createElement("div"); m.className = "msg " + (me ? "me" : "bot"); m.innerHTML = html; log.appendChild(m); log.scrollTop = 1e6; return m; };
    const fmt = t => E(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[(.+?)\]\]/g, (_, n) => `<button class="chip" data-go="${n}">${n} →</button>`).replace(/\n/g, "<br>");
    say("✨ Енді мен нағыз AI-кеңесшімін. Кез келген сұрақ қой: «ойынға 600 мыңға не аламын?», «Zenbook пен Vivobook айырмасы?»");
    form.onsubmit = async e => { e.preventDefault(); const inp = document.getElementById("chatIn"), q = inp.value.trim(); if (!q) return;
      inp.value = ""; say(E(q), true); hist.push({ role: "user", content: q }); const wait = say('<span class="typing"><i></i><i></i><i></i></span>');
      try { const r = await call("POST", "/api/ai", { messages: hist }); hist.push({ role: "assistant", content: r.reply }); wait.innerHTML = fmt(r.reply); }
      catch (x) { hist.pop(); wait.remove(); if (old) { inp.value = q; old.call(form, e); log.querySelectorAll(".msg.me")[log.querySelectorAll(".msg.me").length - 1].remove(); } else say(E(x.message)); }
      log.scrollTop = 1e6; };
  }

  // ---------- Іске қосу ----------
  (async () => {
    try { const h = await call("GET", "/api/health"); API.on = true; API.ai = !!h.ai; } catch (e) { return; }   // сервер жоқ — localStorage режимі
    accBtn.hidden = false; track("visit");
    try { API.user = (await call("GET", "/api/me")).user; } catch (e) {} sync();
    pullReviews(); onHash(); if (API.ai) aiChat();
    document.dispatchEvent(new CustomEvent("api:ready", { detail: API }));
  })();
})();
