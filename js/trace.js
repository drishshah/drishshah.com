/* TRACE Lab rail gripper (Digit on the Bus), the same model as the old rotating ASCII hero:
   every dimension below is copied from the signed distance model in gripper.js. */
(function () {
  "use strict";
  var THREE = window.THREE;
  function box(w, h, d, x, y, z) { var g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }
  function cylZ(r, z0, z1, x, y, seg) { var g = new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg || 40); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2); return g; }
  function cylX(r, x0, x1, y, z, seg) { var g = new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg || 28); g.rotateZ(Math.PI / 2); g.translate((x0 + x1) / 2, y, z); return g; }
  function poly(p) { var s = new THREE.Shape(); s.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) s.lineTo(p[i], p[i + 1]); s.closePath(); return s; }
  function path(p) { var h = new THREE.Path(); h.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) h.lineTo(p[i], p[i + 1]); h.closePath(); return h; }
  function circ(x, y, r) { var h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); return h; }
  function ext(shape, depth, z, curve) { var g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: curve || 24 }); g.translate(0, 0, z - depth / 2); return g; }
  function mirror(p, m) { var q = []; for (var i = 0; i < p.length; i += 2) q.push(p[i] * m, p[i + 1]); return q; }

  var PX = 0.92, PZ = 0.40, PT = 0.035;

  function buildTrace() {
    var G = [];

    /* side plates: hexagon with chamfered top corners and the truss windows, mirrored about x = 0 */
    var plate = poly([-PX, -0.44, PX, -0.44, PX, 0.14, 0.62, 0.44, -0.62, 0.44, -PX, 0.14]);
    [-1, 1].forEach(function (m) {
      [[0.58, 0.30, 0.80, 0.08, 0.58, 0.08],
       [0.62, -0.02, 0.82, -0.02, 0.62, -0.34],
       [0.06, 0.32, 0.46, 0.32, 0.06, 0.10],
       [0.10, -0.36, 0.48, -0.36, 0.48, -0.10]].forEach(function (t) { plate.holes.push(path(mirror(t, m))); });
      // diagonal slot centered at (0.5, -0.02), 0.34 long and 0.06 wide, along the 45 degree line
      var c = 0.7071, ux = c, uy = c, vx = -c, vy = c, L = 0.085, W = 0.03, cx = 0.53, cy = -0.02;
      plate.holes.push(path(mirror([cx - ux * L - vx * W, cy - uy * L - vy * W, cx + ux * L - vx * W, cy + uy * L - vy * W,
                                    cx + ux * L + vx * W, cy + uy * L + vy * W, cx - ux * L + vx * W, cy - uy * L + vy * W], m)));
      plate.holes.push(circ(0.30 * m, -0.06, 0.115));
    });
    G.push(ext(plate, PT * 2, PZ, 32), ext(plate, PT * 2, -PZ, 32));

    /* bearing bosses in the round windows, and socket head screws round the plate edge */
    var BOLTS = [0.86, -0.39, 0.86, 0.10, 0.55, -0.39, 0.20, -0.39, 0.60, 0.40, 0.20, 0.40];
    [-1, 1].forEach(function (sz) {
      [-1, 1].forEach(function (m) {
        G.push(cylZ(0.085, sz * (PZ - 0.07), sz * (PZ + 0.07), 0.30 * m, -0.06, 36));
        for (var k = 0; k < BOLTS.length; k += 2) G.push(cylZ(0.032, sz * (PZ + PT), sz * (PZ + PT + 0.018), BOLTS[k] * m, BOLTS[k + 1], 18));
      });
    });

    /* base plate */
    G.push(box((PX + 0.05) * 2, 0.06, (PZ + 0.06) * 2, 0, -0.47, 0));

    /* end plates, chamfered like the side plates, with a slot open at the top */
    [-1, 1].forEach(function (m) {
      var s = poly([-0.38, -0.38, 0.38, -0.38, 0.38, 0.17, -0.38, 0.17]);
      s.holes.push(path([-0.065, -0.24, 0.065, -0.24, 0.065, 0.12, -0.065, 0.12]));
      var g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
      g.translate(0, 0, -0.03); g.rotateY(Math.PI / 2); g.translate(m * (PX - 0.03), 0, 0);
      G.push(g);
    });

    /* DM-J4310 motor on the back plate, axis through the frame (z), offset toward one end */
    var MX = 0.42, MY = -0.02, MR = 0.37;
    G.push(cylZ(MR, -0.485, -0.95, MX, MY, 64));
    G.push(cylZ(MR + 0.025, -0.44, -0.47, MX, MY, 64));                 // flange against the plate
    G.push(cylZ(0.075, -0.95, -0.98, MX, MY, 28));                      // center boss on the back face
    G.push(box(0.15, 0.12, 0.18, MX + 0.20, MY + MR + 0.04, -0.62));    // connector housing on the rim
    G.push(cylZ(0.04, -0.47, 0.47, MX, MY, 20));                        // shaft through both plates
    // 32 tooth pinion between the plates
    var gear = new THREE.Shape();
    for (var i = 0; i <= 256; i++) {
      var a = i / 256 * Math.PI * 2, r = 0.25 + 0.026 * Math.max(-1, Math.min(1, Math.sin(a * 32) * 4));
      if (i === 0) gear.moveTo(r * Math.cos(a), r * Math.sin(a)); else gear.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    gear.holes.push(circ(0, 0, 0.04));
    var gg = ext(gear, 0.14, 0, 8); gg.translate(MX, MY, 0); G.push(gg);
    // racks above and below the pinion, one per finger carriage
    G.push(box(1.56, 0.07, 0.12, -0.02, MY + 0.32, 0), box(1.56, 0.07, 0.12, 0.02, MY - 0.32, 0));
    // guide rod for the carriages, sticking out past the end plate
    G.push(cylX(0.035, -1.10, 0.86, 0.20, 0, 24));

    /* Fin Ray fingers: vertical outer edge then raked in, raked inner edge, see through rib slots */
    var F = [-0.80, 0.30, -0.80, 1.00, -0.63, 1.66, -0.55, 1.66, -0.07, 0.30];
    function xL(y) { return y <= 1.0 ? -0.80 + 0.055 : -0.80 + (y - 1.0) * (0.17 / 0.66) + 0.0568; }
    function xR(y) { return -0.07 - (y - 0.30) * (0.48 / 1.36) - 0.0583; }
    [-1, 1].forEach(function (m) {
      var pts = mirror(F, m);
      if (m > 0) { var r = []; for (var j = pts.length - 2; j >= 0; j -= 2) r.push(pts[j], pts[j + 1]); pts = r; }
      var s = poly(pts);
      for (var k = 0; k < 12; k++) {
        var y0 = 0.52 + k * 0.13, y1 = y0 + 0.07;
        if (y1 > 1.66 - 0.055) break;
        var a0 = xL(y0), a1 = xL(y1), b0 = xR(y0), b1 = xR(y1);
        if (b0 - a0 < 0.02 || b1 - a1 < 0.02) break;
        var q = mirror([a0, y0, b0, y0, b1, y1, a1, y1], m);
        if (m > 0) q = [q[2], q[3], q[0], q[1], q[6], q[7], q[4], q[5]];
        s.holes.push(path(q));
      }
      G.push(ext(s, 0.26, 0));
    });
    return G;
  }


  /* Second TRACE gripper, from the photo of the print: long tapered rail, motor hanging under the middle,
     flat spur gear between two white racks, white carriages with triangular side plates,
     and curved Fin Ray fingers whose straight inner faces meet in the middle. */
  function buildTrace2() {
    var G = [];
    // rail: deepest in the middle, tapering toward both ends
    G.push(ext(poly([-2.6, 0, 2.6, 0, 2.6, -0.22, 0.95, -0.6, -0.95, -0.6, -2.6, -0.22]), 0.55, 0));
    // motor under the middle, axis vertical
    function cylY(r, y0, y1, x, z, seg) { var g = new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), seg || 48); g.translate(x, (y0 + y1) / 2, z); return g; }
    G.push(cylY(0.6, -0.6, -1.55, 0, 0, 64), cylY(0.63, -1.15, -1.2, 0, 0, 64));
    // flat spur gear on top of the rail
    var gear = new THREE.Shape();
    for (var i = 0; i <= 288; i++) {
      var a = i / 288 * Math.PI * 2, r = 0.44 + 0.035 * Math.max(-1, Math.min(1, Math.sin(a * 36) * 4));
      if (i === 0) gear.moveTo(r * Math.cos(a), r * Math.sin(a)); else gear.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    gear.holes.push(circ(0, 0, 0.12));
    for (var h = 0; h < 4; h++) gear.holes.push(circ(Math.cos(h * Math.PI / 2 + 0.78) * 0.27, Math.sin(h * Math.PI / 2 + 0.78) * 0.27, 0.06));
    var gg = ext(gear, 0.16, 0, 8); gg.rotateX(Math.PI / 2); gg.translate(0, 0.2, 0); G.push(gg);
    // two white racks, one either side of the gear, each tied to the opposite carriage
    function rack(x0, x1, z, up) {
      var t = poly([x0, 0, x1, 0, x1, 0.12, x0, 0.12]);
      var g = ext(t, 0.1, 0); g.rotateX(-Math.PI / 2); g.translate(0, 0.14, z); G.push(g);
      for (var x = x0 + 0.05; x < x1 - 0.03; x += 0.1) G.push(box(0.045, 0.12, 0.06, x, 0.2, z - up * 0.08));
    }
    rack(-0.5, 1.7, 0.56, 1); rack(-1.7, 0.5, -0.56, -1);
    // front bracket over the rack, with a row of holes
    var br = poly([-1.0, 0, 0.6, 0, 0.6, 0.36, -1.0, 0.36]);
    for (var bx = -0.8; bx < 0.5; bx += 0.26) br.holes.push(circ(bx, 0.22, 0.04));
    G.push(ext(br, 0.08, 0.72).translate(0, -0.05, 0));
    // white carriages and the triangular side plates that hold each finger
    [-1, 1].forEach(function (m) {
      G.push(box(1.6, 0.1, 1.15, m * 1.0, 0.06, 0));
      var tri = poly(mirror([0.15, 0.11, 1.75, 0.11, 1.75, 0.3, 0.6, 1.45, 0.4, 1.45, 0.15, 1.2], m));
      if (m < 0) tri = poly(mirror([0.15, 0.11, 0.15, 1.2, 0.4, 1.45, 0.6, 1.45, 1.75, 0.3, 1.75, 0.11], m));
      [[0.5, 1.2], [1.4, 0.3], [0.6, 0.4], [1.0, 0.75], [0.35, 0.3]].forEach(function (c) { tri.holes.push(circ(c[0] * m, c[1], 0.05)); });
      G.push(ext(tri, 0.07, 0.37), ext(tri, 0.07, -0.37));
      [[0.5, 1.2], [1.4, 0.3]].forEach(function (c) { G.push(cylZ(0.07, -0.47, 0.47, c[0] * m, c[1], 20)); });
    });
    // curved Fin Ray fingers: straight inner face, arched outer face, slanted ribs
    var P0 = [1.25, 0.55], C = [1.3, 2.9], P1 = [0.18, 3.9], samples = [];
    for (var k = 0; k <= 60; k++) {
      var t = k / 60, u = 1 - t;
      samples.push([u * u * P0[0] + 2 * u * t * C[0] + t * t * P1[0], u * u * P0[1] + 2 * u * t * C[1] + t * t * P1[1]]);
    }
    function xOut(y) {
      for (var n = 1; n < samples.length; n++) if (samples[n][1] >= y) {
        var a = samples[n - 1], b = samples[n], f = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * f;
      }
      return P1[0];
    }
    function xIn(y) { return 0.12 - (y - 0.55) * 0.02; }
    [-1, 1].forEach(function (m) {
      var pts = [0.12, 0.55, P0[0], P0[1]];
      samples.forEach(function (q) { pts.push(q[0], q[1]); });
      pts.push(0.05, 3.88);
      var f = m > 0 ? poly(pts) : null;
      if (m < 0) { var rr = mirror(pts, -1), rv = []; for (var j = rr.length - 2; j >= 0; j -= 2) rv.push(rr[j], rr[j + 1]); f = poly(rv); }
      for (var y = 0.78; y < 3.3; y += 0.19) {
        var y0 = y, y1 = y + 0.1, rise = 0.16;
        var i0 = xIn(y0) + 0.1, i1 = xIn(y1) + 0.1, o0 = xOut(y0 + rise) - 0.11, o1 = xOut(y1 + rise) - 0.11;
        if (o0 - i0 < 0.12 || o1 - i1 < 0.12) break;
        var q = [i0, y0, o0, y0 + rise, o1, y1 + rise, i1, y1];
        if (m < 0) { var qm = mirror(q, -1); q = [qm[6], qm[7], qm[4], qm[5], qm[2], qm[3], qm[0], qm[1]]; }
        f.holes.push(path(q));
      }
      G.push(ext(f, 0.62, 0, 4));
    });
    return G;
  }

  window.HeroModels = window.HeroModels || {};
  window.HeroModels.trace = buildTrace;
  window.HeroModels.trace2 = buildTrace2;
})();
