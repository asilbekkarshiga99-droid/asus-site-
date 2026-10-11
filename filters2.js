// ===== Кеңейтілген сүзгі: баға, экран, процессор, видеокарта, жад, қоймада бар =====
(function () {
  const tools = document.querySelector(".catalog-tools"); if (!tools || typeof applyFilters !== "function") return;
  const all = () => (typeof storeProducts !== "undefined" && Array.isArray(storeProducts) ? storeProducts : []);
  const sp = p => (p.specs || []).join(" ");
  // өнімнен сипаттамаларды алу
  const ATTR = {
    screen: p => { const m = sp(p).match(/(\d+(?:\.\d+)?)\s*″/); if (!m) return null; const v = +m[1]; return v <= 14 ? "≤ 14″" : v <= 16 ? "15–16″" : v <= 18 ? "17–18″" : "Монитор 24″+"; },
    cpu: p => /ryzen|amd/i.test(sp(p)) ? "AMD Ryzen" : /intel|core/i.test(sp(p)) ? "Intel" : null,
    gpu: p => { const m = sp(p).match(/RTX\s?(\d{4})/i); return m ? "RTX " + m[1] : (p.cat === "laptop" ? "Кіріктірілген" : null); },
    ram: p => { const m = sp(p).match(/(\d+)\s?GB\s?(RAM|DDR\d?)/i); return m ? m[1] + " GB" : null; }
  };
  const GROUPS = [["screen", "Экран"], ["cpu", "Процессор"], ["gpu", "Видеокарта"], ["ram", "Жедел жад"]];
  const sel = { screen: new Set(), cpu: new Set(), gpu: new Set(), ram: new Set() };
  let minP = 0, maxP = Infinity, inStock = false, sale = false;

  const btn = document.createElement("button"); btn.type = "button"; btn.className = "f2-toggle"; btn.innerHTML = '⚙ Сүзгі <b class="f2-n" hidden></b>';
  tools.querySelector("#sortSelect").after(btn);
  const panel = document.createElement("div"); panel.className = "f2-panel"; panel.hidden = true; tools.after(panel);
  const order = { "≤ 14″": 0, "15–16″": 1, "17–18″": 2, "Монитор 24″+": 3 };
  function build() {
    const ps = all(), prices = ps.map(p => p.price);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    panel.innerHTML = `<div class="f2-grid">
      <div class="f2-g"><h4>Баға, ₸</h4><div class="f2-price"><input type="number" id="f2min" placeholder="${lo.toLocaleString("ru")}" min="0" step="10000"><span>—</span><input type="number" id="f2max" placeholder="${hi.toLocaleString("ru")}" min="0" step="10000"></div>
        <div class="f2-quick">${[[0, 300000, "300 мың-ға дейін"], [300000, 700000, "300–700 мың"], [700000, 0, "700 мың+"]].map(([a, b, t]) => `<button type="button" data-a="${a}" data-b="${b}">${t}</button>`).join("")}</div></div>
      ${GROUPS.map(([k, t]) => { const vals = [...new Set(ps.map(ATTR[k]).filter(Boolean))].sort((a, b) => k === "screen" ? order[a] - order[b] : parseFloat(a.replace(/\D+/g, "")) - parseFloat(b.replace(/\D+/g, "")) || a.localeCompare(b));
        return vals.length ? `<div class="f2-g"><h4>${t}</h4><div class="f2-chips" data-k="${k}">${vals.map(v => `<button type="button" data-v="${v}" class="${sel[k].has(v) ? "on" : ""}">${v}</button>`).join("")}</div></div>` : ""; }).join("")}
      <div class="f2-g"><h4>Басқа</h4><label class="f2-chk"><input type="checkbox" id="f2stock"> Тек қоймада барлары</label><label class="f2-chk"><input type="checkbox" id="f2sale"> Тек жеңілдіктегілер</label></div>
    </div><div class="f2-foot"><span class="f2-count"></span><button type="button" class="f2-reset">Тазалау</button></div>`;
  }
  build();
  const active = () => [...Object.values(sel)].reduce((a, s) => a + s.size, 0) + (minP > 0) + (maxP < Infinity) + inStock + sale;
  const run = () => { const n = active(), b = btn.querySelector(".f2-n"); b.hidden = !n; b.textContent = n; btn.classList.toggle("on", n > 0); applyFilters(); };

  window.extraFilter = card => {
    const p = all().find(x => x.name === card.dataset.name); if (!p) return true;
    if (p.price < minP || p.price > maxP) return false;
    if (inStock && p.stock === 0) return false;
    if (sale && !(p.old > p.price)) return false;
    for (const k in sel) if (sel[k].size && !sel[k].has(ATTR[k](p))) return false;
    return true;
  };
  window.onFiltered = n => { const c = panel.querySelector(".f2-count"); if (c) c.textContent = n + " өнім табылды"; };

  btn.addEventListener("click", () => { panel.hidden = !panel.hidden; btn.classList.toggle("open", !panel.hidden); });
  panel.addEventListener("click", e => {
    const chip = e.target.closest(".f2-chips button");
    if (chip) { const k = chip.parentNode.dataset.k, v = chip.dataset.v; sel[k].has(v) ? sel[k].delete(v) : sel[k].add(v); chip.classList.toggle("on"); return run(); }
    const q = e.target.closest(".f2-quick button");
    if (q) { const a = +q.dataset.a, b = +q.dataset.b; panel.querySelector("#f2min").value = a || ""; panel.querySelector("#f2max").value = b || ""; minP = a; maxP = b || Infinity;
      panel.querySelectorAll(".f2-quick button").forEach(x => x.classList.toggle("on", x === q)); return run(); }
    if (e.target.closest(".f2-reset")) { Object.values(sel).forEach(s => s.clear()); minP = 0; maxP = Infinity; inStock = sale = false; build(); run(); }
  });
  panel.addEventListener("input", e => {
    if (e.target.id === "f2min") minP = +e.target.value || 0;
    if (e.target.id === "f2max") maxP = +e.target.value || Infinity;
    if (e.target.id === "f2stock") inStock = e.target.checked;
    if (e.target.id === "f2sale") sale = e.target.checked;
    if (/f2m/.test(e.target.id)) panel.querySelectorAll(".f2-quick button").forEach(x => x.classList.remove("on"));
    run();
  });
  applyFilters();
})();
