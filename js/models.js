/* Line drawing models for the hero viewer. Each returns a list of THREE geometries.
   Built from the project photos and CAD screenshots; proportions are estimated (see evidence.md). */
(function () {
  "use strict";
  var THREE = window.THREE;
  if (!THREE) return;

  /* ---------- helpers ---------- */
  function xf(g, o) {
    o = o || {};
    if (o.s) g.scale(o.s[0], o.s[1], o.s[2]);
    if (o.rx) g.rotateX(o.rx);
    if (o.ry) g.rotateY(o.ry);
    if (o.rz) g.rotateZ(o.rz);
    g.translate(o.x || 0, o.y || 0, o.z || 0);
    return g;
  }
  function box(w, h, d, o) { return xf(new THREE.BoxGeometry(w, h, d), o); }
  // cylinder along an axis: "x", "y" or "z"
  function cyl(r, len, axis, o, seg) {
    var g = new THREE.CylinderGeometry(r, r, len, seg || 36);
    if (axis === "x") g.rotateZ(Math.PI / 2); else if (axis === "z") g.rotateX(Math.PI / 2);
    return xf(g, o);
  }
  // hollow ring along an axis
  function ring(r0, r1, len, axis, o, seg) {
    var h = len / 2;
    var g = new THREE.LatheGeometry([new THREE.Vector2(r0, -h), new THREE.Vector2(r1, -h), new THREE.Vector2(r1, h), new THREE.Vector2(r0, h), new THREE.Vector2(r0, -h)], seg || 48);
    if (axis === "x") g.rotateZ(Math.PI / 2); else if (axis === "z") g.rotateX(Math.PI / 2);
    return xf(g, o);
  }
  function shape(pts) { var s = new THREE.Shape(); s.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]); s.closePath(); return s; }
  function path(pts) { var p = new THREE.Path(); p.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); p.closePath(); return p; }
  function circle(x, y, r) { var p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, false); return p; }
  // extrude a shape drawn in the x y plane, centered on z
  function slab(s, depth, o, curve) {
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false, curveSegments: curve || 20 });
    g.translate(0, 0, -depth / 2);
    return xf(g, o);
  }

  /* ---------- Vibe laundry gripper ---------- */
  // Photos: black mount cup, D shaped lattice palm in tan, two black Fin Ray jaws, one with a TPU comb.
  function vibe() {
    var G = [];
    // mount cup and the round back plate
    G.push(ring(0.78, 0.95, 1.9, "x", { x: -2.35 }));
    G.push(cyl(1.45, 0.14, "x", { x: -1.38 }, 48));
    // D shaped palm: flat face toward the jaws, round back, lattice cut through
    var d = new THREE.Shape();
    d.moveTo(0.55, -1.15); d.lineTo(0.55, 1.15); d.lineTo(-0.4, 1.15);
    d.absarc(-0.4, 0, 1.15, Math.PI / 2, Math.PI * 1.5, false); d.lineTo(0.55, -1.15);
    [[-0.95, 0.35, -0.55, 0.75, -0.25, 0.25], [-0.15, 0.85, 0.35, 0.85, 0.05, 0.35], [-0.2, -0.05, 0.3, 0.2, 0.3, -0.35],
     [-1.05, -0.25, -0.45, -0.1, -0.7, -0.7], [-0.25, -0.6, 0.3, -0.75, -0.05, -0.95], [-0.45, 0.45, -0.1, 0.05, -0.55, 0.05]]
      .forEach(function (t) { d.holes.push(path(t)); });
    G.push(slab(d, 1.5, { z: 0 }, 32));
    // jaws: tapered Fin Ray beams with open cells, upper jaw carries the comb
    function jaw(m) {
      var s = shape([0.55, 0.15, 0.55, 0.95, 3.5, 0.35, 3.65, 0.12]);
      if (m < 0) s = shape([0.55, -0.15, 3.65, -0.12, 3.5, -0.35, 0.55, -0.95]);
      for (var k = 0; k < 5; k++) {
        var x0 = 0.9 + k * 0.5, x1 = x0 + 0.3;
        function top(x) { return 0.95 + (0.35 - 0.95) * (x - 0.55) / 2.95; }
        var a = 0.24, b0 = top(x0) - 0.12, b1 = top(x1) - 0.12;
        if (b1 - a < 0.08) continue;
        var q = m > 0 ? [x0, a, x1, a, x1, b1, x0, b0] : [x0, -a, x0, -b0, x1, -b1, x1, -a];
        s.holes.push(path(q));
      }
      return slab(s, 1.0, {});
    }
    // jaws open slightly, the comb rides on the upper jaw
    var up = jaw(1), lo = jaw(-1);
    up.rotateZ(0.13); lo.rotateZ(-0.13);
    G.push(up, lo);
    for (var t = 0; t < 15; t++) G.push(box(0.05, 0.22, 0.8, { x: 0.8 + t * 0.18, y: 0.04, rz: 0 }).rotateZ(0.13));
    // stand it up, jaws pointing up like the TRACE gripper
    G.forEach(function (g) { g.rotateZ(Math.PI / 2); });
    return G;
  }

  /* ---------- Modular humanoid hand ---------- */
  // From the SolidWorks hand assembly: back palm plate, four fingers of three linked plates on pins,
  // four Actuonix linear actuators on the palm, a servo plate with four MG90S servos, a tapered lower
  // palm, and a thumb of stacked link bars swung out to the left.
  function rrect(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function hand() {
    var G = [];
    // back palm plate with a rounded boss on the thumb side
    var palm = new THREE.Shape();
    palm.moveTo(-1.55, -0.9); palm.lineTo(1.6, -0.9); palm.lineTo(1.6, 2.35); palm.lineTo(-1.25, 2.35);
    palm.quadraticCurveTo(-1.85, 2.2, -1.85, 1.6); palm.lineTo(-1.85, 0.2); palm.lineTo(-1.55, -0.9);
    palm.holes.push(circle(-1.45, 1.55, 0.14));
    G.push(slab(palm, 0.22, { z: -0.35 }, 16));
    G.push(cyl(0.3, 0.36, "z", { x: -1.45, y: 1.55, z: -0.1 }, 28));
    // four linear actuators standing on the palm, rod ends up into the fingers
    var FX = [-0.9, -0.3, 0.3, 0.9];
    FX.forEach(function (x) {
      G.push(box(0.52, 1.55, 0.5, { x: x, y: 0.75, z: 0.05 }));
      G.push(box(0.52, 0.12, 0.54, { x: x, y: 1.0, z: 0.05 }));
      G.push(cyl(0.05, 0.5, "y", { x: x, y: 1.78, z: 0.05 }, 12));
    });
    // fingers: three linked plates per finger, pins through each joint, a drive link beside each phalanx
    FX.forEach(function (x, i) {
      var y = 2.35, z = 0.0, ang = 0;
      var L = [0.95, 0.85, 1.15], curl = [0.04, 0.08, 0.1];
      for (var j = 0; j < 3; j++) {
        ang += curl[j] + i * 0.01;
        var len = L[j], cy = y + Math.cos(ang) * len / 2, cz = z + Math.sin(ang) * len / 2;
        var w = j === 2 ? 0.54 : 0.5;
        G.push(slab(rrect(w, len, j === 2 ? 0.2 : 0.12), 0.34, { rx: -Math.PI / 2 + Math.PI / 2, x: 0, y: 0, z: 0 }).rotateX(ang).translate(x, cy, cz));
        if (j < 2) G.push(slab(rrect(0.18, len * 0.95, 0.07), 0.08, {}).rotateZ(0.18).rotateX(ang).translate(x + 0.12, cy, cz + 0.22));
        G.push(cyl(0.09, 0.56, "x", { x: x, y: y, z: z }, 16));
        y += Math.cos(ang) * len; z += Math.sin(ang) * len;
      }
    });
    // servo plate below the actuators with four MG90S servos in two staggered rows
    G.push(box(2.5, 0.75, 0.16, { x: 0.25, y: -0.45, z: 0.22, rx: -0.12 }));
    [-0.6, 0.0, 0.6, 1.2].forEach(function (x, k) {
      G.push(box(0.46, 0.85, 0.42, { x: x - 0.1, y: -0.55 - (k % 2) * 0.12, z: 0.55 + (k % 2) * 0.28 }));
      G.push(box(0.62, 0.08, 0.42, { x: x - 0.1, y: -0.2 - (k % 2) * 0.12, z: 0.55 + (k % 2) * 0.28 }));
    });
    // tapered lower palm
    G.push(slab(shape([-1.0, -0.9, 1.4, -0.9, 0.9, -2.5, -0.4, -2.5]), 0.22, { z: -0.1 }));
    // thumb side wedge
    G.push(slab(shape([-1.55, -0.2, -1.55, -1.3, -2.4, -1.3]), 0.18, { z: -0.25 }));
    // thumb: two stacked link bars out to the left, a knuckle, and a raised tip
    G.push(slab(rrect(2.7, 0.32, 0.1), 0.22, {}).translate(-2.2, -1.45, -0.05));
    G.push(slab(rrect(2.5, 0.26, 0.08), 0.16, {}).translate(-2.1, -1.8, 0.15));
    G.push(box(0.9, 0.5, 0.42, { x: -1.6, y: -1.95, z: 0.0 }));
    [-1.3, -3.4].forEach(function (x) { G.push(cyl(0.1, 0.6, "z", { x: x, y: -1.6, z: 0.05 }, 16)); });
    G.push(slab(rrect(1.35, 0.4, 0.16), 0.28, {}).rotateZ(0.55).translate(-3.95, -1.05, 0.05));
    G.push(slab(rrect(0.8, 0.26, 0.1), 0.2, {}).rotateZ(0.55).translate(-3.35, -1.3, 0.2));
    return G;
  }

  /* ---------- LILY water quality monitor ---------- */
  // Onshape model: lily pad deck with a notch, solar panel, sensor box with antenna, floats and housings below.
  function lily() {
    var G = [];
    var pad = new THREE.Shape(), R = 3, n0 = -0.35, n1 = 0.05;
    pad.moveTo(0, 0);
    pad.absarc(0, 0, R, n1, Math.PI * 2 + n0, false);
    pad.lineTo(0, 0);
    G.push(slab(pad, 0.22, { rx: -Math.PI / 2, ry: 0.6 }, 64));
    // solar panel with its cell grid
    G.push(box(3.4, 0.12, 2.4, { y: 0.17, x: 0.3, z: -0.3, ry: 0.15 }));
    for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++)
      G.push(box(0.74, 0.04, 1.06, { ry: 0.15, x: 0.3 + Math.cos(0.15) * (-1.2 + i * 0.8) + Math.sin(0.15) * (-0.55 + j * 1.1), y: 0.25, z: -0.3 - Math.sin(0.15) * (-1.2 + i * 0.8) + Math.cos(0.15) * (-0.55 + j * 1.1) }));
    // sensor box and antenna
    G.push(box(0.9, 0.7, 0.75, { x: -1.5, y: 0.46, z: 0.9, ry: 0.4 }));
    G.push(box(0.05, 0.9, 0.05, { x: -1.5, y: 1.25, z: 0.9 }));
    // floats and housings under the deck
    [[-0.5, 0.4], [0.3, 0.9], [0.0, -0.3]].forEach(function (p) { G.push(cyl(0.45, 1.5, "y", { x: p[0], y: -0.86, z: p[1] }, 32)); });
    G.push(box(0.8, 1.0, 0.7, { x: -1.4, y: -0.62, z: -0.4 }));
    G.push(box(0.9, 1.1, 0.8, { x: 1.4, y: -0.66, z: 0.6 }));
    return G;
  }

  /* ---------- Little Blazer Engine ---------- */
  // NX assembly: base plate, fuel tank, frame with bearing, finned cylinder raked back, flywheel, cam disc.
  function engine() {
    var G = [];
    G.push(box(5.2, 0.28, 3.8, { y: 0 }));
    G.push(box(4.8, 0.14, 3.4, { y: 0.21 }));
    // fuel tank with neck and cap, plus feed pipe
    var tank = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.75, 0), new THREE.Vector2(0.75, 1.2), new THREE.Vector2(0.5, 1.45), new THREE.Vector2(0.5, 1.7), new THREE.Vector2(0.62, 1.7), new THREE.Vector2(0.62, 1.82), new THREE.Vector2(0, 1.82)], 40);
    G.push(xf(tank, { x: -1.4, y: 0.28, z: -0.5 }));
    G.push(cyl(0.12, 1.0, "x", { x: -0.6, y: 1.3, z: -0.5, rz: 0.5 }, 14));
    // frame: side profile with a round bearing head
    var fr = new THREE.Shape();
    fr.moveTo(-0.2, 0.28); fr.lineTo(1.9, 0.28); fr.lineTo(1.9, 0.9); fr.lineTo(1.5, 1.6);
    fr.absarc(1.15, 1.8, 0.55, -0.3, Math.PI * 0.9, false); fr.lineTo(0.2, 1.5); fr.lineTo(-0.2, 0.9); fr.lineTo(-0.2, 0.28);
    fr.holes.push(circle(1.15, 1.8, 0.2));
    G.push(slab(fr, 0.9, { z: 0.1 }, 28));
    // finned cylinder raked back from the bearing
    var a = 0.62, cx = 0.15, cy = 2.55;
    G.push(cyl(0.48, 1.6, "y", { rz: a, x: cx, y: cy, z: 0.1 }, 32));
    for (var f = 0; f < 8; f++) {
      var t = -0.65 + f * 0.18;
      G.push(cyl(0.78, 0.06, "y", { rz: a, x: cx - Math.sin(a) * t, y: cy + Math.cos(a) * t, z: 0.1 }, 36));
    }
    // crankshaft, flywheel with spokes, cam disc
    G.push(cyl(0.1, 3.0, "z", { x: 1.15, y: 1.8, z: 0.3 }, 16));
    G.push(ring(1.0, 1.25, 0.3, "z", { x: 1.15, y: 1.8, z: 1.55 }, 64));
    G.push(cyl(0.25, 0.4, "z", { x: 1.15, y: 1.8, z: 1.55 }, 24));
    for (var s = 0; s < 5; s++) { var sa = s * Math.PI * 2 / 5; G.push(box(0.75, 0.12, 0.14, { rz: sa, x: 1.15 + Math.cos(sa) * 0.62, y: 1.8 + Math.sin(sa) * 0.62, z: 1.55 })); }
    G.push(cyl(0.55, 0.12, "z", { x: 1.15, y: 1.8, z: -0.65 }, 40));
    return G;
  }

  /* ---------- FRC 9692 robot ---------- */
  // From the robot CAD: bumper frame, drive base, two curved side plates, shooter wheels on top,
  // a middle shaft, an intake roller with wheels at the front, the game ring, and an elevator tower at the back.
  function frc() {
    var G = [];
    // bumpers, split at one corner like the CAD
    G.push(box(5.8, 0.6, 0.55, { y: 0.3, z: 2.62 }), box(5.8, 0.6, 0.55, { y: 0.3, z: -2.62 }));
    G.push(box(0.55, 0.6, 4.7, { x: 2.62, y: 0.3 }), box(0.55, 0.6, 4.7, { x: -2.62, y: 0.3 }));
    // belly pan with corner cutouts for the swerve modules
    G.push(box(5.0, 0.18, 2.8, { y: 0.45 }), box(2.8, 0.18, 1.1, { y: 0.45, z: 1.95 }), box(2.8, 0.18, 1.1, { y: 0.45, z: -1.95 }));
    // four swerve modules: square top plate, steer and drive motors above, fork and wheel below the bumpers
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (c) {
      var x = c[0] * 1.92, z = c[1] * 1.92;
      G.push(box(0.95, 0.08, 0.95, { x: x, y: 0.5, z: z }));
      G.push(cyl(0.48, 0.1, "y", { x: x, y: 0.4, z: z }, 40));
      G.push(cyl(0.19, 0.62, "y", { x: x - c[0] * 0.24, y: 0.85, z: z + c[1] * 0.22 }, 28));
      G.push(cyl(0.19, 0.62, "y", { x: x + c[0] * 0.22, y: 0.85, z: z - c[1] * 0.24 }, 28));
      G.push(box(0.07, 0.75, 0.85, { x: x - 0.24, y: 0.05, z: z }), box(0.07, 0.75, 0.85, { x: x + 0.24, y: 0.05, z: z }));
      G.push(cyl(0.46, 0.34, "x", { x: x, y: -0.2, z: z }, 48));
      G.push(cyl(0.16, 0.56, "x", { x: x, y: -0.2, z: z }, 24));
    });
    // curved side plates: tall front lobe, concave front edge, sloped back
    var p = new THREE.Shape();
    p.moveTo(-2.0, 0.55); p.lineTo(1.3, 0.55); p.lineTo(1.9, 1.5); p.lineTo(1.3, 2.9);
    p.quadraticCurveTo(0.2, 3.5, -1.15, 3.45); p.quadraticCurveTo(-1.75, 3.4, -1.7, 2.8);
    p.quadraticCurveTo(-1.05, 2.0, -1.75, 1.3); p.quadraticCurveTo(-2.15, 0.95, -2.0, 0.55);
    [[-1.2, 3.0, 0.08], [0.6, 3.05, 0.08], [1.4, 2.4, 0.08], [1.55, 1.2, 0.08], [-1.5, 1.05, 0.08], [-0.2, 0.95, 0.08]].forEach(function (c) { p.holes.push(circle(c[0], c[1], c[2])); });
    p.holes.push(circle(-0.35, 1.95, 0.85));
    G.push(slab(p, 0.12, { z: 1.45 }, 24), slab(p, 0.12, { z: -1.45 }, 24));
    // shooter shaft with four wheels, middle shaft, intake shaft with five wheels
    G.push(cyl(0.06, 3.1, "z", { x: -0.9, y: 3.05 }, 12));
    [-0.9, -0.3, 0.3, 0.9].forEach(function (z) { G.push(cyl(0.42, 0.24, "z", { x: -0.9, y: 3.05, z: z }, 40)); });
    G.push(cyl(0.05, 3.1, "z", { x: -1.35, y: 1.95 }, 12));
    [-0.5, 0.5].forEach(function (z) { G.push(cyl(0.2, 0.3, "z", { x: -1.35, y: 1.95, z: z }, 24)); });
    G.push(cyl(0.05, 3.1, "z", { x: -1.85, y: 0.95 }, 12));
    [-1.0, -0.5, 0, 0.5, 1.0].forEach(function (z) { G.push(cyl(0.26, 0.22, "z", { x: -1.85, y: 0.95, z: z }, 28)); });
    // game ring held between the plates
    G.push(ring(0.62, 0.82, 0.22, "z", { x: -0.35, y: 1.95 }, 56));
    // elevator tower: two uprights, cross tubes, sprockets and a diagonal brace
    [-1.0, 1.0].forEach(function (z) {
      G.push(box(0.22, 3.2, 0.22, { x: 1.55, y: 2.15, z: z }));
      G.push(cyl(0.3, 0.08, "z", { x: 1.55, y: 3.65, z: z * 1.2 }, 32));
      G.push(box(0.12, 3.0, 0.1, { x: 0.7, y: 2.0, z: z * 1.28, rz: -0.55 }));
    });
    G.push(box(0.22, 0.22, 2.2, { x: 1.55, y: 3.55 }), box(0.22, 0.22, 2.2, { x: 1.55, y: 1.6 }));
    return G;
  }

  window.HeroModels = { hrc: hand, lily: lily, engine: engine, first: frc };
})();
