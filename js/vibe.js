/* Vibe laundry gripper, built from Drish's line drawing: round motor with a bolted flange, link plate with two bosses,
   long rail with hooked ends, two carriages, and two ladder style Fin Ray fingers.
   Units: drawing pixels / 200, x across, y up from the motor base, z toward the viewer. */
(function () {
  "use strict";
  var THREE = window.THREE;
  function box(w, h, d, x, y, z) { var g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }
  function cylY(r, y0, y1, x, z, seg) { var g = new THREE.CylinderGeometry(r, r, y1 - y0, seg || 48); g.translate(x, (y0 + y1) / 2, z); return g; }
  function cylZ(r, z0, z1, x, y, seg) { var g = new THREE.CylinderGeometry(r, r, z1 - z0, seg || 20); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2); return g; }
  function poly(p) { var s = new THREE.Shape(); s.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) s.lineTo(p[i], p[i + 1]); s.closePath(); return s; }
  function path(p) { var h = new THREE.Path(); h.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) h.lineTo(p[i], p[i + 1]); h.closePath(); return h; }
  function circ(x, y, r) { var h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); return h; }
  function ext(s, d, z, curve) { var g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: curve || 20 }); g.translate(0, 0, z - d / 2); return g; }
  // horizontal plate: shape drawn in x,z (z toward viewer) then laid flat at height y0..y0+t
  function flat(s, t, y0) { var g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 20 }); g.rotateX(Math.PI / 2); g.translate(0, y0 + t, 0); return g; }

  function vibe() {
    var G = [];

    /* motor: plain can with a seam near the bottom, a connector window, bolted flange and raised ring on top */
    G.push(cylY(0.92, 0.2, 1.12, 0, 0, 72), cylY(0.93, 0, 0.2, 0, 0, 72));
    G.push(box(0.4, 0.18, 0.06, -0.55, 0.32, 0.74));
    var fl = new THREE.Shape(); fl.absarc(0, 0, 0.96, 0, Math.PI * 2, false);
    for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4 + 0.2; fl.holes.push(circ(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.06)); }
    G.push(flat(fl, 0.08, 1.12));
    G.push(cylY(0.52, 1.2, 1.3, 0, 0, 56), cylY(0.32, 1.3, 1.36, 0, 0, 40));

    /* link plate across the motor top with a boss at each end, and a strut from the left boss down to the flange */
    G.push(cylY(0.27, 1.42, 1.7, -1.25, 0.05, 40), cylY(0.27, 1.42, 1.7, 0.95, 0.05, 40));
    G.push(cylY(0.1, 1.7, 1.72, 0.95, 0.05, 20));
    var lp = poly([-1.25, -0.25, 0.95, -0.2, 0.95, 0.3, -1.25, 0.3]);
    G.push(flat(lp, 0.1, 1.42));
    var st = box(0.14, 0.75, 0.14, 0, 0, 0); st.rotateZ(0.75); st.translate(-0.92, 1.3, 0.05); G.push(st);

    /* rail: flat bar with hooked ends and a linear guide on top */
    G.push(box(5.1, 0.08, 0.5, 0, 1.72, 0));
    [-1, 1].forEach(function (m) {
      var hk = poly([0, 0, 0.12, 0, 0.12, 0.55, 0.06, 0.62, 0, 0.55]);
      var g = ext(hk, 0.32, 0); g.translate(m * 2.55 - 0.06, 1.68, 0); G.push(g);
      G.push(cylZ(0.04, -0.17, 0.17, m * 2.55, 2.12, 14));
    });
    G.push(box(4.6, 0.1, 0.24, 0, 1.81, 0));

    /* two carriages: lower block with front screws, top plate with holes */
    [-1, 1].forEach(function (m) {
      var cx = m * 1.12;
      G.push(box(1.45, 0.24, 0.62, cx, 1.98, 0));
      [-0.45, 0.45].forEach(function (dx) { G.push(cylZ(0.055, 0.31, 0.35, cx + dx, 1.98, 16)); });
      var tp = new THREE.Shape(); tp.moveTo(-0.79, -0.42); tp.lineTo(0.79, -0.42); tp.lineTo(0.79, 0.42); tp.lineTo(-0.79, 0.42); tp.closePath();
      [-0.55, -0.2, 0.2, 0.55].forEach(function (hx) { tp.holes.push(circ(hx, 0.15, 0.06)); });
      var g = flat(tp, 0.24, 2.1); g.translate(cx, 0, 0); G.push(g);
      [-0.45, 0.45].forEach(function (dx) { G.push(cylZ(0.06, 0.42, 0.46, cx + dx, 2.22, 16)); });
    });
    // center bar between the carriages with three holes
    var cb = poly([-0.5, -0.18, 0.5, -0.18, 0.5, 0.18, -0.5, 0.18]);
    [-0.3, 0, 0.3].forEach(function (hx) { cb.holes.push(circ(hx, 0, 0.055)); });
    G.push(flat(cb, 0.1, 1.86));

    /* ladder style Fin Ray fingers: slanted outer strap, near vertical inner face, six rungs, rounded tip with a slot */
    [-1, 1].forEach(function (m) {
      var ox0 = -1.55, ix0 = -0.33, ix1 = -0.12, ox1 = -0.48, yb = 2.34, yt = 5.35;
      function oX(y) { return ox0 + (ox1 - ox0) * (y - yb) / (yt - yb); }
      function iX(y) { return ix0 + (ix1 - ix0) * (y - yb) / (yt - yb); }
      var cx = m * -(ix1 + ox1) / 2, r = (ix1 - ox1) / 2, s;
      if (m > 0) { s = new THREE.Shape(); s.moveTo(-ox0, yb); s.lineTo(-ix0, yb); s.lineTo(-ix1, yt); s.absarc(cx, yt, r, Math.PI, 0, true); s.closePath(); }
      else { s = new THREE.Shape(); s.moveTo(ox0, yb); s.lineTo(ix0, yb); s.lineTo(ix1, yt); s.absarc(cx, yt, r, 0, Math.PI, false); s.closePath(); }
      // rung windows
      var rungs = [2.5, 2.95, 3.4, 3.85, 4.3, 4.75, 5.1];
      for (var j = 0; j < rungs.length - 1; j++) {
        var y0 = rungs[j] + 0.05, y1 = rungs[j + 1] - 0.05, ins = 0.13;
        var q = [oX(y0) + ins + 0.06, y0, iX(y0) - ins, y0, iX(y1) - ins, y1, oX(y1) + ins + 0.06, y1];
        if (q[2] - q[0] < 0.08 || q[4] - q[6] < 0.08) continue;
        if (m > 0) q = [-q[2], q[3], -q[0], q[1], -q[6], q[7], -q[4], q[5]];
        s.holes.push(path(q));
      }
      // slot in the rounded tip
      var sl = new THREE.Path(); sl.absarc(cx, yt, r * 0.45, 0, Math.PI, false); sl.lineTo(cx - r * 0.45, yt - 0.18); sl.absarc(cx, yt - 0.18, r * 0.45, Math.PI, Math.PI * 2, false); sl.closePath();
      s.holes.push(sl);
      G.push(ext(s, 0.34, 0, 24));
      // pins at the base corners
      G.push(cylZ(0.08, -0.22, 0.22, m * -(ox0 + 0.1), yb + 0.05, 18), cylZ(0.08, -0.22, 0.22, m * -(ix0 - 0.1), yb + 0.05, 18));
    });
    return G;
  }

  window.HeroModels = window.HeroModels || {};
  window.HeroModels.vibe = vibe;
})();
