// ===== AR («үстеліңе қой») және өнім бетіндегі 3D (Google model-viewer) =====
(function () {
  const SRC = { laptop: "models/laptop.glb", pc: "models/pc.glb", monitor: "models/monitor.glb", keyboard: "models/keyboard.glb" };
  // нақты өлшемі (метр, ең үлкен жағы) — AR-да шынайы көлемде тұруы үшін
  // (GLB өлшемі: laptop 0.355 м, pc 4.57, monitor 1.23, keyboard 0.99 → масштаб)
  const SCALE = { laptop: 1, pc: .1029, monitor: .5034, keyboard: .4458 };
  const NAME = { laptop: "Ноутбук", pc: "Компьютер", monitor: "Монитор", keyboard: "Клавиатура" };
  let mvP = null;
  const loadMV = () => mvP || (mvP = new Promise((ok, no) => { if (customElements.get("model-viewer")) return ok();
    const s = document.createElement("script"); s.type = "module"; s.src = "lib/model-viewer.min.js"; s.onerror = () => no(new Error("model-viewer жүктелмеді"));
    document.head.appendChild(s); customElements.whenDefined("model-viewer").then(ok); }));

  function viewer(n, opts) {
    const mv = document.createElement("model-viewer");
    mv.setAttribute("src", window.modelFile ? modelFile(n) : SRC[n]); mv.setAttribute("alt", NAME[n] + " 3D моделі"); mv.setAttribute("camera-controls", ""); mv.setAttribute("auto-rotate", "");
    mv.setAttribute("shadow-intensity", "1"); mv.setAttribute("exposure", "1.05"); mv.setAttribute("environment-image", "neutral"); mv.setAttribute("touch-action", "pan-y");
    mv.setAttribute("ar", ""); mv.setAttribute("ar-modes", "webxr scene-viewer quick-look"); mv.setAttribute("ar-scale", "fixed"); mv.setAttribute("ar-placement", "floor");
    if (n === "monitor") mv.setAttribute("camera-orbit", "180deg 80deg auto");
    mv.innerHTML = `<button slot="ar-button" class="ar-go">📱 Бөлмеңде көру</button><div class="ar-prog" slot="progress-bar"><i></i></div>`;
    mv.addEventListener("progress", e => { const i = mv.querySelector(".ar-prog i"); if (i) { i.style.width = e.detail.totalProgress * 100 + "%"; i.parentNode.style.opacity = e.detail.totalProgress >= 1 ? 0 : 1; } });
    if (SCALE[n] !== 1) mv.setAttribute("scale", `${SCALE[n]} ${SCALE[n]} ${SCALE[n]}`);
    return mv;
  }

  // ---------- AR терезесі ----------
  const modal = document.createElement("div"); modal.className = "ar-modal"; modal.hidden = true;
  modal.innerHTML = `<div class="ar-box"><button class="ar-x" aria-label="Жабу">✕</button><h3>Үстеліңе қойып көр</h3>
    <p class="ar-sub">Телефонда «Бөлмеңде көру» батырмасын бас: құрылғы нақты өлшемде камерада пайда болады.</p>
    <div class="ar-tabs">${Object.keys(SRC).map(k => `<button data-m="${k}">${NAME[k]}</button>`).join("")}</div>
    <div class="ar-stage"></div>
    <div class="ar-qr" hidden><div><b>Компьютерден ашып отырсың</b><br>AR тек телефонда жұмыс істейді. Осы QR-ды телефонмен сканерле:</div><div class="ar-qrimg"></div></div></div>`;
  document.body.appendChild(modal);
  const stageEl = modal.querySelector(".ar-stage");
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  async function open(n) {
    n = SRC[n] ? n : "laptop"; modal.hidden = false; document.body.style.overflow = "hidden";
    modal.querySelectorAll(".ar-tabs button").forEach(b => b.classList.toggle("on", b.dataset.m === n));
    stageEl.innerHTML = '<div class="ar-load">3D жүктелуде...</div>';
    try { await loadMV(); } catch (e) { stageEl.innerHTML = '<div class="ar-load">AR кітапханасы жүктелмеді (lib/model-viewer.min.js)</div>'; return; }
    stageEl.innerHTML = ""; stageEl.appendChild(viewer(n));
    const qr = modal.querySelector(".ar-qr");
    if (!isMobile) { qr.hidden = false; const u = location.href.split("#")[0] + "#ar=" + n;
      const qi = qr.querySelector(".ar-qrimg"); qi.innerHTML = "";
      const mk = () => new QRCode(qi, { text: u, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M });
      if (window.QRCode) mk(); else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = mk; sc.onerror = () => qi.textContent = "QR үшін интернет керек"; document.head.appendChild(sc); }
    } else qr.hidden = true;
  }
  function close() { modal.hidden = true; document.body.style.overflow = ""; stageEl.innerHTML = ""; if (/^#ar=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); }
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".ar-x")) close(); const b = e.target.closest(".ar-tabs button"); if (b) open(b.dataset.m); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });
  const fromHash = () => { const m = location.hash.match(/^#ar=(\w+)/); if (m) open(m[1]); };
  addEventListener("hashchange", fromHash); fromHash();

  // ---------- Өнім бетіндегі 3D ----------
  function modelFor(name) {
    const p = (typeof storeProducts !== "undefined" && Array.isArray(storeProducts) ? storeProducts : []).find(x => x.name === name) || {}, s = (name + " " + (p.cat || "")).toLowerCase();
    if (/monitor|монитор/.test(s)) return "monitor"; if (/keyboard|клавиатур|пернетақта/.test(s)) return "keyboard";
    if (/\bpc\b|компьютер|desktop/.test(s)) return "pc"; if (/accessory/.test(s)) return null; return "laptop";
  }
  function enhance() {
    const box = document.getElementById("ppImg"); if (!box || box.dataset.v3) return; box.dataset.v3 = 1;
    const name = decodeURIComponent((location.hash.match(/^#product=(.+)$/) || [])[1] || ""), n = modelFor(name); if (!n) return;
    const sw = document.createElement("div"); sw.className = "pp-view";
    sw.innerHTML = `<button class="on" data-v="img">📷 Сурет</button><button data-v="3d">🧊 3D</button><button data-v="ar">📱 AR</button>`;
    const wrap = document.createElement("div"); wrap.className = "pp-media"; box.before(wrap); wrap.append(box, sw);
    const img = box.innerHTML;
    sw.addEventListener("click", async e => { const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.v === "ar") return open(n);
      sw.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      if (b.dataset.v === "img") { box.classList.remove("is3d"); box.innerHTML = img; return; }
      box.classList.add("is3d"); box.innerHTML = '<div class="ar-load">3D жүктелуде...</div>';
      try { await loadMV(); box.innerHTML = ""; box.appendChild(viewer(n)); } catch (er) { box.innerHTML = '<div class="ar-load">3D жүктелмеді</div>'; } });
    const note = document.createElement("small"); note.className = "pp-3dnote"; note.textContent = "3D модель — осы санаттағы құрылғының үлгісі."; sw.appendChild(note);
  }
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  window.ASUS_AR = { open, close, modelFor };
})();
