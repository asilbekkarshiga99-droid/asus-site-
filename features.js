// ================== ҚОСЫМША ФУНКЦИЯЛАР ==================
const WA_NUMBER = "77000000000"; // ← өз WhatsApp нөміріңді жаз (елдің кодымен, + belgisiz)
(function () {
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pickR = a => a[Math.floor(Math.random() * a.length)];
  const modal = h => { const d = document.createElement("div"); d.className = "cart-modal"; d.innerHTML = h; document.body.appendChild(d);
    d.addEventListener("click", e => { if (e.target === d || e.target.classList.contains("x")) d.classList.remove("show"); }); return d; };

  // 1. Скролл прогресс-бар
  const bar = document.createElement("div"); bar.className = "progress-bar"; document.body.appendChild(bar);
  addEventListener("scroll", () => { bar.style.width = scrollY / (document.documentElement.scrollHeight - innerHeight) * 100 + "%"; });

  // 2. Рейтинг және "қалды" белгісі
  productList.forEach(p => {
    const h = hash(p.dataset.name), r = (4.3 + h % 8 / 10).toFixed(1), n = 12 + h % 90, left = 2 + h % 8;
    const box = document.createElement("div");
    box.innerHTML = `<div class="rating">${"★".repeat(Math.round(r))}<small>${r} · ${n} пікір</small></div>` +
      (p.querySelector(".add-cart").disabled ? "" : left < 6 ? `<div class="stock-left">🔥 Қоймада ${left} дана қалды</div>` : `<div class="stock-left ok">✓ Қоймада бар</div>`);
    p.querySelector(".product-content p").after(...box.children);
  });

  // 3. Сурет еңкеюі (тек суреттің өзі қозғалады, батырмалар қозғалмайды)
  if (window.matchMedia && matchMedia("(hover:hover)").matches) productList.forEach(p => {
    const box = p.querySelector(".product-image"), im = box.querySelector("img"); if (!im) return;
    box.addEventListener("mousemove", e => { const r = box.getBoundingClientRect();
      im.style.transform = `perspective(600px) rotateY(${((e.clientX - r.left) / r.width - .5) * 14}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 14}deg) scale(1.06)`; });
    box.addEventListener("mouseleave", () => im.style.transform = "");
  });

  // 4. Жылдам қарауда сурет көрсету
  const _oq = window.openQuick;
  window.openQuick = product => { _oq(product);
    const src = product.querySelector(".product-image img"), old = document.getElementById("qvImg"); if (old) old.remove();
    if (src) { const im = document.createElement("img"); im.id = "qvImg"; im.className = "qv-img"; im.src = src.src; document.getElementById("qvDesc").before(im); } };

  // 6. Таңдау көмекшісі
  const quiz = modal(`<div class="cart-window quick-window"><div class="cart-header"><div><span>ASSISTANT</span><h2>Маған не керек?</h2></div><button class="x">×</button></div><div id="quizBody"></div></div>`);
  const qb = quiz.querySelector("#quizBody"); let purpose = "";
  const step1 = () => { qb.innerHTML = `<p class="quiz-step">1 / 2</p><p>Құрылғыны не үшін аласыз?</p><div class="opt-grid"><button data-p="game">🎮 Ойын ойнау</button><button data-p="study">📚 Оқу / жұмыс</button><button data-p="design">🎨 Дизайн / монтаж</button><button data-p="acc">🖱 Аксессуар</button></div>`;
    qb.querySelectorAll("button").forEach(b => b.onclick = () => { purpose = b.dataset.p; step2(); }); };
  const step2 = () => { qb.innerHTML = `<p class="quiz-step">2 / 2</p><p>Бюджетіңіз қанша?</p><div class="opt-grid"><button data-b="450000">≤ 450 000 ₸</button><button data-b="750000">≤ 750 000 ₸</button><button data-b="99999999">Шектеусіз</button></div>`;
    qb.querySelectorAll("button").forEach(b => b.onclick = () => result(Number(b.dataset.b))); };
  const result = budget => {
    const cats = { game: ["gaming", "pc"], study: ["laptop"], design: ["laptop", "gaming", "pc"], acc: ["accessory"] }[purpose];
    const list = storeProducts.filter(p => cats.includes(p.cat) && p.stock !== 0);
    const pick = list.filter(p => p.price <= budget).sort((a, b) => b.price - a.price)[0] || list.sort((a, b) => a.price - b.price)[0];
    if (!pick) { qb.innerHTML = "<p>Қазір сәйкес өнім жоқ 😕</p>"; return; }
    qb.innerHTML = `<div class="quiz-result">${pick.img ? `<img class="qv-img" src="${esc(pick.img)}">` : ""}<p class="quiz-step">СІЗГЕ ҰСЫНАМЫЗ</p><h3>${esc(pick.name)}</h3><p>${esc(pick.desc)}</p>
      <ul class="specs">${(pick.specs || []).map(s => "<li>" + esc(s) + "</li>").join("")}</ul><div class="price">${formatPrice(pick.price)}</div>
      ${pick.price > budget ? "<p class='install'>Бюджеттен сәл жоғары, бірақ ең жақын нұсқа.</p>" : ""}
      <button class="main-button" id="qAdd">Себетке қосу →</button> <button class="remove-product" id="qAgain">Қайта</button></div>`;
    qb.querySelector("#qAdd").onclick = () => { productList.find(x => x.dataset.name === pick.name).querySelector(".add-cart").click(); quiz.classList.remove("show"); };
    qb.querySelector("#qAgain").onclick = step1;
  };

  // 7. ПК конфигуратор + шамамен FPS
  const PARTS = {
    cpu: [["Core i5", 120000], ["Core i7", 190000], ["Core i9", 290000]],
    gpu: [["RTX 4060", 260000, [240, 110, 130]], ["RTX 4070", 380000, [320, 150, 160]], ["RTX 4080", 620000, [450, 200, 200]]],
    ram: [["16 GB", 35000], ["32 GB", 70000]],
    ssd: [["512 GB", 30000], ["1 TB", 50000], ["2 TB", 95000]]
  }, BASE = 150000, LABEL = { cpu: "Процессор", gpu: "Видеокарта", ram: "Жедел жад", ssd: "SSD" };
  const cfg = modal(`<div class="cart-window quick-window"><div class="cart-header"><div><span>BUILDER</span><h2>Өз ПК-ңды құрастыр</h2></div><button class="x">×</button></div>
    ${Object.keys(PARTS).map(k => `<label class="cfg-row">${LABEL[k]}<select class="sort-select" data-k="${k}">${PARTS[k].map((o, i) => `<option value="${i}">${o[0]} (+${o[1].toLocaleString("kk-KZ")} ₸)</option>`).join("")}</select></label>`).join("")}
    <p class="quiz-step">ШАМАМЕН FPS (1080p, жоғары баптау)</p><div class="fps" id="fps"></div>
    <div class="cfg-total" id="cfgTotal"></div><p class="install" id="cfgInst"></p><button class="main-button" id="cfgAdd" style="width:100%">Себетке қосу →</button></div>`);
  const sel = [...cfg.querySelectorAll("select")], cur = () => Object.fromEntries(sel.map(s => [s.dataset.k, PARTS[s.dataset.k][s.value]]));
  const calc = () => { const c = cur(), total = BASE + Object.values(c).reduce((a, o) => a + o[1], 0);
    document.getElementById("cfgTotal").textContent = formatPrice(total);
    document.getElementById("cfgInst").textContent = "Айына " + formatPrice(Math.round(total / 12)) + "-дан · 12 айға бөліп төлеу";
    document.getElementById("fps").innerHTML = ["CS2", "Fortnite", "GTA V"].map((g, i) => `<div><b>${c.gpu[2][i]}</b>${g}</div>`).join(""); return total; };
  sel.forEach(s => s.onchange = calc); calc();
  document.getElementById("cfgAdd").onclick = () => { const c = cur(), name = `Custom PC (${c.cpu[0]} · ${c.gpu[0]} · ${c.ram[0]} · ${c.ssd[0]})`, price = calc();
    const ex = cart.find(i => i.name === name); ex ? ex.quantity++ : cart.push({ name, price, quantity: 1 });
    updateCart(); cfg.classList.remove("show"); showNotification("Жинақ себетке қосылды ✓"); };

  // 8. Тапсырысты WhatsApp-қа жіберу
  const co = document.getElementById("checkoutForm");
  co.querySelector("button[type=submit]").insertAdjacentHTML("beforebegin", `<label class="wa-check"><input type="checkbox" id="waSend" checked> Тапсырысты WhatsApp-қа да жіберу</label>`);
  co.addEventListener("submit", () => { if (!document.getElementById("waSend").checked || !cart.length) return;
    const f = co.elements, lines = cart.map(i => `• ${i.name} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`).join("\n");
    const msg = `Сәлем! Жаңа тапсырыс:\n${lines}\nЖалпы: ${formatPrice(cartSum())}\nАты: ${f.customer.value}\nТел: ${f.phone.value}\nҚала: ${f.city.value}, ${f.address.value}\nТөлем: ${f.pay.value}`;
    window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank"); }, true);

  // 9. Шығып бара жатқанда промокод (exit-intent)
  Object.assign(PROMOS, { ASUS5: 5 });
  const exit = modal(`<div class="cart-window quick-window"><div class="cart-header"><div><span>WAIT!</span><h2>Кетпей тұрыңыз 🎁</h2></div><button class="x">×</button></div>
    <p>Бірінші тапсырысқа <b>−5%</b> жеңілдік. Промокод: <b>ASUS5</b></p><button class="main-button" id="exitApply" style="width:100%;margin-top:14px">Қолдану →</button></div>`);
  document.getElementById("exitApply").onclick = () => { promoCode = "ASUS5"; promoPercent = 5; promoInput.value = "ASUS5";
    try { localStorage.setItem("asusPromo", "ASUS5"); } catch (e) {} updateCart(); exit.classList.remove("show"); showNotification("Промокод ASUS5 қолданылды ✓"); };
  document.addEventListener("mouseleave", e => { if (e.clientY > 0 || sessionStorage.getItem("exitShown")) return;
    try { sessionStorage.setItem("exitShown", 1); } catch (x) {} exit.classList.add("show"); });

  // 10. Батырмалар
  const tools = document.createElement("div"); tools.className = "float-tools";
  tools.innerHTML = `<button id="openQuiz">🎯 Таңдауға көмек</button><button id="openCfg">🛠 ПК құрастыр</button>`;
  document.body.appendChild(tools);
  document.getElementById("openQuiz").onclick = () => { step1(); quiz.classList.add("show"); };
  document.getElementById("openCfg").onclick = () => cfg.classList.add("show");

  // 11. Сатылым хабарламалары (ДЕМО — нақты сайтта өшір!)
  const toast = document.createElement("div"); toast.className = "sale-toast"; document.body.appendChild(toast);
  const names = ["Ержан", "Айгерім", "Дәурен", "Динара", "Нұрлан", "Мадина"], cities = ["Алматы", "Астана", "Шымкент", "Қарағанды", "Ақтөбе"];
  setInterval(() => { if (document.querySelector(".cart-modal.show")) return;
    toast.innerHTML = `🛒 <b>${pickR(names)}</b> (${pickR(cities)}) сатып алды:<br><b>${esc(pickR(storeProducts).name)}</b><small>${1 + Math.floor(Math.random() * 15)} минут бұрын</small>`;
    toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 5000); }, 28000);
})();
