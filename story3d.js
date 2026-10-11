// ===== Скролл-анимация: ноутбук айналады, қақпағы ашылады, экраны жанады =====
(function () {
  if (!window.A3D) return;
  const sec = document.createElement("section"); sec.className = "story"; sec.id = "story";
  sec.innerHTML = `<div class="story-pin"><div class="story-stage"><div class="story-load">3D жүктелуде...</div></div>
    <div class="story-caps">
      <div class="story-cap"><small>ASUS ROG</small><h2>Жұқа.<br>Жеңіл.<br>Қуатты.</h2><p>Төмен айналдыр, ноутбук саған ашылады.</p></div>
      <div class="story-cap"><small>01 · ҚАҚПАҒЫН АШ</small><h2>Бір қимыл,<br>бүкіл қуат.</h2><p>Жұқа корпус ішінде ойынға арналған жүйе жасырылған.</p></div>
      <div class="story-cap"><small>02 · ЭКРАН</small><h2>Жанып<br>кетеді.</h2><p>Жоғары жаңарту жиілігі мен нақты түстер. Әр кадр жұмсақ.</p></div>
      <div class="story-cap"><small>03 · ДАЙЫН</small><h2>Ойынға<br>дайынсың ба?</h2><p>Каталогтан өзіңе лайықты құрылғыны тап.</p><a href="#products">Каталогты ашу →</a></div>
    </div><div class="story-prog"><i></i></div><div class="story-hint">↓ ТӨМЕН АЙНАЛДЫР</div></div>`;
  (document.querySelector(".features") || document.querySelector(".hero")).after(sec);
  const caps = [...sec.querySelectorAll(".story-cap")], bar = sec.querySelector(".story-prog i"), hint = sec.querySelector(".story-hint"), box = sec.querySelector(".story-stage");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), seg = (a, b, p) => clamp((p - a) / (b - a)), ease = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const CLOSED = 1.92; // қақпақ жабық (радиан, ~110°)
  let started = false, p = 0, target = 0;
  const progress = () => { const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight; return clamp(-r.top / total); };
  addEventListener("scroll", () => { target = progress(); }, { passive: true }); target = progress();

  async function start() {
    if (started) return; started = true;
    try { await A3D.ready(); } catch (e) { box.querySelector(".story-load").textContent = "3D жүктелмеді (lib/ папкасын тексер)"; return; }
    const T = A3D.T(), st = A3D.stage(box, { fov: 38 }), pv = await A3D.model("laptop", { lid: true });
    box.querySelector(".story-load").remove(); st.scene.add(pv);
    const lid = pv.userData.lid, scr = pv.userData.screen; let visible = true;
    new IntersectionObserver(es => visible = es[0].isIntersecting).observe(sec);
    (function loop() { requestAnimationFrame(loop); if (!visible || document.hidden) return;
      p += (target - p) * .12;
      const open = ease(seg(.17, .5, p)), glow = ease(seg(.42, .62, p)), turn = ease(seg(0, 1, p)), zoom = ease(seg(.5, .72, p)), back = ease(seg(.8, 1, p));
      lid.rotation.x = CLOSED * (1 - open);
      if (scr) { scr.emissiveIntensity = glow; scr.color.setScalar(lerp(.04, 1, glow)); }
      pv.rotation.y = lerp(-1.5, .25, turn) + Math.sin(p * 9) * .05; pv.rotation.x = lerp(.28, .12, ease(seg(.2, .6, p)));
      pv.position.y = lerp(.9, 1.0, open) - zoom * .35 + back * .2;
      const narrow = st.cam.aspect < 1, far = narrow ? Math.min(2.4, 1.05 / st.cam.aspect) : 1;   // телефонда камера алысырақ
      st.cam.position.set(0, 2.6 - zoom * 1.4, (lerp(16.5, 9.5, zoom) + back * 5.5) * far); st.cam.lookAt(innerWidth > 800 ? -2.2 : 0, narrow ? -2.2 : .5, 0);
      st.ren.render(st.scene, st.cam);
      const idx = p < .16 ? 0 : p < .46 ? 1 : p < .78 ? 2 : 3; caps.forEach((c, i) => c.classList.toggle("on", i === idx));
      bar.style.height = p * 100 + "%"; hint.style.opacity = p < .04 ? .55 : 0;
    })();
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); start(); } }, { rootMargin: "400px" }).observe(sec);
  window.__story = { sec, get p() { return p; } };
})();
