let cart = [];
const PROMOS = { ASUS10: 10, NEWYEAR: 15 };
const FREE_SHIP = 300000;
let promoCode = "", promoPercent = 0;
try { promoCode = localStorage.getItem("asusPromo") || ""; promoPercent = PROMOS[promoCode] || 0; } catch (e) {}
try { cart = JSON.parse(localStorage.getItem("asusCart")) || []; } catch (e) { cart = []; }
const openCart =
    document.getElementById("openCart");
const closeCart =
    document.getElementById("closeCart");
const cartModal =
    document.getElementById("cartModal");
const cartItems =
    document.getElementById("cartItems");
const cartCount =
    document.getElementById("cartCount");
const cartTotal =
    document.getElementById("cartTotal");

openCart.addEventListener("click", () => {
    cartModal.classList.add("show");
    updateCart();
});

closeCart.addEventListener("click", () => {
    cartModal.classList.remove("show");
});

cartModal.addEventListener("click", (event) => {
    if (event.target === cartModal) {
        cartModal.classList.remove("show");
    }
});

const addButtons =
    document.querySelectorAll(".add-cart");
addButtons.forEach(button => {
    button.addEventListener("click", () => {
        const name =
            button.dataset.name;
        const price =
            Number(button.dataset.price);
        const existing =
            cart.find(item =>
                item.name === name
            );
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                name: name,
                price: price,
                quantity: 1
            });
        }
        updateCart();
        showNotification(
            name + " себетке қосылды ✓"
        );
    });
});

function updateCart() {
    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="
                padding:40px 0;
                text-align:center;
                color:#888;
            ">
                Себет әзірге бос
            </div>
        `;
    }
    cart.forEach((item, index) => {
        total +=
            item.price * item.quantity;
        count +=
            item.quantity;
        const element =
            document.createElement("div");
        element.className =
            "cart-item";
        element.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <span>${formatPrice(item.price)} × ${item.quantity}</span>
            </div>
            <div class="qty">
                <button onclick="changeQty(${index},-1)">−</button>
                <b>${item.quantity}</b>
                <button onclick="changeQty(${index},1)">+</button>
                <button class="remove-product" onclick="removeProduct(${index})">Өшіру</button>
            </div>
        `;
        cartItems.appendChild(element);
    });
    cartCount.textContent =
        count;
    const disc = Math.round(total * promoPercent / 100);
    const net = total - disc;
    document.getElementById("cartDiscount").textContent = disc ? "Жеңілдік (" + promoCode + "): −" + formatPrice(disc) : "";
    cartTotal.textContent = formatPrice(net);
    const left = FREE_SHIP - net;
    document.getElementById("shipText").textContent = net === 0 ? "" : left > 0 ? "Тегін жеткізуге дейін: " + formatPrice(left) : "🚚 Жеткізу тегін!";
    document.getElementById("shipFill").style.width = Math.min(100, net / FREE_SHIP * 100) + "%";
    try { localStorage.setItem("asusCart", JSON.stringify(cart)); } catch (e) {}
}

function removeProduct(index) {
    cart.splice(index, 1);
    updateCart();
    showNotification(
        "Өнім себеттен өшірілді"
    );
}

function formatPrice(price) {
    return price
        .toLocaleString("kk-KZ")
        + " ₸";
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCart();
}

const checkoutButton = document.getElementById("checkoutButton");
const checkoutForm = document.getElementById("checkoutForm");

checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
        showNotification("Себет бос!");
        return;
    }
    checkoutForm.classList.toggle("show");
});

checkoutForm.addEventListener("submit", event => {
    event.preventDefault();
    const items = cart.map(i => ({ ...i }));
    const total = cartSum();
    const pay = checkoutForm.querySelector("[name=pay]").value + ", " + checkoutForm.querySelector("[name=city]").value;
    const orderId = "ASUS-" + Math.floor(100000 + Math.random() * 900000);
    saveOrder({ id: orderId, date: Date.now(), items, total, pay });
    cart = [];
    updateCart();
    checkoutForm.reset();
    checkoutForm.classList.remove("show");
    cartModal.classList.remove("show");
    showNotification("Тапсырыс " + orderId + " қабылданды ✓ " + formatPrice(total) + " (" + pay + ")");
});

// ---- Іздеу + категория + сұрыптау (бірге жұмыс істейді) ----
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const noResults = document.getElementById("noResults");
const grid = document.getElementById("productsGrid");
const categoryButtons = document.querySelectorAll(".category");
const productList = [...document.querySelectorAll(".product")];
productList.forEach((p, i) => p.dataset.index = i);
let activeCategory = "all";
let maxPrice = Infinity;
let wishlist = [];
try { wishlist = JSON.parse(localStorage.getItem("asusWish")) || []; } catch (e) { wishlist = []; }

function applyFilters() {
    const q = searchInput.value.toLowerCase().trim();
    const mode = sortSelect.value;
    const visible = productList.filter(p =>
        (activeCategory === "all" || (activeCategory === "wish" ? wishlist.includes(p.dataset.name) : p.dataset.category === activeCategory)) &&
        p.dataset.name.toLowerCase().includes(q) &&
        Number(p.dataset.price) <= maxPrice &&
        (!window.extraFilter || window.extraFilter(p))
    );
    productList.forEach(p => p.style.display = "none");
    visible.sort((x, y) =>
        mode === "asc" ? x.dataset.price - y.dataset.price :
        mode === "desc" ? y.dataset.price - x.dataset.price :
        x.dataset.index - y.dataset.index
    ).forEach(p => {
        p.style.display = "block";
        grid.appendChild(p);
    });
    noResults.hidden = visible.length > 0;
    if (window.onFiltered) window.onFiltered(visible.length);
}

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(i => i.classList.remove("active"));
        button.classList.add("active");
        activeCategory = button.dataset.category;
        applyFilters();
    });
});

const themeButton =
    document.getElementById(
        "themeButton"
    );

themeButton.addEventListener(
    "click",
    () => {
        document.body.classList.toggle(
            "dark"
        );
        if (
            document.body.classList.contains(
                "dark"
            )
        ) {
            themeButton.textContent =
                "☾";
        } else {
            themeButton.textContent =
                "☼";
        }
    }
);

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );

const navigation =
    document.querySelector(
        ".navigation"
    );

mobileMenu.addEventListener(
    "click",
    () => {
        navigation.classList.toggle(
            "open"
        );
    }
);

navigation.querySelectorAll("a")
    .forEach(link => {
        link.addEventListener(
            "click",
            () => {
                navigation.classList.remove(
                    "open"
                );
            }
        );
    });

const contactForm =
    document.getElementById(
        "contactForm"
    );

contactForm.addEventListener(
    "submit",
    event => {
        event.preventDefault();
        showNotification(
            "Хабарлама сәтті жіберілді ✓"
        );
        contactForm.reset();
    }
);

function showNotification(message) {
    const notification =
        document.getElementById(
            "notification"
        );
    notification.textContent =
        message;
    notification.classList.add(
        "show"
    );
    setTimeout(() => {
        notification.classList.remove(
            "show"
        );
    }, 2500);
}

const products =
    document.querySelectorAll(
        ".product"
    );
const observer =
    new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (
                    entry.isIntersecting
                ) {
                    entry.target.style.opacity =
                        "1";
                    entry.target.style.transform =
                        "translateY(0)";
                }
            });
        },
        {
            threshold: .1
        }
    );

products.forEach(product => {
    product.style.opacity = "0";
    product.style.transform =
        "translateY(30px)";
    product.style.transition =
        "opacity .6s ease, transform .6s ease";
    observer.observe(product);
});

// ---- Санауыш анимациясы ----
const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        (function tick(now) {
            const t = Math.min((now - start) / 1500, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString("kk-KZ") + suffix;
            if (t < 1) requestAnimationFrame(tick);
        })(start);
        statObserver.unobserve(el);
    });
}, { threshold: .5 });
document.querySelectorAll(".stat strong").forEach(el => statObserver.observe(el));

// ---- Header көлеңкесі және "жоғары" батырмасы ----
const toTop = document.getElementById("toTop");
window.addEventListener("scroll", () => {
    document.querySelector(".header").classList.toggle("scrolled", window.scrollY > 20);
    toTop.classList.toggle("show", window.scrollY > 600);
});
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

updateCart();



// ---- Таңдаулы (♥) және жылдам қарау ----
const quickModal = document.getElementById("quickModal");
let quickProduct = null;

function openQuick(product) {
    quickProduct = product;
    document.getElementById("qvType").textContent = product.querySelector(".product-type").textContent.trim();
    document.getElementById("qvName").textContent = product.dataset.name;
    document.getElementById("qvDesc").textContent = product.querySelector(".product-content p").textContent.replace(/\s+/g, " ").trim();
    document.getElementById("qvPrice").textContent = formatPrice(Number(product.dataset.price));
    document.getElementById("qvSpecs").innerHTML = (specs[product.dataset.name] || []).map(s => "<li>" + s + "</li>").join("");
    quickModal.classList.add("show");
    document.getElementById("qvInstall").textContent = "Айына " + formatPrice(Math.round(product.dataset.price / 12)) + "-дан · 12 айға бөліп төлеу";
    trackViewed(product.dataset.name);
}

productList.forEach(product => {
    const box = product.querySelector(".product-image");
    const name = product.dataset.name;

    const wish = document.createElement("button");
    wish.className = "wish";
    wish.setAttribute("aria-label", "Таңдаулыға қосу");
    const paint = () => {
        const on = wishlist.includes(name);
        wish.textContent = on ? "♥" : "♡";
        wish.classList.toggle("on", on);
    };
    paint();
    wish.addEventListener("click", e => {
        e.stopPropagation();
        if (wishlist.includes(name)) {
            wishlist = wishlist.filter(n => n !== name);
            showNotification("Таңдаулыдан өшірілді");
        } else {
            wishlist.push(name);
            showNotification(name + " таңдаулыға қосылды ♥");
        }
        try { localStorage.setItem("asusWish", JSON.stringify(wishlist)); } catch (err) {}
        paint();
        if (activeCategory === "wish") applyFilters();
    });
    box.appendChild(wish);

    const view = document.createElement("button");
    view.className = "view-btn";
    view.textContent = "Жылдам қарау";
    view.addEventListener("click", () => openQuick(product));
    box.appendChild(view);

    product.querySelector("h3").style.cursor = "pointer";
    product.querySelector("h3").addEventListener("click", () => openQuick(product));
});

document.getElementById("closeQuick").addEventListener("click", () => quickModal.classList.remove("show"));
quickModal.addEventListener("click", e => { if (e.target === quickModal) quickModal.classList.remove("show"); });
document.getElementById("qvAdd").addEventListener("click", () => {
    quickProduct.querySelector(".add-cart").click();
    quickModal.classList.remove("show");
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        quickModal.classList.remove("show");
        cartModal.classList.remove("show");
    }
});


// ---- Жақында қаралған ----
let viewed = [];
try { viewed = JSON.parse(localStorage.getItem("asusViewed")) || []; } catch (e) { viewed = []; }
function trackViewed(name) {
    viewed = [name, ...viewed.filter(n => n !== name)].slice(0, 5);
    try { localStorage.setItem("asusViewed", JSON.stringify(viewed)); } catch (e) {}
    renderRecent();
}
function renderRecent() {
    const list = document.getElementById("recentList");
    list.innerHTML = "";
    viewed.forEach(n => {
        const p = productList.find(x => x.dataset.name === n);
        if (!p) return;
        const b = document.createElement("button");
        b.className = "chip";
        b.textContent = n;
        b.addEventListener("click", () => openQuick(p));
        list.appendChild(b);
    });
    document.getElementById("recent").hidden = list.children.length === 0;
}
renderRecent();

// ---- Акция таймері ----
let deadline = 0;
try { deadline = Number(localStorage.getItem("asusDeadline")); } catch (e) {}
if (!deadline || deadline < Date.now()) {
    deadline = Date.now() + 3 * 86400000;
    try { localStorage.setItem("asusDeadline", deadline); } catch (e) {}
}
const countdownEl = document.getElementById("countdown");
const pad = n => String(n).padStart(2, "0");
function tickCountdown() {
    let s = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    countdownEl.textContent = d + "д " + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60);
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ---- Жүктелу экраны ----
window.addEventListener("load", () => setTimeout(() => document.getElementById("preloader").classList.add("hide"), 600));
