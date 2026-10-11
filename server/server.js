// ===== ASUS дүкені — сервер (тек Node.js, сыртқы кітапханасыз) =====
// Іске қосу:  node server/server.js   (Node 18+)
// Баптаулар .env файлында (README-ді қара).
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");

const ROOT = path.resolve(__dirname, ".."), DATA_DIR = path.join(__dirname, "data"), DB_FILE = path.join(DATA_DIR, "db.json");

// ---------- .env оқу ----------
(function loadEnv() { const f = path.join(ROOT, ".env"); if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } })();
const ENV = {
  PORT: +process.env.PORT || 3000,
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "").toLowerCase().trim(),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  ANTHROPIC_BASE_URL: (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, ""),
  AI_MODEL: process.env.AI_MODEL || "claude-haiku-5-5",
  KASPI_PHONE: process.env.KASPI_PHONE || "",
  KASPI_NAME: process.env.KASPI_NAME || "",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "1",
  SITE_URL: (process.env.SITE_URL || "").replace(/\/$/, "")
};

// ---------- Өнімдер мен промокодтар (сайттың өз файлдарынан) ----------
function loadCatalog() {
  const src = fs.readFileSync(path.join(ROOT, "products.js"), "utf8"), mm = src.match(/const defaultProducts\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!mm) throw new Error("products.js ішінде defaultProducts табылмады");
  const list = vm.runInNewContext("(" + mm[1] + ")", {}, { timeout: 1000 });
  const products = list.map(p => ({ name: p.name, cat: p.cat, price: p.price, old: p.old || null, stock: p.stock, specs: p.specs || [], desc: p.desc || "" }));
  const m = fs.readFileSync(path.join(ROOT, "script.js"), "utf8").match(/const PROMOS\s*=\s*(\{[^}]*\})/);
  let promos = {}; try { promos = m ? vm.runInNewContext("(" + m[1] + ")") : {}; } catch (e) {}
  return { products, promos };
}
let CATALOG = loadCatalog();

// ---------- Дерекқор (JSON файл) ----------
const EMPTY = { users: [], sessions: {}, orders: [], reviews: [], subscribers: [], notify: [], messages: [], visits: {}, views: {}, uniq: {} };
let db = EMPTY;
try { fs.mkdirSync(DATA_DIR, { recursive: true }); if (fs.existsSync(DB_FILE)) db = Object.assign({}, EMPTY, JSON.parse(fs.readFileSync(DB_FILE, "utf8"))); } catch (e) { console.error("db.json оқылмады:", e.message); }
let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { const tmp = DB_FILE + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); }, 200); }

// ---------- Көмекші ----------
const now = () => Date.now(), day = (t = now()) => new Date(t + 5 * 3600e3).toISOString().slice(0, 10);   // Қазақстан уақыты (UTC+5)
const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = e => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);
function send(res, code, obj, headers) { const b = JSON.stringify(obj); res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, headers || {})); res.end(b); }
function readBody(req) { return new Promise((ok, no) => { let size = 0, chunks = [];
  req.on("data", c => { size += c.length; if (size > 100 * 1024) { no(Object.assign(new Error("Сұраныс тым үлкен"), { code: 413 })); req.destroy(); } else chunks.push(c); });
  req.on("end", () => { try { ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { no(Object.assign(new Error("JSON қате"), { code: 400 })); } }); req.on("error", no); }); }
const cookies = req => Object.fromEntries((req.headers.cookie || "").split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const ipOf = req => (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "";
// жылдамдық шектеуі (IP бойынша)
const buckets = new Map();
function limited(key, max, perMs) { const t = now(), b = buckets.get(key) || []; const fresh = b.filter(x => t - x < perMs); fresh.push(t); buckets.set(key, fresh); return fresh.length > max; }
setInterval(() => { const t = now(); for (const [k, v] of buckets) if (!v.some(x => t - x < 3600e3)) buckets.delete(k); for (const [k, s] of Object.entries(db.sessions)) if (s.exp < t) delete db.sessions[k]; }, 600e3).unref();

// ---------- Құпиясөз және сессия ----------
const hashPw = (pw, salt = crypto.randomBytes(16).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
function checkPw(pw, stored) { const [salt, h] = String(stored).split(":"); if (!salt || !h) return false; const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const SESSION_DAYS = 30;
function startSession(res, user) { const tok = crypto.randomBytes(32).toString("hex"); db.sessions[tok] = { uid: user.id, exp: now() + SESSION_DAYS * 864e5 }; save();
  return `sid=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${ENV.COOKIE_SECURE ? "; Secure" : ""}`; }
function userOf(req) { const s = db.sessions[cookies(req).sid]; if (!s || s.exp < now()) return null; return db.users.find(u => u.id === s.uid) || null; }
const isAdmin = u => !!u && !!ENV.ADMIN_EMAIL && u.email === ENV.ADMIN_EMAIL;
const pubUser = u => u && { id: u.id, name: u.name, email: u.email, admin: isAdmin(u) };

// ---------- Тапсырыс есебі (бағаны сервер өзі есептейді) ----------
function priceOrder(items, promo) {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw Object.assign(new Error("Себет бос не қате"), { code: 400 });
  const lines = items.map(i => { const p = CATALOG.products.find(x => x.name === i.name), q = Math.floor(+i.quantity);
    if (!p) throw Object.assign(new Error("Өнім табылмады: " + str(i.name, 60)), { code: 400 });
    if (!(q >= 1 && q <= 20)) throw Object.assign(new Error("Саны қате"), { code: 400 });
    if (p.stock === 0) throw Object.assign(new Error(p.name + " қазір қоймада жоқ"), { code: 409 });
    return { name: p.name, price: p.price, quantity: q }; });
  const sub = lines.reduce((s, l) => s + l.price * l.quantity, 0), pct = CATALOG.promos[str(promo, 30).toUpperCase()] || 0, discount = Math.round(sub * pct / 100);
  return { lines, subtotal: sub, promo: pct ? str(promo, 30).toUpperCase() : null, discount, total: sub - discount };
}
const PAY = { kaspi: "Kaspi", card: "Банк картасы", cash: "Қолма-қол" };
const payKey = s => /kaspi/i.test(s) ? "kaspi" : /карт|card/i.test(s) ? "card" : "cash";
const STATUSES = ["Төлем күтілуде", "Қабылданды", "Төленді", "Жиналуда", "Жолда", "Жеткізілді", "Бас тартылды"];
function paymentInfo(o) {
  if (o.pay === "kaspi") return { method: "kaspi", configured: !!ENV.KASPI_PHONE, phone: ENV.KASPI_PHONE, name: ENV.KASPI_NAME, amount: o.total, comment: o.id,
    text: ENV.KASPI_PHONE ? `Kaspi → Аударымдар → ${ENV.KASPI_PHONE}${ENV.KASPI_NAME ? " (" + ENV.KASPI_NAME + ")" : ""}. Сома: ${o.total} ₸. Түсініктемеге ${o.id} деп жазыңыз.` : "Kaspi нөмірі әлі бапталмаған (KASPI_PHONE). Менеджер хабарласады." };
  if (o.pay === "card") return { method: "card", configured: false, text: "Картамен онлайн төлеу үшін төлем жүйесін (мысалы, CloudPayments, Halyk ePay) қосу керек. Әзірге менеджер төлем сілтемесін жібереді." };
  return { method: "cash", configured: true, text: "Курьерге қолма-қол не Kaspi QR арқылы төлейсіз." };
}

// ---------- AI кеңесші (Claude API) ----------
function systemPrompt() {
  const cat = CATALOG.products.map(p => `- ${p.name} | ${p.cat} | ${p.price} ₸${p.old ? " (бұрын " + p.old + " ₸)" : ""} | ${p.stock === 0 ? "ҚОЙМАДА ЖОҚ" : "бар"} | ${p.specs.join(", ")} | ${p.desc}`).join("\n");
  return `Сен ASUS онлайн-дүкенінің сатушы-кеңесшісісің. Клиент қай тілде жазса, сол тілде жауап бер (қазақ, орыс не ағылшын). Қысқа, нақты, достық үнмен жаз (3–6 сөйлем).
Тек төмендегі каталогтағы өнімдерді ұсын, бағаны дәл осылай айт. Қоймада жоқ өнімді ұсынба (тек «қайта түскенде хабарлаймыз» де). Каталогта жоқ нәрсені ойдан шығарма.
Өнім атын жазғанда оны [[Өнім атауы]] түрінде қос жақшамен жаз — сайт оны батырмаға айналдырады.
Промокодтар: ${Object.entries(CATALOG.promos).map(([k, v]) => k + " (" + v + "%)").join(", ") || "жоқ"}. Жеткізу ${300000} ₸-ден жоғары тапсырыста тегін.
Дүкенге қатысы жоқ сұрақтарға сыпайы түрде тек дүкен тақырыбында көмектесетініңді айт.

КАТАЛОГ:
${cat}`;
}
async function askClaude(messages) {
  const r = await fetch(ENV.ANTHROPIC_BASE_URL + "/v1/messages", { method: "POST",
    headers: { "x-api-key": ENV.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: ENV.AI_MODEL, max_tokens: 600, system: systemPrompt(), messages }), signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((j.error && j.error.message) || "AI қатесі " + r.status), { code: 502 });
  return (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
}

// ---------- API маршруттары ----------
const routes = {
  "GET /api/health": () => ({ ok: true, ai: !!ENV.ANTHROPIC_API_KEY, kaspi: !!ENV.KASPI_PHONE }),
  "GET /api/me": (req) => ({ user: pubUser(userOf(req)) }),
  "POST /api/register": async (req, res, b) => {
    if (limited("reg:" + ipOf(req), 10, 3600e3)) throw Object.assign(new Error("Тым көп әрекет, кейінірек көріңіз"), { code: 429 });
    const name = str(b.name, 60), email = str(b.email, 200).toLowerCase(), pw = typeof b.password === "string" ? b.password : "";
    if (!name) throw Object.assign(new Error("Атыңызды жазыңыз"), { code: 400 });
    if (!emailOk(email)) throw Object.assign(new Error("Email қате"), { code: 400 });
    if (pw.length < 6 || pw.length > 200) throw Object.assign(new Error("Құпиясөз кемінде 6 таңба"), { code: 400 });
    if (db.users.some(u => u.email === email)) throw Object.assign(new Error("Бұл email тіркелген"), { code: 409 });
    const u = { id: crypto.randomUUID(), name, email, pw: hashPw(pw), created: now() }; db.users.push(u); save();
    return { _cookie: startSession(res, u), user: pubUser(u) };
  },
  "POST /api/login": async (req, res, b) => {
    if (limited("login:" + ipOf(req), 15, 900e3)) throw Object.assign(new Error("Тым көп әрекет, 15 минуттан кейін көріңіз"), { code: 429 });
    const u = db.users.find(x => x.email === str(b.email, 200).toLowerCase());
    if (!u || !checkPw(String(b.password || ""), u.pw)) throw Object.assign(new Error("Email не құпиясөз қате"), { code: 401 });
    return { _cookie: startSession(res, u), user: pubUser(u) };
  },
  "POST /api/logout": (req) => { delete db.sessions[cookies(req).sid]; save(); return { _cookie: "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0", ok: true }; },

  "POST /api/orders": async (req, res, b) => {
    if (limited("order:" + ipOf(req), 20, 3600e3)) throw Object.assign(new Error("Тым көп тапсырыс, кейінірек көріңіз"), { code: 429 });
    const c = b.customer || {}, pr = priceOrder(b.items, b.promo), u = userOf(req);
    const name = str(c.name, 80), phone = str(c.phone, 30), address = str(c.address, 200);
    if (!name || !/^[+0-9 ()-]{10,30}$/.test(phone) || !address) throw Object.assign(new Error("Аты, телефон және мекенжай керек"), { code: 400 });
    let id = /^ASUS-\d{6}$/.test(b.id) && !db.orders.some(o => o.id === b.id) ? b.id : null;
    while (!id || db.orders.some(o => o.id === id)) id = "ASUS-" + crypto.randomInt(100000, 1000000);
    const pay = payKey(str(c.pay, 40));
    const o = { id, date: now(), uid: u ? u.id : null, customer: { name, phone, address, city: str(c.city, 60), email: u ? u.email : str(c.email, 200) }, items: pr.lines,
      subtotal: pr.subtotal, promo: pr.promo, discount: pr.discount, total: pr.total, pay, status: pay === "cash" ? "Қабылданды" : "Төлем күтілуде", history: [] };
    o.history.push({ t: o.date, s: o.status }); db.orders.unshift(o); save();
    return { order: pubOrder(o), payment: paymentInfo(o) };
  },
  "GET /api/orders": (req) => { const u = userOf(req); if (!u) throw Object.assign(new Error("Кіру керек"), { code: 401 }); return { orders: db.orders.filter(o => o.uid === u.id).map(pubOrder) }; },
  "GET /api/order": (req, res, b, q) => { const o = db.orders.find(x => x.id === q.get("id")), ph = (q.get("phone") || "").replace(/\D/g, "");
    if (!o || ph.length < 4 || !o.customer.phone.replace(/\D/g, "").endsWith(ph.slice(-4))) throw Object.assign(new Error("Тапсырыс табылмады"), { code: 404 }); return { order: pubOrder(o) }; },

  "GET /api/reviews": () => { const g = {}; db.reviews.forEach(r => (g[r.product] = g[r.product] || []).push({ n: r.n, r: r.r, t: r.t, d: r.d })); return { reviews: g }; },
  "POST /api/reviews": (req, res, b) => {
    if (limited("rev:" + ipOf(req), 10, 3600e3)) throw Object.assign(new Error("Тым көп пікір"), { code: 429 });
    const product = str(b.product, 80), n = str(b.n, 60), t = str(b.t, 1000), r = Math.max(1, Math.min(5, Math.round(+b.r || 5)));
    if (!CATALOG.products.some(p => p.name === product) || !n || !t) throw Object.assign(new Error("Пікір толық емес"), { code: 400 });
    db.reviews.unshift({ product, n, r, t, d: now(), uid: (userOf(req) || {}).id || null }); save(); return { ok: true };
  },
  "POST /api/subscribe": (req, res, b) => { const e = str(b.email, 200).toLowerCase(); if (!emailOk(e)) throw Object.assign(new Error("Email қате"), { code: 400 });
    if (!db.subscribers.some(s => s.email === e)) { db.subscribers.push({ email: e, d: now() }); save(); } return { ok: true }; },
  "POST /api/notify": (req, res, b) => { const p = str(b.product, 80), c = str(b.contact, 200); if (!p || !c) throw Object.assign(new Error("Толық емес"), { code: 400 });
    if (limited("ntf:" + ipOf(req), 20, 3600e3)) throw Object.assign(new Error("Тым көп"), { code: 429 }); db.notify.push({ product: p, contact: c, d: now() }); save(); return { ok: true }; },
  "POST /api/contact": (req, res, b) => { if (limited("msg:" + ipOf(req), 10, 3600e3)) throw Object.assign(new Error("Тым көп хабарлама"), { code: 429 });
    const m = { name: str(b.name, 80), email: str(b.email, 200), text: str(b.text, 2000), d: now() }; if (!m.name || !m.text) throw Object.assign(new Error("Толық емес"), { code: 400 });
    db.messages.unshift(m); save(); return { ok: true }; },
  "POST /api/track": (req, res, b) => {
    if (limited("trk:" + ipOf(req), 120, 60e3)) return { ok: true };
    const d = day(), vid = str(b.vid, 40);
    if (b.type === "visit") { db.visits[d] = (db.visits[d] || 0) + 1; if (vid) { const u = db.uniq[d] = db.uniq[d] || []; if (!u.includes(vid) && u.length < 50000) u.push(vid); } }
    if (b.type === "view") { const p = str(b.product, 80); if (CATALOG.products.some(x => x.name === p)) db.views[p] = (db.views[p] || 0) + 1; }
    save(); return { ok: true };
  },
  "POST /api/ai": async (req, res, b) => {
    if (!ENV.ANTHROPIC_API_KEY) throw Object.assign(new Error("AI бапталмаған"), { code: 503 });
    if (limited("ai:" + ipOf(req), 12, 60e3) || limited("aiH:" + ipOf(req), 80, 3600e3)) throw Object.assign(new Error("Тым жиі сұрайсыз, сәл күтіңіз"), { code: 429 });
    const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-12).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: str(m.content, 1500) })).filter(m => m.content);
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") throw Object.assign(new Error("Сұрақ жоқ"), { code: 400 });
    return { reply: await askClaude(msgs) };
  },

  // ----- Админ -----
  "GET /api/admin/stats": (req) => { needAdmin(req);
    const days = []; for (let i = 13; i >= 0; i--) { const d = day(now() - i * 864e5); days.push({ d, visits: db.visits[d] || 0, uniq: (db.uniq[d] || []).length, orders: db.orders.filter(o => day(o.date) === d).length }); }
    const live = db.orders.filter(o => o.status !== "Бас тартылды"), sold = {};
    live.forEach(o => o.items.forEach(i => sold[i.name] = (sold[i.name] || 0) + i.quantity));
    return { days, totals: { visits: Object.values(db.visits).reduce((a, b) => a + b, 0), users: db.users.length, orders: db.orders.length, revenue: live.filter(o => ["Төленді", "Жиналуда", "Жолда", "Жеткізілді"].includes(o.status)).reduce((s, o) => s + o.total, 0),
        pending: live.reduce((s, o) => s + o.total, 0), subscribers: db.subscribers.length },
      views: Object.entries(db.views).sort((a, b) => b[1] - a[1]), sold: Object.entries(sold).sort((a, b) => b[1] - a[1]),
      orders: db.orders.slice(0, 50), statuses: STATUSES, messages: db.messages.slice(0, 30), notify: db.notify.slice(-30).reverse(), subscribers: db.subscribers.slice(-50).reverse() };
  },
  "POST /api/admin/order": (req, res, b) => { needAdmin(req); const o = db.orders.find(x => x.id === b.id); if (!o) throw Object.assign(new Error("Табылмады"), { code: 404 });
    if (!STATUSES.includes(b.status)) throw Object.assign(new Error("Статус қате"), { code: 400 });
    o.status = b.status; o.history.push({ t: now(), s: b.status }); save(); return { order: o }; }
};
function needAdmin(req) { const u = userOf(req); if (!isAdmin(u)) throw Object.assign(new Error(u ? "Тек әкімшіге" : "Кіру керек"), { code: u ? 403 : 401 }); }
const pubOrder = o => ({ id: o.id, date: o.date, items: o.items, subtotal: o.subtotal, discount: o.discount, promo: o.promo, total: o.total, pay: o.pay, payName: PAY[o.pay], status: o.status, history: o.history, payment: o.status === "Төлем күтілуде" ? paymentInfo(o) : null });

// ---------- Статикалық файлдар ----------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".glb": "model/gltf-binary", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8" };
const BLOCK = /^\/(server|\.env|\.git|node_modules|package(-lock)?\.json)(\/|$)/i;
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p.endsWith("/")) p += "index.html";
  if (BLOCK.test(p) || p.split("/").some(s => s.startsWith(".") && s !== ".well-known")) { res.writeHead(404); return res.end("Not found"); }
  const file = path.join(ROOT, p); if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => { if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Табылмады"); }
    const ext = path.extname(file).toLowerCase(), long = /\.(glb|png|jpe?g|webp|svg)$/.test(ext);
    if (ENV.SITE_URL && /\.(html|txt|xml)$/.test(ext)) {          // SEO: example.com → нақты домен
      const txt = fs.readFileSync(file, "utf8").split("https://example.com").join(ENV.SITE_URL);
      res.writeHead(200, { "Content-Type": MIME[ext], "Content-Length": Buffer.byteLength(txt), "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" }); return res.end(req.method === "HEAD" ? undefined : txt); }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Content-Length": st.size, "Cache-Control": long ? "public, max-age=604800" : "no-cache", "X-Content-Type-Options": "nosniff" });
    if (req.method === "HEAD") return res.end(); fs.createReadStream(file).pipe(res); });
}

// ---------- Сервер ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith("/api/")) return req.method === "GET" || req.method === "HEAD" ? serveStatic(req, res, url) : (res.writeHead(405), res.end());
  const fn = routes[req.method + " " + url.pathname]; if (!fn) return send(res, 404, { error: "Жоқ API" });
  try {
    let body = {};
    if (req.method === "POST") { if (!/application\/json/.test(req.headers["content-type"] || "")) return send(res, 415, { error: "JSON керек" }); body = await readBody(req); }
    const out = await fn(req, res, body, url.searchParams); const ck = out && out._cookie; if (ck) delete out._cookie;
    send(res, 200, out, ck ? { "Set-Cookie": ck } : null);
  } catch (e) { if (!e.code || e.code >= 500 && e.code !== 502 && e.code !== 503) console.error(e); send(res, typeof e.code === "number" ? e.code : 500, { error: e.code ? e.message : "Сервер қатесі" }); }
});
if (require.main === module) server.listen(ENV.PORT, () => {
  console.log(`\n  ASUS дүкені іске қосылды → http://localhost:${ENV.PORT}\n`);
  console.log("  Әкімші email:", ENV.ADMIN_EMAIL || "(жоқ — .env файлында ADMIN_EMAIL жаз)");
  console.log("  AI кеңесші:  ", ENV.ANTHROPIC_API_KEY ? "қосулы (" + ENV.AI_MODEL + ")" : "өшірулі (ANTHROPIC_API_KEY жоқ)");
  console.log("  Kaspi:       ", ENV.KASPI_PHONE || "(KASPI_PHONE жоқ)", "\n");
});
module.exports = { server, routes, priceOrder, reload: () => (CATALOG = loadCatalog()) };
