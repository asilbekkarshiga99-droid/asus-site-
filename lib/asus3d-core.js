// ===== Ортақ 3D ядро: three.js жүктеу, GLB жүктеу, нормалау, жарық ортасы =====
window.A3D = (function () {
  const LIBS = ["lib/three.min.js", "lib/GLTFLoader.js", "lib/meshopt_decoder.js"];
  const FILES = { laptop: "models/laptop.glb", pc: "models/pc.glb", monitor: "models/monitor.glb", keyboard: "models/keyboard.glb" };
  const SIZE = { laptop: 6.4, pc: 6.4, monitor: 7.2, keyboard: 7.4 };
  const ROT0 = { laptop: -.5, pc: -1.0, monitor: Math.PI - .35, keyboard: -.3 };
  const gl = {}; let T = null, readyP = null;
  const loadJS = src => new Promise((ok, no) => { if ([...document.scripts].some(s => s.src.endsWith(src))) return ok(); const e = document.createElement("script"); e.src = src; e.onload = ok; e.onerror = () => no(new Error(src + " жүктелмеді")); document.head.appendChild(e); });
  function ready() { return readyP || (readyP = LIBS.reduce((p, l) => p.then(() => loadJS(l)), Promise.resolve()).then(() => (T = window.THREE))); }
  function raw(name) { return gl[name] || (gl[name] = new Promise((res, rej) => new T.GLTFLoader().setMeshoptDecoder(window.MeshoptDecoder).load(window.modelFile ? modelFile(name) : FILES[name], g => res(g), undefined, rej))); }

  // ноутбук қақпағын топтан бөліп, топса бойымен айналатын pivot жасау
  function splitLid(root) {
    root.updateMatrixWorld(true);
    const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
    const hinge = new T.Group(); hinge.position.set(0, .012, -.136); root.add(hinge); hinge.updateMatrixWorld(true);
    meshes.forEach(m => { const c = new T.Box3().setFromObject(m).getCenter(new T.Vector3()); if (c.y > .0004 && (c.y > .03 || c.z < -.13)) hinge.attach(m); });
    return hinge;
  }

  async function model(name, opts) {
    opts = opts || {}; await ready(); const g = await raw(name);
    const root = g.scene.clone(true);
    root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (name === "keyboard" && /cable/i.test(o.name)) o.visible = false; } });
    let lid = null, screen = null;
    if (name === "laptop" && opts.lid) { lid = splitLid(root); root.traverse(o => { if (o.isMesh && o.material && o.material.name === "Screen") { o.material = o.material.clone(); screen = o.material; } }); }
    const vis = []; root.traverse(o => { if (o.isMesh && o.visible) vis.push(o); });
    const b = new T.Box3(); vis.forEach(o => b.expandByObject(o));
    const size = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3()), k = SIZE[name] / Math.max(size.x, size.y, size.z);
    root.scale.setScalar(k); root.position.copy(c).multiplyScalar(-k);
    const pivot = new T.Group(); pivot.add(root); pivot.userData = { rot0: ROT0[name], k, lid, screen };
    return pivot;
  }

  function stage(container, opts) {
    opts = opts || {}; const W = () => container.clientWidth || 300, H = () => container.clientHeight || 300;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(opts.fov || 40, W() / H(), .1, 100);
    const ren = new T.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(devicePixelRatio || 1, window.LITE ? 1.5 : 2)); ren.setSize(W(), H());
    ren.outputEncoding = T.sRGBEncoding; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.1; container.appendChild(ren.domElement);
    const envS = new T.Scene(); envS.add(new T.Mesh(new T.SphereGeometry(50, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, color: 0x6c7280 })));
    [[0, 35, 0], [40, 10, 30], [-40, 5, -20]].forEach(p => { const m = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshBasicMaterial({ side: T.DoubleSide, color: new T.Color(0xffffff).multiplyScalar(6) })); m.position.set(...p); m.lookAt(0, 0, 0); envS.add(m); });
    scene.environment = new T.PMREMGenerator(ren).fromScene(envS).texture;
    scene.add(new T.AmbientLight(0xffffff, .35)); const d = new T.DirectionalLight(0xffffff, .9); d.position.set(5, 8, 6); scene.add(d);
    const p1 = new T.PointLight(0xe63946, .8, 30); p1.position.set(-6, 3, 5); scene.add(p1); const p2 = new T.PointLight(0x3a86ff, .7, 30); p2.position.set(6, -2, -5); scene.add(p2);
    const onResize = () => { cam.aspect = W() / H(); cam.updateProjectionMatrix(); ren.setSize(W(), H()); };
    addEventListener("resize", onResize);
    return { scene, cam, ren, W, H, resize: onResize, dispose() { removeEventListener("resize", onResize); ren.dispose(); ren.domElement.remove(); } };
  }
  return { ready, model, stage, T: () => T };
})();
