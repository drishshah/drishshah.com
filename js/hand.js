/* Modular humanoid hand, solid model from the SolidWorks assembly screenshot.
   Units: about 10 mm. x across the palm (thumb at -x), y up the fingers, z out of the palm. */
(function () {
  "use strict";
  var THREE = window.THREE;

  function xf(g, o) {
    o = o || {};
    if (o.rx) g.rotateX(o.rx);
    if (o.ry) g.rotateY(o.ry);
    if (o.rz) g.rotateZ(o.rz);
    g.translate(o.x || 0, o.y || 0, o.z || 0);
    return g;
  }
  function box(w, h, d, o) { return xf(new THREE.BoxGeometry(w, h, d), o); }
  function cyl(r, len, axis, o, seg) {
    var g = new THREE.CylinderGeometry(r, r, len, seg || 32);
    if (axis === "x") g.rotateZ(Math.PI / 2); else if (axis === "z") g.rotateX(Math.PI / 2);
    return xf(g, o);
  }
  function ext(shape, depth, o, curve) {
    var g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: curve || 16 });
    g.translate(0, 0, -depth / 2);
    return xf(g, o);
  }
  function poly(p) { var s = new THREE.Shape(); s.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) s.lineTo(p[i], p[i + 1]); s.closePath(); return s; }
  function hole(x, y, r) { var h = new THREE.Path(); h.absarc(x, y, r, 0, Math.PI * 2, true); return h; }
  // capsule standing on y: round ends centered at y = 0 and y = L
  function capsule(L, W, holes) {
    var r = W / 2, s = new THREE.Shape();
    s.moveTo(r, 0); s.lineTo(r, L); s.absarc(0, L, r, 0, Math.PI, false); s.lineTo(-r, 0); s.absarc(0, 0, r, Math.PI, Math.PI * 2, false);
    if (holes) { s.holes.push(hole(0, 0, r * 0.4)); s.holes.push(hole(0, L, r * 0.4)); }
    return s;
  }
  // bone: capsule with a pinched waist, the shape of the printed finger links
  function bone(L, W) {
    var r = W / 2, k = W * 0.32, s = new THREE.Shape();
    s.moveTo(r, 0);
    s.quadraticCurveTo(k, L / 2, r, L);
    s.absarc(0, L, r, 0, Math.PI, false);
    s.quadraticCurveTo(-k, L / 2, -r, 0);
    s.absarc(0, 0, r, Math.PI, Math.PI * 2, false);
    s.holes.push(hole(0, 0, r * 0.38)); s.holes.push(hole(0, L, r * 0.38));
    return s;
  }
  function rrect(w, h, rTop, rBot) {
    var s = new THREE.Shape(), x = -w / 2;
    s.moveTo(x + rBot, 0); s.lineTo(-x - rBot, 0); s.quadraticCurveTo(-x, 0, -x, rBot);
    s.lineTo(-x, h - rTop); s.quadraticCurveTo(-x, h, -x - rTop, h);
    s.lineTo(x + rTop, h); s.quadraticCurveTo(x, h, x, h - rTop);
    s.lineTo(x, rBot); s.quadraticCurveTo(x, 0, x + rBot, 0);
    return s;
  }
  // place a list of local geometries (joint at origin, segment along +y) at a joint with a bend
  function place(list, a, x, y, z) { list.forEach(function (g) { g.rotateX(a); g.translate(x, y, z); }); return list; }

  function hand() {
    var G = [];
    var FX = [-0.93, -0.31, 0.31, 0.93];

    /* palm frame: dark palm plate behind everything, wider on the thumb side with a rounded top and a boss */
    var pp = new THREE.Shape();
    pp.moveTo(-1.6, -0.75); pp.lineTo(1.3, -0.75); pp.lineTo(1.3, 1.8); pp.lineTo(-0.9, 1.8);
    pp.quadraticCurveTo(-1.05, 2.55, -1.35, 2.55); pp.quadraticCurveTo(-1.75, 2.5, -1.75, 2.0); pp.lineTo(-1.75, 0.2); pp.lineTo(-1.6, -0.75);
    pp.holes.push(hole(-1.35, 2.05, 0.12)); pp.holes.push(hole(-1.45, 1.6, 0.08));
    G.push(ext(pp, 0.3, { z: -0.42 }, 20));
    G.push(cyl(0.3, 0.16, "z", { x: -1.35, y: 2.05, z: -0.2 }, 32));
    G.push(box(2.7, 0.18, 0.75, { x: 0, y: -0.12, z: 0.0 }));                  // actuator clamp bar
    G.push(box(0.5, 0.35, 0.3, { x: -1.2, y: -0.38, z: 0.3 }));                // bracket at the thumb corner

    /* four Actuonix linear actuators */
    FX.forEach(function (x) {
      G.push(box(0.56, 1.75, 0.5, { x: x, y: 0.88, z: 0.08 }));
      G.push(box(0.6, 0.06, 0.54, { x: x, y: 1.25, z: 0.08 }));                // seam between the housing halves
      G.push(box(0.2, 0.12, 0.1, { x: x, y: 0.15, z: 0.36 }));                 // cable gland
      G.push(cyl(0.07, 0.35, "y", { x: x, y: 1.93, z: 0.08 }, 14));            // rod
      G.push(cyl(0.06, 0.4, "x", { x: x, y: 2.1, z: 0.08 }, 12));              // rod end pin
    });

    /* fingers: flat bone shaped links facing the palm side, a main link and a coupler link per phalanx,
       dark idler discs at the lower joints, pins through every joint, dark distal pad */
    var LS = [1.25, 1.15], L3 = 1.05;
    FX.forEach(function (x, f) {
      var y = 1.65, z = -0.15, tilt = -0.02 + f * 0.015;
      LS.forEach(function (L, j) {
        G.push(ext(bone(L, 0.44), 0.14, { rz: tilt, x: x - 0.06, y: y, z: z }));
        G.push(ext(bone(L * 0.96, 0.3), 0.1, { rz: tilt - 0.12, x: x + 0.16, y: y + 0.04, z: z + 0.13 }));
        G.push(cyl(0.24, 0.2, "z", { x: x + 0.28, y: y + 0.12, z: z + 0.02 }, 36));
        G.push(cyl(0.06, 0.42, "z", { x: x - 0.07, y: y, z: z + 0.05 }, 12));
        G.push(cyl(0.05, 0.36, "z", { x: x + 0.15, y: y + 0.04, z: z + 0.1 }, 12));
        y += L;
      });
      G.push(ext(rrect(0.5, L3, 0.2, 0.05), 0.3, { rz: tilt, x: x, y: y - 0.05, z: z + 0.02 }));
      G.push(ext(rrect(0.26, 0.4, 0.05, 0.05), 0.2, { x: x - 0.07, y: y - 0.25, z: z + 0.2 }));
      G.push(cyl(0.06, 0.48, "z", { x: x - 0.07, y: y, z: z + 0.08 }, 12));
    });

    /* servo plate on the palm front, tapering into the wrist, with four MG90S servos */
    G.push(ext(poly([-0.62, -0.05, 2.25, -0.05, 2.25, -1.25, 1.35, -2.75, 0.15, -2.75, -0.62, -1.4]), 0.14, { z: 0.45 }));
    [[-0.3, 0], [0.32, 1], [0.94, 0], [1.56, 1]].forEach(function (s) {
      var x = s[0], row = s[1], y = -0.95 - row * 0.12, z = 0.95 + row * 0.25;
      G.push(box(0.52, 1.2, 0.95, { x: x, y: y - 0.1, z: z }));                 // body
      G.push(box(0.5, 0.08, 1.25, { x: x, y: y + 0.36, z: z - 0.05 }));         // mounting ears
      G.push(box(0.5, 0.28, 0.3, { x: x, y: y + 0.62, z: z - 0.3 }));           // top tab above the plate
      G.push(cyl(0.09, 0.12, "y", { x: x, y: y + 0.56, z: z + 0.25 }, 16));     // output spline
    });

    /* thumb: flat wedge on the side, actuator housing below, two wide parallel link bars, knuckle link and dark pad */
    G.push(ext(poly([-1.45, 1.05, -1.25, -1.55, -2.0, -0.75]), 0.1, { z: -0.3 }));
    G.push(box(1.6, 0.5, 0.75, { x: -1.05, y: -2.1, z: 0.1 }));
    G.push(box(1.45, 0.16, 0.8, { x: -1.0, y: -1.78, z: 0.1 }));
    G.push(ext(capsule(1.95, 0.4, true), 0.22, { rz: Math.PI / 2 - 0.08, x: -0.4, y: -1.3, z: 0.2 }));
    G.push(ext(capsule(1.85, 0.3, true), 0.16, { rz: Math.PI / 2 - 0.08, x: -0.45, y: -1.62, z: 0.45 }));
    [[-0.4, -1.3, 0.2], [-2.34, -1.14, 0.2], [-2.29, -1.47, 0.45], [-0.45, -1.62, 0.45]].forEach(function (p) { G.push(cyl(0.09, 0.62, "z", { x: p[0], y: p[1], z: p[2] }, 16)); });
    var kn = poly([-2.15, -1.55, -2.75, -1.6, -3.3, -0.85, -2.95, -0.6]);
    kn.holes.push(hole(-2.45, -1.3, 0.08)); kn.holes.push(hole(-3.05, -0.85, 0.08));
    G.push(ext(kn, 0.2, { z: 0.3 }));
    G.push(ext(rrect(0.46, 1.2, 0.22, 0.06), 0.3, { rz: 1.0, x: -3.0, y: -0.85, z: 0.3 }));
    return G;
  }

  window.HeroModels = window.HeroModels || {};
  window.HeroModels.hrc = hand;
})();
