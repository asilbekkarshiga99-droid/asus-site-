// ---- Промокод ----
const promoInput = document.getElementById("promoInput");
if (promoCode) promoInput.value = promoCode;
document.getElementById("promoApply").addEventListener("click", () => {
  const code = promoInput.value.trim().toUpperCase();
  if (PROMOS[code]) { promoCode = code; promoPercent = PROMOS[code]; showNotification("Промокод қолданылды: −" + promoPercent + "%"); }
  else { promoCode = ""; promoPercent = 0; showNotification("Промокод жарамсыз"); }
  try { promoCode ? localStorage.setItem("asusPromo", promoCode) : localStorage.removeItem("asusPromo"); } catch (e) {}
  updateCart();
});
function cartSum() {
  const t = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return t - Math.round(t * promoPercent / 100);
}

// ---- Іздеу ұсыныстары және баға слайдері ----
const dl = document.createElement("datalist");
dl.id = "productNames";
dl.innerHTML = storeProducts.map(p => `<option value="${esc(p.name)}">`).join("");
document.body.appendChild(dl);
searchInput.setAttribute("list", "productNames");
const topPrice = Math.max(...storeProducts.map(p => Number(p.price)));
const range = document.createElement("label");
range.className = "price-range";
range.innerHTML = `<span id="rangeText">Бәрі</span><input type="range" id="priceRange" min="0" max="${topPrice}" step="10000" value="${topPrice}">`;
sortSelect.after(range);
document.getElementById("priceRange").addEventListener("input", e => {
  const v = Number(e.target.value);
  maxPrice = v >= topPrice ? Infinity : v;
  document.getElementById("rangeText").textContent = v >= topPrice ? "Бәрі" : "≤ " + formatPrice(v);
  applyFilters();
});

// ---- Салыстыру ----
let compare = [];
const compareBar = document.getElementById("compareBar");
const cmpModal = document.createElement("div");
cmpModal.className = "cart-modal";
cmpModal.innerHTML = `<div class="cart-window quick-window cmp-window"><div class="cart-header"><div><span>COMPARE</span><h2>Салыстыру</h2></div><button id="closeCmp">×</button></div><div id="cmpBody"></div></div>`;
document.body.appendChild(cmpModal);
function renderCompareBar() {
  compareBar.hidden = compare.length === 0;
  document.getElementById("compareCount").textContent = "Салыстыру: " + compare.length + "/3";
}
productList.forEach(p => {
  const b = document.createElement("button");
  b.className = "cmp"; b.textContent = "⇄"; b.title = "Салыстыру";
  b.addEventListener("click", () => {
    const n = p.dataset.name;
    if (compare.includes(n)) compare = compare.filter(x => x !== n);
    else if (compare.length < 3) compare.push(n);
    else return showNotification("Ең көбі 3 өнім");
    b.classList.toggle("on", compare.includes(n));
    renderCompareBar();
  });
  p.querySelector(".product-image").appendChild(b);
});
document.getElementById("compareClear").addEventListener("click", () => {
  compare = []; document.querySelectorAll(".cmp").forEach(b => b.classList.remove("on")); renderCompareBar();
});
document.getElementById("compareOpen").addEventListener("click", () => {
  if (compare.length < 2) return showNotification("Кемінде 2 өнім таңда");
  const items = compare.map(n => storeProducts.find(p => p.name === n)).filter(Boolean);
  document.getElementById("cmpBody").innerHTML = `<div class="cmp-grid" style="grid-template-columns:repeat(${items.length},1fr)">` +
    items.map(p => `<div><h4>${esc(p.name)}</h4><strong>${formatPrice(Number(p.price))}</strong><ul class="specs">${(p.specs || []).map(s => "<li>" + esc(s) + "</li>").join("")}</ul></div>`).join("") + "</div>";
  cmpModal.classList.add("show");
});
document.getElementById("closeCmp").addEventListener("click", () => cmpModal.classList.remove("show"));
cmpModal.addEventListener("click", e => { if (e.target === cmpModal) cmpModal.classList.remove("show"); });

// ---- Тапсырыс тарихы және бақылау (демо: мәртебе уақытқа қарай өзгереді) ----
function loadOrders() { try { return JSON.parse(localStorage.getItem("asusOrders")) || []; } catch (e) { return []; } }
function saveOrder(o) {
  const l = loadOrders(); l.unshift(o);
  try { localStorage.setItem("asusOrders", JSON.stringify(l.slice(0, 20))); } catch (e) {}
}
const STEPS = ["Қабылданды", "Жиналуда", "Жолда", "Жеткізілді"];
const ordersModal = document.createElement("div");
ordersModal.className = "cart-modal";
ordersModal.innerHTML = `<div class="cart-window quick-window"><div class="cart-header"><div><span>ORDERS</span><h2>Тапсырыстарым</h2></div><button id="closeOrders">×</button></div><input id="orderSearch" class="order-search" placeholder="Тапсырыс нөмірі: ASUS-123456"><div id="orderList"></div></div>`;
document.body.appendChild(ordersModal);
function renderOrders() {
  const q = document.getElementById("orderSearch").value.trim().toUpperCase();
  const list = loadOrders().filter(o => o.id.includes(q));
  document.getElementById("orderList").innerHTML = list.length ? list.map(o => {
    const m = (Date.now() - o.date) / 60000, step = m < 1 ? 0 : m < 3 ? 1 : m < 6 ? 2 : 3;
    return `<div class="order"><div class="order-top"><strong>${esc(o.id)}</strong><span>${formatPrice(o.total)}</span></div>
      <p>${o.items.map(i => esc(i.name) + " × " + i.quantity).join(", ")}</p>
      <div class="steps">${STEPS.map((s, i) => `<span class="${i <= step ? "on" : ""}">${s}</span>`).join("")}</div></div>`;
  }).join("") : '<p class="no-results">Тапсырыс табылмады</p>';
}
document.getElementById("openOrders").addEventListener("click", () => { renderOrders(); ordersModal.classList.add("show"); });
document.getElementById("orderSearch").addEventListener("input", renderOrders);
document.getElementById("closeOrders").addEventListener("click", () => ordersModal.classList.remove("show"));
ordersModal.addEventListener("click", e => { if (e.target === ordersModal) ordersModal.classList.remove("show"); });

// ---- Жүйе қараңғы режимін қолдану ----
if (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) themeButton.click();
