// ===== Телефон режимі: телефонда жеңіл 3D модель мен суреттер жүктеледі (компьютерде — түпнұсқа) =====
// Себебі: 4096px текстуралар мен 2400px суреттер iPhone жадына сыймай, Safari бетті жауып тастайды.
(function () {
  const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) <= 900;
  const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
  const LITE = window.LITE = !!((coarse && small) || lowMem);
  // 3D модель жолы
  const M = { laptop: "models/m/laptop.glb" };
  window.modelFile = n => (LITE && M[n]) || "models/" + n + ".glb";
  if (!LITE) return;
  document.documentElement.classList.add("lite");
  // суреттерді жеңіл нұсқаға ауыстыру (img-m/*.webp)
  const BIG = /(^|\/)(hero-laptop|keyboard|laptop-Photoroom|monitor-Photoroom|pc-Photoroom|tuf-Photoroom|vivobook2-Photoroom|zenbook)\.png(\?|$)/;
  const swap = img => { const s = img.getAttribute("src"); if (!s || img.dataset.lite) return; const m = s.match(BIG); if (!m) return;
    img.dataset.lite = 1; img.dataset.full = s; img.src = s.replace(BIG, "$1img-m/$2.webp$3"); img.decoding = "async";
    img.addEventListener("error", () => { if (img.src.indexOf("img-m/") > -1) img.src = img.dataset.full; }, { once: true }); };
  const scan = root => { if (root.tagName === "IMG") swap(root); if (root.querySelectorAll) root.querySelectorAll("img").forEach(swap); };
  new MutationObserver(list => list.forEach(m => m.type === "attributes" ? (m.target.dataset.lite = "", swap(m.target)) : m.addedNodes.forEach(n => n.nodeType === 1 && scan(n))))
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  document.addEventListener("DOMContentLoaded", () => scan(document.body));
})();
