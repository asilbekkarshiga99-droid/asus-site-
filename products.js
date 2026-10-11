const defaultProducts = [
 {name:"ROG Strix G16",cat:"gaming",type:"ROG SERIES",badge:"GAMING",price:849990,old:999990,desc:"Қуатты gaming ноутбук. Ойындар мен ауыр бағдарламаларға арналған.",specs:["Intel Core i9","RTX 4070","16 GB DDR5","1 TB SSD","16″ 240 Hz"],img:"hero-laptop.png"},
 {name:"Zenbook 14",cat:"laptop",type:"ZENBOOK",badge:"PREMIUM",price:699990,desc:"Жұқа әрі жеңіл ноутбук. Оқу және жұмысқа арналған.",specs:["Core Ultra 7","16 GB RAM","1 TB SSD","14″ OLED","1.2 кг"],img:"zenbook.png"},
 {name:"TUF Gaming A15",cat:"gaming",type:"TUF GAMING",badge:"GAMING",price:579990,old:649990,desc:"Берік корпусы бар gaming ноутбук.",specs:["Ryzen 7","RTX 4060","16 GB RAM","512 GB SSD","15.6″ 144 Hz"],img:"tuf-Photoroom.png"},
 {name:"Vivobook 15",cat:"laptop",type:"VIVOBOOK",badge:"EVERYDAY",price:429990,stock:0,desc:"Күнделікті тапсырмаларға арналған әмбебап ноутбук.",specs:["Core i5","8 GB RAM","512 GB SSD","15.6″ Full HD"],img:"vivobook2-Photoroom.png"},
 {name:"ROG Gaming PC",cat:"pc",type:"GAMING PC",badge:"PC",price:999990,desc:"Desktop компьютер. Максималды gaming performance.",specs:["Core i9","RTX 4080","32 GB RAM","2 TB SSD","RGB корпус"],img:"pc-Photoroom.png"},
 {name:"ASUS Gaming Monitor",cat:"accessory",type:"MONITOR",badge:"DISPLAY",price:249990,desc:"Gaming үшін жоғары жаңарту жиілігі бар монитор.",specs:["27″ QHD","165 Hz","1 ms","IPS панель"],img:"monitor-Photoroom.png"},
 {name:"ASUS Gaming Keyboard",cat:"accessory",type:"KEYBOARD",badge:"ACCESSORY",price:49990,old:59990,desc:"RGB жарығы бар gaming клавиатура.",specs:["RGB жарық","Механикалық","USB-C","Макро пернелер"],img:"keyboard.png"}
];
let storeProducts = null;
try { storeProducts = JSON.parse(localStorage.getItem("asusProducts")); } catch (e) {}
if (!Array.isArray(storeProducts) || !storeProducts.length) storeProducts = defaultProducts;

// Сақталған (localStorage) өнімдерде сурет жоқ болса, атауы бойынша автоматты қойылады
const IMG_MAP = {"ROG Strix G16": "hero-laptop.png", "Zenbook 14": "zenbook.png", "TUF Gaming A15": "tuf-Photoroom.png", "Vivobook 15": "vivobook2-Photoroom.png", "ROG Gaming PC": "pc-Photoroom.png", "ASUS Gaming Monitor": "monitor-Photoroom.png", "ASUS Gaming Keyboard": "keyboard.png"};
storeProducts.forEach(p => { if (!p.img && IMG_MAP[p.name]) p.img = IMG_MAP[p.name]; });

const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const colors = {gaming:"gaming", laptop:"silver", pc:"yellow", accessory:"blue"};
const specs = {};
storeProducts.forEach(p => specs[p.name] = p.specs || []);

function productCard(p) {
  const pic = p.img
    ? `<img loading="lazy" src="${esc(p.img)}" alt="${esc(p.name)}">`
    : `<div class="fallback-product ${colors[p.cat] || "gaming"}"><div>${esc(p.name.split(" ")[0])}</div></div>`;
  return `<article class="product" data-category="${esc(p.cat)}" data-name="${esc(p.name)}" data-price="${Number(p.price)}">
    <div class="product-image">${pic}<span class="product-badge">${p.old ? "−" + Math.round((1 - p.price / p.old) * 100) + "%" : esc(p.badge || "ASUS")}</span></div>
    <div class="product-content"><span class="product-type">${esc(p.type || "ASUS")}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
    <div class="product-bottom"><strong>${p.old ? `<s class="old-price">${Number(p.old).toLocaleString("kk-KZ")} ₸</s>` : ""}${Number(p.price).toLocaleString("kk-KZ")} ₸</strong>
    <button class="add-cart" data-name="${esc(p.name)}" data-price="${Number(p.price)}" ${p.stock === 0 ? "disabled" : ""}>${p.stock === 0 ? "Таусылды" : "Себетке"}</button></div></div></article>`;
}
document.getElementById("productsGrid").innerHTML = storeProducts.map(productCard).join("");

// ---- Админ панель (деректер осы браузерде localStorage-та сақталады) ----
const adminModal = document.createElement("div");
adminModal.className = "cart-modal";
adminModal.innerHTML = `<div class="cart-window quick-window">
  <div class="cart-header"><div><span>ADMIN</span><h2>Өнімдерді басқару</h2></div><button id="closeAdmin">×</button></div>
  <form id="adminForm" class="checkout-form show">
    <input name="name" placeholder="Атауы" required>
    <select name="cat" class="sort-select"><option value="laptop">Ноутбук</option><option value="gaming">Gaming</option><option value="pc">Компьютер</option><option value="accessory">Аксессуар</option></select>
    <input name="price" type="number" min="1" placeholder="Бағасы (₸)" required>
    <input name="desc" placeholder="Сипаттамасы" required>
    <input name="old" type="number" min="1" placeholder="Ескі баға (жеңілдік болса)">
    <input name="img" placeholder="Сурет файлы немесе URL (міндетті емес)">
    <button class="main-button" type="submit">+ Өнім қосу</button>
  </form>
  <div id="adminList"></div>
  <button class="remove-product" id="adminReset" style="margin-top:15px">Бастапқы өнімдерге қайтару</button>
</div>`;
document.body.appendChild(adminModal);
const saveProducts = () => { try { localStorage.setItem("asusProducts", JSON.stringify(storeProducts)); } catch (e) {} location.reload(); };
const renderAdminList = () => {
  document.getElementById("adminList").innerHTML = storeProducts.map((p, i) =>
    `<div class="cart-item"><div><strong>${esc(p.name)}</strong><span>${Number(p.price).toLocaleString("kk-KZ")} ₸</span></div><button class="remove-product" data-i="${i}">Өшіру</button></div>`).join("");
};
renderAdminList();
document.getElementById("adminList").addEventListener("click", e => {
  const i = e.target.dataset.i;
  if (i !== undefined) { storeProducts.splice(Number(i), 1); saveProducts(); }
});
document.getElementById("adminForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target.elements;
  const labels = {laptop:"LAPTOP", gaming:"GAMING", pc:"PC", accessory:"ACCESSORY"};
  storeProducts.push({name:f.name.value.trim(), cat:f.cat.value, type:labels[f.cat.value], badge:labels[f.cat.value], price:Number(f.price.value), old:Number(f.old.value) || undefined, desc:f.desc.value.trim(), specs:[], img:f.img.value.trim()});
  saveProducts();
});
document.getElementById("adminReset").addEventListener("click", () => { try { localStorage.removeItem("asusProducts"); } catch (e) {} location.reload(); });
document.getElementById("closeAdmin").addEventListener("click", () => adminModal.classList.remove("show"));
adminModal.addEventListener("click", e => { if (e.target === adminModal) adminModal.classList.remove("show"); });
const adminLink = document.createElement("a");
adminLink.href = "#"; adminLink.textContent = "Admin";
adminLink.addEventListener("click", e => { e.preventDefault(); adminModal.classList.add("show"); });
document.querySelector(".footer-links").appendChild(adminLink);
