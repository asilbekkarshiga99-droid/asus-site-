// ===== 3D модельдер: ноутбук, компьютер, монитор, клавиатура (three.js) =====
(function () {
  const LIBS = ["lib/three.min.js", "lib/GLTFLoader.js", "lib/meshopt_decoder.js"];
  const FILES = { laptop: "models/laptop.glb", pc: "models/pc.glb", monitor: "models/monitor.glb", keyboard: "models/keyboard.glb" };
  const SIZE = { laptop: 6.4, pc: 6.4, monitor: 7.2, keyboard: 7.4 };       // модельдің ең үлкен өлшемі (сахнада)
  const ROT0 = { laptop: -.5, pc: -1.0, monitor: Math.PI - .35, keyboard: -.3 };      // бастапқы бұрыш (алдыңғы жағы камераға қарайды)
  const cache = {};
  const TABS = [["laptop", "💻 Ноутбук"], ["pc", "🖥 Компьютер"], ["monitor", "🖵 Монитор"], ["keyboard", "⌨ Клавиатура"]];
  let T, anim = [];

  // ---------- көмекші функциялар ----------
  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: .5, roughness: .4 }, o || {}));
  const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); return o; };
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; };
  const screenMat = (title, c1, c2) => new T.MeshBasicMaterial({ toneMapped: false, map: tex(512, 320, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff"; g.font = "bold 62px Arial"; g.textAlign = "center"; g.fillText(title, w / 2, h / 2 + 20); }) });
  function fan(r, color) { const g = new T.Group(), m = mat(color, { emissive: color, emissiveIntensity: .6 });
    g.add(new T.Mesh(new T.TorusGeometry(r, r * .08, 8, 28), mat(0x222222)));
    for (let i = 0; i < 7; i++) { const b = box(r * .8, r * .22, .02, m, 0, 0, 0); b.geometry.translate(r * .45, 0, 0); b.rotation.z = i * Math.PI * 2 / 7; b.rotation.x = .4; g.add(b); }
    g.add(new T.Mesh(new T.CylinderGeometry(r * .22, r * .22, .06, 16), mat(0x111111)).rotateX(Math.PI / 2));
    return g; }
  const spin = (g, s) => anim.push(t => { g.rotation.z = t * s; });

  // ---------- модельдер ----------
  function keysGrid(g, x0, z0, rows, y, colorFn) {
    rows.forEach((n, r) => { for (let c = 0; c < n; c++) {
      const k = box(.21, .07, .2, mat(0x1b1b1f, { metalness: .2, emissive: 0x000000 }), x0 + c * .26 + (r % 2) * .05, y, z0 + r * .25); g.add(k);
      if (colorFn) anim.push(t => k.material.emissive.setHSL((t * .25 + c * .04 + r * .08) % 1, 1, .32)); } }); }

  function laptop() { const g = new T.Group();
    g.add(box(4, .14, 2.8, mat(0x9aa0a8), 0, .07, 0));
    keysGrid(g, -1.62, -.95, [13, 13, 12, 12, 11], .17, false);
    g.add(box(1.3, .012, .75, mat(0xb6bcc4), 0, .145, .98));
    const lid = new T.Group(); lid.position.set(0, .14, -1.35); lid.rotation.x = -.3;
    lid.add(box(4, 2.65, .09, mat(0x9aa0a8), 0, 1.33, 0));
    const scr = new T.Mesh(new T.PlaneGeometry(3.8, 2.4), screenMat("ASUS Zenbook", "#ff9f1c", "#6a1b9a")); scr.position.set(0, 1.33, .047); lid.add(scr);
    g.add(lid); g.position.y = -.6; return g; }

  function monitor() { const g = new T.Group();
    g.add(box(5.6, 3.3, .16, mat(0x0d0d0f, { metalness: .7 }), 0, 2.9, 0));
    const s = new T.Mesh(new T.PlaneGeometry(5.35, 3.05), screenMat("ROG OLED", "#e63946", "#1a237e")); s.position.set(0, 2.9, .09); g.add(s);
    g.add(box(.45, 1.5, .2, mat(0x151517), 0, 1.0, -.15));
    g.add(box(2.4, .08, 1.5, mat(0x151517), 0, .04, -.05));
    const logo = box(.3, .05, .02, mat(0xe63946, { emissive: 0xe63946, emissiveIntensity: 1 }), 0, 1.1, -.04); g.add(logo);
    g.position.y = -1.6; return g; }

  function keyboard() { const g = new T.Group();
    g.add(box(6.3, .22, 2.3, mat(0x3a3d45), 0, .11, 0));
    keysGrid(g, -3, -.85, [14, 14, 13, 12], .27, true);
    const sp = box(2.4, .07, .2, mat(0x1b1b1f, { metalness: .2, emissive: 0x000000 }), 0, .27, .9); g.add(sp);
    anim.push(t => sp.material.emissive.setHSL((t * .25) % 1, 1, .32));
    g.rotation.x = .25; g.position.y = -.4; g.scale.setScalar(.95); return g; }

  function pc() { const g = new T.Group(), dark = mat(0x16171a, { metalness: .6 });
    g.add(box(2.2, .08, 4.4, dark, 0, .04, 0)); g.add(box(2.2, .08, 4.4, dark, 0, 4.36, 0));
    g.add(box(.08, 4.4, 4.4, dark, -1.1, 2.2, 0)); g.add(box(2.2, 4.4, .08, dark, 0, 2.2, -2.2));
    const front = box(2.2, 4.4, .1, mat(0x24262b, { metalness: .6 }), 0, 2.2, 2.2); g.add(front);
    const strip = box(.06, 4, .04, mat(0xffffff, { emissive: 0xffffff }), 0, 2.2, 2.27); g.add(strip);
    anim.push(t => strip.material.emissive.setHSL((t * .25) % 1, 1, .5));
    const glass = new T.Mesh(new T.BoxGeometry(.04, 4.3, 4.3), new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: .22, metalness: .9, roughness: .1 })); glass.position.set(1.1, 2.2, 0); g.add(glass);
    g.add(box(.05, 3.6, 3.4, mat(0x1d1222), -1.0, 2.3, -.1));                         // аналық плата
    const gpu = box(1.6, .38, 3, mat(0x2b2b30), -.1, 1.6, 0); g.add(gpu);            // видеокарта
    [-.8, .8].forEach(z => { const f = fan(.5, 0xff2d55); f.position.set(.72, 1.6, z); f.rotation.y = Math.PI / 2; g.add(f); spin(f, 6); });
    const cool = new T.Mesh(new T.CylinderGeometry(.5, .5, .9, 24), mat(0x888d96)); cool.position.set(-.5, 3.1, -.3); g.add(cool);
    [3.5, 2.2, .9].forEach((y, i) => { const f = fan(.5, [0x00e5ff, 0xe63946, 0x7cff00][i]); f.position.set(0, y, 2.12); g.add(f); spin(f, -7); });
    g.rotation.y = -.9; g.position.y = -2.2; g.userData.rot0 = -.9; return g; }

  // ---------- Ноутбукті бөлшектерге шашу (explode) ----------
  const PART_DEFS = [
    // [id, белгі, шашу бағыты [x,y,z] (модель бірлігі), label төбесі]
    ["lid", "Экран", [0, .125, -.035]],
    ["top", "Пернетақта және тачпад", [0, .085, 0]],
    ["ram", "Жедел жад (RAM)", [-.075, .052, .03]],
    ["ssd", "SSD жад", [.07, .052, .06]],
    ["cpu", "Процессор (CPU)", [-.05, .028, -.02]],
    ["gpu", "Видеокарта (GPU)", [.05, .028, -.02]],
    ["fanL", "Желдеткіш", [-.085, .022, 0]],
    ["fanR", "Желдеткіш", [.085, .022, 0]],
    ["board", "Аналық плата", [0, -.03, 0]],
    ["battery", "Батарея", [0, -.068, .02]],
    ["bottom", "Төменгі қақпақ", [0, -.108, 0]]
  ];
  const LDY = { fanL: -30, cpu: -2, ram: 30, fanR: -30, gpu: -2, ssd: 28, top: -26, board: 6, bottom: 8 };
  function explodeRig(root) {
    root.updateMatrixWorld(true);
    const G = {}; PART_DEFS.forEach(d => { const g = new T.Group(); g.name = d[0]; root.add(g); G[d[0]] = g; });
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: .6, roughness: .35, envMapIntensity: .45 }, o || {}));
    const B = (w, h, d, m, x, y, z, grp) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
    // 1) бар қабықша бөліктерін топтарға бөлеміз (орналасуын сақтап)
    const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
    meshes.forEach(m => { const b = new T.Box3().setFromObject(m), c = b.getCenter(new T.Vector3());
      const id = (c.y > .0004 + (c.z < -.1 ? -1 : 0) && (c.y > .03 || c.z < -.13)) ? "lid" : c.y > .0004 ? "top" : "bottom"; G[id].attach(m); });
    // 2) ішкі бөлшектер (қабықшаның ішіне)
    const pcb = M(0x14502f, { metalness: .1, roughness: .85 }), steel = M(0x9aa0a8), dark = M(0x15161a), gold = M(0xd4a23a, { metalness: .9, roughness: .25 }), cu = M(0xb86f3d, { metalness: .9, roughness: .3 });
    const Y = -.0075;
    B(.31, .0016, .175, pcb, 0, Y, -.025, G.board);
    for (let i = 0; i < 26; i++) B(.004 + (i % 3) * .002, .0014, .004, dark, -.14 + i * .0108, Y + .0015, -.098 + (i % 4) * .004, G.board);
    // CPU
    B(.03, .0018, .03, M(0x2a7c4f, { metalness: .3 }), -.035, Y + .0016, -.045, G.cpu);
    B(.022, .0022, .022, steel, -.035, Y + .0036, -.045, G.cpu);
    B(.012, .0008, .012, gold, -.035, Y + .0052, -.045, G.cpu);
    // GPU
    B(.042, .0018, .042, M(0x2a7c4f, { metalness: .3 }), .045, Y + .0016, -.045, G.gpu);
    B(.026, .0026, .026, dark, .045, Y + .0038, -.045, G.gpu);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => B(.009, .0016, .009, M(0x333640), .045 + a * .019, Y + .0034, -.045 + b * .019, G.gpu));
    // жылу түтіктері (мыс)
    [[-.035, -.085], [.045, .085]].forEach(([x0, x1], k) => { const len = Math.abs(x1 - x0) + .03, cyl = new T.Mesh(new T.CylinderGeometry(.0028, .0028, len, 12), cu);
      cyl.rotation.z = Math.PI / 2; cyl.position.set((x0 + x1) / 2, Y + .0054 + k * .0006, -.06 - k * .004); (k ? G.gpu : G.cpu).add(cyl); });
    // желдеткіштер
    const mkFan = (x, grp) => { const spinner = new T.Group(), f = fan(.5, 0x2b2d33); f.rotation.x = -Math.PI / 2; spinner.add(f); spinner.scale.setScalar(.066); spinner.position.set(x, Y + .007, -.055); grp.add(spinner);
      const ring = new T.Mesh(new T.TorusGeometry(.036, .0022, 6, 28), M(0x0d0e11)); ring.rotation.x = Math.PI / 2; ring.position.copy(spinner.position); grp.add(ring); return spinner; };
    const fans = [mkFan(-.108, G.fanL), mkFan(.108, G.fanR)];
    // RAM (екі планка)
    [0, 1].forEach(i => { B(.05, .0012, .014, M(0x1b5e3a, { metalness: .3 }), -.045, Y + .006 + i * .0034, .018, G.ram); for (let c = 0; c < 4; c++) B(.007, .0016, .008, dark, -.058 + c * .0085, Y + .0068 + i * .0034, .018, G.ram); B(.04, .0006, .002, gold, -.045, Y + .0056 + i * .0034, .0255, G.ram); });
    // SSD
    B(.042, .001, .012, M(0x1b5e3a, { metalness: .3 }), .075, Y + .0055, .04, G.ssd);
    [-.012, .002, .014].forEach(x => B(.01, .0014, .008, dark, .075 + x, Y + .0064, .04, G.ssd));
    B(.0045, .0012, .008, gold, .0975, Y + .0055, .04, G.ssd);
    // Батарея
    B(.215, .0045, .058, M(0x2b2d33, { metalness: .4, roughness: .5 }), 0, Y - .0042, .072, G.battery);
    B(.19, .0006, .02, M(0xe63946, { emissive: 0xe63946, emissiveIntensity: .5 }), 0, Y - .0016, .072, G.battery);
    // 3) белгі нүктелері
    const A = {}; const anchorOf = (id, x, y, z) => { const o = new T.Object3D(); o.position.set(x, y, z); G[id].add(o); A[id] = o; };
    anchorOf("lid", 0, .095, -.15); anchorOf("top", 0, .003, .02); anchorOf("ram", -.045, Y + .012, .018); anchorOf("ssd", .075, Y + .008, .04);
    anchorOf("cpu", -.035, Y + .008, -.045); anchorOf("gpu", .045, Y + .008, -.045); anchorOf("fanL", -.108, Y + .01, -.055); anchorOf("fanR", .108, Y + .01, -.055);
    anchorOf("board", 0, Y, .1); anchorOf("battery", .09, Y - .003, .072); anchorOf("bottom", 0, -.012, .1);
    let f = 0;
    return { groups: G, anchors: A, defs: PART_DEFS, state: { target: 0 }, ldy: LDY, left: ["ram", "cpu", "fanL", "board", "bottom"],
      cam: e => ({ lookY: .3 - e * 1.1, extra: e * 3.2, tilt: e * .22 }),
      update(t, dt) {
        f += (this.state.target - f) * Math.min(1, dt * 5.5); const e = f * f * (3 - 2 * f);
        PART_DEFS.forEach(d => G[d[0]].position.set(d[2][0] * e, d[2][1] * e, d[2][2] * e));
        fans.forEach((s, i) => s.rotation.y = t * (i ? 9 : -9) * (.3 + e)); return e; } };
  }


  // ---------- Компьютер корпусын бөлшектеу ----------
  const PC_DEFS = [
    ["glass", "Шыны бүйір қақпақ", [0, 0, 2.3]], ["side", null, [0, 0, -1.3]], ["top", "Үстіңгі панель", [0, 1.5, 0]],
    ["front", "Алдыңғы панель", [2.1, 0, 0]], ["fans", "Желдеткіштер", [1.15, 0, 0]], ["rear", "Артқы желдеткіш", [-1.1, .1, 0]],
    ["shroud", null, [0, -.25, 1.5]], ["psu", "Қуат блогы (PSU)", [-1.5, -.55, .25]], ["gpu", "Видеокарта (GPU)", [0, -.4, 1.75]],
    ["cooler", "Процессор + салқындатқыш", [.15, .35, 1.1]], ["ram", "Жедел жад (RAM)", [.35, .7, .7]], ["ssd", "M.2 SSD", [.2, -.1, .5]],
    ["board", "Аналық плата", [0, 0, -.15]]
  ];
  function pcRig(root) {
    root.updateMatrixWorld(true);
    const G = {}; PC_DEFS.forEach(d => { const g = new T.Group(); g.name = "pc_" + d[0]; root.add(g); G[d[0]] = g; });
    const frame = new T.Group(); root.add(frame);
    const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
    meshes.forEach(m => { const b = new T.Box3().setFromObject(m), c = b.getCenter(new T.Vector3()), z = b.getSize(new T.Vector3());
      let id = null;
      if (c.z > .2) id = "glass";
      else if (c.x > 1.6) id = "front";
      else if (c.y > -9.55) id = "top";
      else if (c.z < -1.6 && z.z < .3) id = "side";
      else if (m.name === "Object_76") id = "shroud";
      if (id) G[id].attach(m); });
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: .55, roughness: .4, envMapIntensity: .6 }, o || {}));
    const B = (w, h, d, m, x, y, z, grp) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
    const pcb = M(0x1a1c20, { metalness: .3, roughness: .7 }), dark = M(0x111216), steel = M(0x8e949c, { metalness: .8, roughness: .3 }), alu = M(0xb9bec6, { metalness: .9, roughness: .35 }),
      cu = M(0xb86f3d, { metalness: .9, roughness: .3 }), red = M(0xe63946, { emissive: 0xe63946, emissiveIntensity: 1.2 }), gold = M(0xd4a23a, { metalness: .9, roughness: .25 });
    const ZB = -1.33;                       // аналық плата беті (z)
    // Аналық плата
    B(2.5, 2.95, .04, pcb, -.5, -11.12, ZB - .02, G.board);
    B(.5, .9, .14, M(0x2a2d33, { metalness: .7 }), -1.5, -10.15, ZB + .07, G.board);          // VRM радиатор / I/O қаптамасы
    B(.6, .55, .1, M(0x2a2d33, { metalness: .7 }), .1, -12.05, ZB + .05, G.board);            // чипсет радиаторы
    B(.04, .5, .03, red, .1, -12.05, ZB + .11, G.board);
    [-11.55, -12.25].forEach(y => B(2.0, .06, .06, dark, -.6, y, ZB + .03, G.board));         // PCIe слоттары
    for (let i = 0; i < 4; i++) B(.03, 1.05, .05, dark, -.4 + i * .08, -10.4, ZB + .025, G.board);   // RAM слоттары
    // Процессор + мұнара салқындатқыш
    const cx = -.95, cy = -10.35;
    B(.38, .38, .03, gold, cx, cy, ZB + .015, G.cooler);
    for (let i = 0; i < 16; i++) B(.5, .014, .82, alu, cx, cy - .4 + i * .053, ZB + .5, G.cooler);
    [-.12, -.04, .04, .12].forEach(dx => { const p = new T.Mesh(new T.CylinderGeometry(.025, .025, .95, 10), cu); p.position.set(cx + dx, cy, ZB + .5); G.cooler.add(p); });
    B(.52, .05, .84, M(0x16171b, { metalness: .6 }), cx, cy + .45, ZB + .5, G.cooler);
    B(.5, .012, .05, red, cx, cy + .478, ZB + .9, G.cooler);
    const cfan = fan(.4, 0xe63946); cfan.rotation.y = Math.PI / 2; cfan.position.set(cx + .3, cy, ZB + .5); G.cooler.add(cfan);
    // RAM
    for (let i = 0; i < 4; i++) { const x = -.4 + i * .08; B(.03, 1.0, .3, M(0x202228, { metalness: .7 }), x, -10.4, ZB + .17, G.ram); B(.032, .95, .04, red, x, -10.4, ZB + .34, G.ram); B(.031, .9, .03, gold, x, -10.4, ZB + .02, G.ram); }
    // M.2 SSD
    B(.62, .18, .025, M(0x1b5e3a, { metalness: .3 }), -.55, -11.15, ZB + .015, G.ssd);
    B(.58, .17, .04, M(0x2a2d33, { metalness: .8 }), -.55, -11.15, ZB + .05, G.ssd);
    // Видеокарта
    const gx = -.42, gy = -11.78, gz = ZB + .5;
    B(2.75, .03, .95, M(0x23252b, { metalness: .8 }), gx, gy + .18, gz, G.gpu);                  // backplate
    B(2.72, .34, .95, M(0x15161a, { metalness: .5, roughness: .45 }), gx, gy, gz, G.gpu);        // корпус
    B(2.3, .05, .015, red, gx + .1, gy, gz + .48, G.gpu);                                         // RGB жолақ
    B(.04, .5, .95, steel, -1.8, gy, gz, G.gpu);                                                  // артқы кронштейн
    [-1.2, -.42, .36].forEach(x => { const f = fan(.36, 0x2b2d33); f.rotation.x = Math.PI / 2; f.position.set(x, gy - .19, gz); G.gpu.add(f); });
    // Қуат блогы
    B(1.45, .78, 1.5, M(0x1c1d21, { metalness: .5 }), -1.05, -13.3, -.62, G.psu);
    B(1.45, .06, .02, red, -1.05, -13.0, .13, G.psu);
    const pf = fan(.5, 0x2b2d33); pf.rotation.x = Math.PI / 2; pf.position.set(-1.05, -13.7, -.62); G.psu.add(pf);
    // Алдыңғы және артқы желдеткіштер
    const spinners = [cfan];
    [-10.2, -11.38].forEach(y => { const f = fan(.52, 0xe63946); f.rotation.y = Math.PI / 2; f.position.set(1.55, y, -.62); G.fans.add(f); spinners.push(f); });
    const rf = fan(.5, 0xe63946); rf.rotation.y = Math.PI / 2; rf.position.set(-1.72, -10.25, -.75); G.rear.add(rf); spinners.push(rf);
    G.gpu.children.forEach(o => o.isGroup && spinners.push(o)); spinners.push(pf);
    // Белгі нүктелері
    const A = {}; const at = (id, x, y, z) => { const o = new T.Object3D(); o.position.set(x, y, z); G[id].add(o); A[id] = o; };
    at("glass", -.1, -9.8, .4); at("top", .6, -9.4, -.6); at("front", 1.95, -12.3, -.6); at("fans", 1.6, -10.8, -.62); at("rear", -1.75, -10.25, -.75);
    at("psu", -1.05, -13.3, .13); at("gpu", .6, gy, gz + .48); at("cooler", cx, cy + .48, ZB + .9); at("ram", -.28, -9.9, ZB + .34); at("ssd", -.55, -11.15, ZB + .08); at("board", .5, -12.6, ZB);
    let f = 0;
    return { groups: G, anchors: A, defs: PC_DEFS.filter(d => d[1]), state: { target: 0 }, ldy: {}, left: null,
      cam: e => ({ lookY: .3 + e * .3, extra: e * 7.5, tilt: e * .12 }),
      update(t, dt) {
        f += (this.state.target - f) * Math.min(1, dt * 4.5); const e = f * f * (3 - 2 * f);
        PC_DEFS.forEach(d => G[d[0]].position.set(d[2][0] * e, d[2][1] * e, d[2][2] * e));
        spinners.forEach((s, i) => s.rotation.z = t * (i % 2 ? 7 : -7)); return e; } };
  }

  // ---------- GLB жүктеу және қалыпқа келтіру ----------
  function prep(gltfScene, n) {
    const kill = []; gltfScene.traverse(o => { if (n === "keyboard" && /cable/i.test(o.name)) kill.push(o); });   // сымды алып тастаймыз (центрді бұзады)
    kill.forEach(o => o.parent && o.parent.remove(o));
    const rig = n === "laptop" ? explodeRig(gltfScene) : n === "pc" ? pcRig(gltfScene) : null;
    gltfScene.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    const b = new T.Box3().setFromObject(gltfScene), size = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
    const k = SIZE[n] / Math.max(size.x, size.y, size.z);
    gltfScene.scale.setScalar(k); gltfScene.position.copy(c).multiplyScalar(-k);
    const pivot = new T.Group(); pivot.add(gltfScene); pivot.userData.rot0 = ROT0[n]; if (rig) pivot.userData.rig = rig; return pivot;
  }
  function loadGLB(n, onProg) { return new Promise((res, rej) => { if (cache[n]) return res(cache[n]);
    new T.GLTFLoader().setMeshoptDecoder(window.MeshoptDecoder).load(FILES[n], g => { cache[n] = prep(g.scene, n); res(cache[n]); }, e => e.total && onProg && onProg(e.loaded / e.total), rej); }); }

  const BUILD = { laptop, pc, monitor, keyboard }, DIST = { laptop: 13.5, pc: 13.5, monitor: 12.5, keyboard: 9.8 };


  // ---------- 3D түс таңдағыш ----------
  const COLORS = {
    laptop: { mats: ["Painted", "SurfaceMetal", "LaptopSurface"], list: [["Түпнұсқа", null, "#6d7178"], ["Қара", "#1c1d20", "#2b2c30"], ["Қызыл", "#8e0f1a", "#c0303a"], ["Көк", "#1a348c", "#2f55c4"], ["Алтын", "#9c7432", "#c9a45c"]] },
    pc: { mats: ["Material.001"], list: [["Қара", null, "#0b0b0c"], ["Күміс", "#b9bec6"], ["Ақ", "#eceef1"], ["Қызыл", "#8f1820"]] },
    monitor: { mats: ["Base", "Backboard"], list: [["Түпнұсқа", null, "#3a3b3f"], ["Ақ", "#f2f2f2"], ["Қызыл", "#8e0f1a", "#c0303a"], ["Көк", "#1a348c", "#2f55c4"]] }
  };
  function colorMats(obj, n) { const c = COLORS[n]; if (!c) return []; const out = [];
    obj.traverse(o => { if (o.isMesh && c.mats.includes(o.material.name) && !out.includes(o.material)) { if (!o.material.userData.c0) o.material.userData.c0 = o.material.color.clone(); out.push(o.material); } });
    return out; }

  // ---------- сахна ----------
  function init(stage) {
    const W = () => stage.clientWidth, H = () => stage.clientHeight;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, W() / H(), .1, 100);
    const ren = new T.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); ren.setSize(W(), H());
    ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.1;
    stage.appendChild(ren.domElement); const ov = stage.querySelector(".v3-load"); ov.style.zIndex = 2; ov.style.display = "none";
    // жарық ортасы (шағылысу үшін)
    const envS = new T.Scene(); envS.add(new T.Mesh(new T.SphereGeometry(50, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, color: 0x6c7280 })));
    [[0, 35, 0], [40, 10, 30], [-40, 5, -20]].forEach(p => { const m = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshBasicMaterial({ side: T.DoubleSide, color: new T.Color(0xffffff).multiplyScalar(6) })); m.position.set(...p); m.lookAt(0, 0, 0); envS.add(m); });
    scene.environment = new T.PMREMGenerator(ren).fromScene(envS).texture;
    stage.insertAdjacentHTML("beforeend", `<button class="v3-explode" type="button">💥 Бөлшектеу</button><div class="v3-labels"></div><div class="v3-colors"></div><button class="v3-ar" type="button">📱 Үстеліңе қой (AR)</button><div class="v3-hint">🖱 Тартып айналдыр · дөңгелекпен жақындат · ноутбук не компьютерге тышқанды апар — бөлшектерге шашылады</div>`);
    scene.add(new T.AmbientLight(0xffffff, .35));
    const d = new T.DirectionalLight(0xffffff, .9); d.position.set(5, 8, 6); scene.add(d);
    const p1 = new T.PointLight(0xe63946, .8, 30); p1.position.set(-6, 3, 5); scene.add(p1);
    const p2 = new T.PointLight(0x3a86ff, .7, 30); p2.position.set(6, -2, -5); scene.add(p2);
    let cur = null, rx = 0, ry = 0, dist = 8, drag = false, lx = 0, ly = 0, visible = true, name = "laptop";
    const labelBox = stage.querySelector(".v3-labels"), exBtn = stage.querySelector(".v3-explode"); let labels = [], clock0 = 0, ease = 0, lookY = .3, extra = 0, moved = 0;
    const setEx = v => { const r = cur && cur.userData.rig; if (r) { r.state.target = v ? 1 : 0; exBtn.classList.toggle("on", !!v); } };
    exBtn.addEventListener("pointerdown", e => e.stopPropagation());
    exBtn.addEventListener("click", () => { const r = cur && cur.userData.rig; if (r) setEx(!r.state.target); });
    stage.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") setEx(1); });
    stage.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") setEx(0); });
    let token = 0, cMats = [], cTarget = null; const colBox = stage.querySelector(".v3-colors");
    colBox.addEventListener("pointerdown", e => e.stopPropagation()); stage.querySelector(".v3-ar").addEventListener("pointerdown", e => e.stopPropagation());
    stage.querySelector(".v3-ar").addEventListener("click", () => window.ASUS_AR && ASUS_AR.open(name));
    function swatches(obj, n) { cMats = colorMats(obj, n); cTarget = null; const c = COLORS[n]; colBox.innerHTML = "";
      if (!c || !cMats.length) return;
      c.list.forEach(([lbl, hex, show], i) => { const b = document.createElement("button"); b.type = "button"; b.title = lbl; b.setAttribute("aria-label", lbl); b.style.background = show || hex; if (!i) b.classList.add("on");
        b.onclick = () => { colBox.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); cTarget = cMats.map(m => hex ? new T.Color(hex).convertSRGBToLinear() : m.userData.c0.clone()); };
        colBox.appendChild(b); });
      const lb = document.createElement("span"); lb.textContent = "Түсі:"; colBox.prepend(lb); }
    function put(obj, n) { if (cur) scene.remove(cur); labelBox.innerHTML = ""; labels = []; exBtn.style.display = obj.userData.rig ? "" : "none"; exBtn.classList.remove("on"); if (obj.userData.rig) { obj.userData.rig.state.target = 0; labels = obj.userData.rig.defs.map(d => { const l = document.createElement("div"); l.className = "v3-label"; l.textContent = d[1]; if (obj.userData.rig.left && obj.userData.rig.left.includes(d[0])) l.classList.add("l"); labelBox.appendChild(l); return [d[0], l]; }); } anim = []; cur = obj; scene.add(cur); name = n; swatches(obj, n); dist = DIST[n]; ry = cur.userData.rot0 || -.5; rx = 0; }
    async function show(n) {
      const my = ++token; ov.style.display = "block"; ov.textContent = "3D жүктелуде... 0%";
      try { const m = await loadGLB(n, p => { if (my === token) ov.textContent = p >= 1 ? "3D дайындалуда..." : "3D жүктелуде... " + Math.round(p * 100) + "%"; });
        if (my === token) { put(m, n); ov.style.display = "none"; }
      } catch (err) { console.warn("GLB жүктелмеді:", err);
        if (my === token) { put(BUILD[n](), n); ov.textContent = "GLB файл ашылмады — қарапайым модель көрсетілді. Сайтты сервер арқылы ашыңыз (file:// емес)."; setTimeout(() => ov.style.display = "none", 5000); } }
    }
    stage.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; ly = e.clientY; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointerup", () => drag = false);
    stage.addEventListener("pointermove", e => { if (!drag) return; ry += (e.clientX - lx) * .01; rx = Math.max(-.6, Math.min(.9, rx + (e.clientY - ly) * .006)); lx = e.clientX; ly = e.clientY; });
    stage.addEventListener("wheel", e => { e.preventDefault(); dist = Math.max(4, Math.min(16, dist + e.deltaY * .01)); }, { passive: false });
    addEventListener("resize", () => { cam.aspect = W() / H(); cam.updateProjectionMatrix(); ren.setSize(W(), H()); });
    new IntersectionObserver(es => visible = es[0].isIntersecting).observe(stage);
    const clock = new T.Clock();
    (function loop() { requestAnimationFrame(loop); if (!visible || document.hidden || !cur) return;
      const t = clock.getElapsedTime(); if (!drag) ry += .006;
      const dt = Math.min(.05, t - clock0); clock0 = t; const rig = cur.userData.rig; ease = rig ? rig.update(t, dt) : 0;
      const cs = rig ? rig.cam(ease) : { lookY: .3, extra: 0, tilt: 0 }; lookY += (cs.lookY - lookY) * Math.min(1, dt * 5); extra += (cs.extra - extra) * Math.min(1, dt * 5);
      cur.rotation.y = ry; cur.rotation.x = name === "keyboard" ? .25 + rx : rx + cs.tilt; anim.forEach(f => f(t)); if (cTarget) cMats.forEach((m, i) => m.color.lerp(cTarget[i], Math.min(1, dt * 6)));
      if (rig) { cam.updateMatrixWorld(); labels.forEach(([id, el]) => { const v = rig.anchors[id].getWorldPosition(new T.Vector3()).project(cam);
        if (!rig.left) el.classList.toggle("l", v.x < 0); el.style.opacity = ease > .75 && v.z < 1 ? (ease - .75) * 4 : 0; stage.classList.toggle("exploded", ease > .3); el.style.transform = `translate(${(v.x * .5 + .5) * W()}px,${(-v.y * .5 + .5) * H() + (rig.ldy[id] || 0)}px)` + (el.classList.contains("l") ? " translateX(-100%)" : ""); }); }
      cam.position.set(0, 1.5, dist + extra); cam.lookAt(0, lookY, 0); ren.render(scene, cam); })();
    return show;
  }

  // ---------- бет ----------
  if (typeof document === "undefined" || !document.body) return;
  const sec = document.createElement("section"); sec.className = "viewer3d"; sec.id = "viewer3d";
  sec.innerHTML = `<span class="section-label">3D</span><h2>3D көрініс</h2><p>Құрылғыны әр жағынан қарап шық.</p>
    <div class="v3-tabs">${TABS.map((t, i) => `<button data-m="${t[0]}" class="${i ? "" : "on"}">${t[1]}</button>`).join("")}</div>
    <div class="v3-stage"><div class="v3-load">3D жүктелуде...</div></div>`;
  (document.querySelector(".brand-strip") || document.querySelector(".stats")).after(sec);
  let show = null;
  const loadJS = src => new Promise((ok, no) => { if ([...document.scripts].some(x => x.src.endsWith(src) && x.dataset.ok)) return ok(); const e = document.createElement("script"); e.src = src; e.onload = () => { e.dataset.ok = 1; ok(); }; e.onerror = no; document.head.appendChild(e); });
  const start = () => (window.A3D ? A3D.ready() : LIBS.reduce((p, l) => p.then(() => loadJS(l)), Promise.resolve()))
    .then(() => { T = window.THREE; show = init(sec.querySelector(".v3-stage")); show("laptop"); })
    .catch(err => { console.error(err); const o = sec.querySelector(".v3-load"); o.style.display = "block"; o.textContent = "3D жүктелмеді: " + (err && err.message ? err.message : "lib/ папкасын тексер"); });
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); start(); } }, { rootMargin: "300px" }).observe(sec);
  sec.querySelector(".v3-tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !show) return;
    sec.querySelectorAll(".v3-tabs button").forEach(x => x.classList.toggle("on", x === b)); show(b.dataset.m); });
  window.__v3 = { colors: COLORS, build: (three, n) => { T = three; anim = []; return BUILD[n](); }, prep: (three, sc, n) => { T = three; return prep(sc, n); } };  // тек тест үшін
})();
