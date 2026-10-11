// [селектор, орысша, ағылшынша, барлық сәйкестіктер ме?, атрибут]
const I18N_ITEMS = [
 ['.promo-bar span',"🔥 Новогодняя акция −15% — до конца:","🔥 New Year sale −15% — ends in:"],
 ['.navigation a:nth-child(1)',"Главная","Home"],
 ['.navigation a:nth-child(2)',"Товары","Products"],
 ['.navigation a:nth-child(3)',"Компания","Company"],
 ['.navigation a:nth-child(4)',"Вопросы","FAQ"],
 ['.navigation a:nth-child(5)',"Контакты","Contact"],
 ['.hero-text > p',"Современные ноутбуки, компьютеры и аксессуары. Поднимите производительность на новый уровень.","Modern laptops, computers and accessories. Take your performance to the next level."],
 ['.hero-buttons .outline-button',"Подробнее","Learn more"],
 ['.section-heading > p',"Наш специальный каталог устройств ASUS.","Our special catalog of ASUS devices."],
 ['#searchInput',"Поиск товара...","Search products...",false,"placeholder"],
 ['#sortSelect option:nth-child(1)',"Сортировка: по умолчанию","Sort: default"],
 ['#sortSelect option:nth-child(2)',"Цена: по возрастанию","Price: low to high"],
 ['#sortSelect option:nth-child(3)',"Цена: по убыванию","Price: high to low"],
 ['.category[data-category="all"]',"Все","All"],
 ['.category[data-category="laptop"]',"Ноутбуки","Laptops"],
 ['.category[data-category="pc"]',"Компьютеры","Computers"],
 ['.category[data-category="accessory"]',"Аксессуары","Accessories"],
 ['.category[data-category="wish"]',"♥ Избранное","♥ Wishlist"],
 ['.add-cart:not([disabled])',"В корзину","Add to cart",true],
 ['.view-btn',"Быстрый просмотр","Quick view",true],
 ['.cart-header h2',"Корзина","Cart"],
 ['#checkoutButton',"Оформить заказ →","Checkout →"]
];
const i18nNodes = I18N_ITEMS.map(it => ({it, els: [...(it[3] ? document.querySelectorAll(it[0]) : [document.querySelector(it[0])])].filter(Boolean)}));
i18nNodes.forEach(n => n.els.forEach(el => el.dataset.kk = n.it[4] ? el.getAttribute(n.it[4]) : el.textContent.trim()));

function setLang(lang) {
  i18nNodes.forEach(n => n.els.forEach(el => {
    const text = lang === "ru" ? n.it[1] : lang === "en" ? n.it[2] : el.dataset.kk;
    if (n.it[4]) el.setAttribute(n.it[4], text); else el.textContent = text;
  }));
  document.documentElement.lang = lang === "kk" ? "kk" : lang;
  try { localStorage.setItem("asusLang", lang); } catch (e) {}
}
const langSelect = document.getElementById("langSelect");
let savedLang = "kk";
try { savedLang = localStorage.getItem("asusLang") || "kk"; } catch (e) {}
langSelect.value = savedLang;
if (savedLang !== "kk") setLang(savedLang);
langSelect.addEventListener("change", () => setLang(langSelect.value));

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
