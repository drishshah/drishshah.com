/* Hero viewer: rotating 3D line drawings of the projects, drawn like the blue cover outlines.
   Each model is real geometry; lines are its sharp edges plus its silhouette, with hidden
   lines removed by a paper colored fill. Projects without a model yet show their cover. */
(function () {
  "use strict";
  var root = document.getElementById("viewer");
  if (!root || !window.THREE) return;
  var THREE = window.THREE;

  var BLUE = 0x0038fa, PAPER = 0xf8f3e8;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- drawing from a mesh ---------- */
  // Built once per model, nothing is recomputed per frame: a paper colored fill hides back lines,
  // blue crease edges come from EdgesGeometry, and a thin back face shell gives curved parts an outline.
  var FAT = !!(THREE.LineSegments2 && THREE.LineMaterial && THREE.LineSegmentsGeometry);
  function Drawing(geoms) {
    var fillPos = [], hullPos = [], edgePos = [];
    geoms.forEach(function (g) {
      var e = new THREE.EdgesGeometry(g, 25).attributes.position.array;
      for (var i = 0; i < e.length; i++) edgePos.push(e[i]);
      // round parts: add a few lines along the side, like a CAD wireframe shows on a cylinder
      if (/Cylinder|Lathe/.test(g.type)) {
        var hard = {}, key = function (a, o) { return a[o].toFixed(4) + a[o + 1].toFixed(4) + a[o + 2].toFixed(4); };
        for (var h = 0; h < e.length; h += 6) hard[key(e, h) + key(e, h + 3)] = hard[key(e, h + 3) + key(e, h)] = 1;
        var all = new THREE.EdgesGeometry(g, 0.5).attributes.position.array, side = [];
        for (var q = 0; q < all.length; q += 6) if (!hard[key(all, q) + key(all, q + 3)]) side.push(q);
        var step = Math.max(1, Math.round(side.length / 8));
        for (var r = 0; r < side.length; r += step) for (var c = 0; c < 6; c++) edgePos.push(all[side[r] + c]);
      }
      var n = g.index ? g.toNonIndexed() : g;
      n.computeVertexNormals();
      var p = n.attributes.position.array, nn = n.attributes.normal.array;
      var round = /Cylinder|Lathe|Sphere|Torus/.test(g.type);
      for (var j = 0; j < p.length; j++) { fillPos.push(p[j]); if (round) hullPos.push(p[j] + nn[j] * 0.008); }
    });
    function geo(arr) { var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); return g; }
    this.group = new THREE.Group();
    // see through wireframe like a CAD wireframe export: no fill, every edge drawn thin and partly transparent,
    // so lines get darker where parts overlap
    var mat = new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false });
    this.group.add(new THREE.LineSegments(geo(edgePos), mat));
  }
  Drawing.prototype.update = function (view, light, res) { if (this.mat) this.mat.resolution.set(res.x, res.y); };

  // center every model and scale it to the same size so switching feels even
  function makeDrawing(G) {
    var bb = new THREE.Box3(), tmpB = new THREE.Box3();
    G.forEach(function (g) { g.computeBoundingBox(); tmpB.copy(g.boundingBox); bb.union(tmpB); });
    var c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
    var k = 2.5 / Math.max(sz.x, sz.y, sz.z);
    G.forEach(function (g) { g.translate(-c.x, -c.y, -c.z); g.scale(k, k, k); });
    return new Drawing(G);
  }

  /* ---------- projects ---------- */
  var M = window.HeroModels || {};
  var PROJECTS = [
    { id: "vibe", title: "Vibe Laundry Gripper", build: M.vibe, yaw: 0.35, pitch: 0.22 },
    { id: "trace", title: "Digit on the Bus Rail Gripper", build: M.trace, yaw: 0.55, pitch: 0.3 },
    { id: "trace", key: "trace2", title: "Digit on the Bus Rail Gripper", build: M.trace2, yaw: 0.35, pitch: 0.18 },
    { id: "hrc", title: "Modular Humanoid Hand", build: M.hrc, cover: "assets/covers/hrc.webp", yaw: 0.38, pitch: 0.22 },
    { id: "lily", title: "LILY Water Quality Monitor", build: M.lily, cover: "assets/covers/lily.webp", yaw: 0.3, pitch: 0.45 },
    { id: "engine", title: "Little Blazer Engine", build: M.engine, cover: "assets/covers/engine.webp", yaw: 0.7, pitch: 0.45 },
    { id: "first", title: "FRC 9692 Robot", build: M.first, cover: "assets/covers/first.webp", yaw: 0.65, pitch: 0.16 }
  ];
  var start = PROJECTS.findIndex(function (p) { return p.id === "trace"; });

  /* ---------- three setup ---------- */
  var stage = root.querySelector(".viewer-stage");
  var canvas = document.createElement("canvas");
  canvas.className = "viewer-canvas";
  stage.appendChild(canvas);
  var img = document.createElement("img");
  img.className = "viewer-cover"; img.alt = ""; img.hidden = true;
  stage.appendChild(img);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene();
  var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -20, 20);
  var pivot = new THREE.Group(); scene.add(pivot);
  var current = null, idx = start, yaw = 0.7, pitch = 0.42, spin = reduce ? 0 : 0.22;
  var cache = {};

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    var a = w / h, s = 1.72;
    cam.left = -s * a; cam.right = s * a; cam.top = s; cam.bottom = -s;
    cam.updateProjectionMatrix();
  }

  var title = root.querySelector(".viewer-title"), count = root.querySelector(".viewer-count");
  function show(i) {
    idx = (i + PROJECTS.length) % PROJECTS.length;
    var p = PROJECTS[idx];
    count.textContent = String(idx + 1).padStart(2, "0") + " / " + String(PROJECTS.length).padStart(2, "0");
    title.textContent = p.title;
    stage.setAttribute("aria-label", "Open " + p.title);
    stage.classList.remove("in"); void stage.offsetWidth; stage.classList.add("in");
    if (current) pivot.remove(current.group);
    current = null;
    if (p.yaw !== undefined) { yaw = p.yaw; pitch = p.pitch; }
    if (p.build) {
      var key = p.key || p.id;
      if (!cache[key]) cache[key] = makeDrawing(p.build());
      current = cache[key]; pivot.add(current.group);
      canvas.hidden = false; img.hidden = true;
    } else {
      canvas.hidden = true; img.hidden = false; img.src = p.cover;
    }
  }

  var tmp = new THREE.Vector3(), tmpL = new THREE.Vector3(), res = new THREE.Vector2(), inv = new THREE.Matrix4();
  var last = performance.now(), visible = true;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!dragging) yaw += spin * dt;
    if (current && visible) {
      pivot.rotation.set(pitch, yaw, 0, "XYZ");
      pivot.updateMatrixWorld(true);
      renderer.getDrawingBufferSize(res);
      current.update(tmp, tmpL, res);
      renderer.render(scene, cam);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  var dragging = false, moved = 0, lx = 0, ly = 0;
  stage.addEventListener("pointerdown", function (e) { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy);
    yaw += dx * 0.01; pitch = Math.max(-0.2, Math.min(1.1, pitch + dy * 0.006));
    lx = e.clientX; ly = e.clientY;
  });
  function release() { dragging = false; }
  stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", release);
  stage.addEventListener("click", function () { if (moved < 6 && window.openProject) window.openProject(PROJECTS[idx].id); });
  stage.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (window.openProject) window.openProject(PROJECTS[idx].id); } });
  root.querySelector(".viewer-prev").addEventListener("click", function () { show(idx - 1); });
  root.querySelector(".viewer-next").addEventListener("click", function () { show(idx + 1); });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(stage);
  window.addEventListener("resize", resize);

  window.HeroViewer = { show: function (i) { show(i); }, pose: function (y, p) { yaw = y; pitch = p; spin = 0; } };
  resize(); show(idx); requestAnimationFrame(frame);
})();
