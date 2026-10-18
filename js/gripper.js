/* Rotating ASCII render of the TRACE Lab rail gripper (Digit on the Bus).
   Signed distance model built from the SolidWorks views: two carbon truss side
   plates with chamfered tops, base plate, slotted end plates, bearing bosses,
   cross shaft, 32 tooth gear, DM-J4310 motor can, and two Fin Ray fingers.
   Raymarched per character, shaded, then outlined where depth jumps. */
(function (root) {
  "use strict";

  var RAMP = " .'`,:;-~=+*xoX#%@";
  var FAR = 1e9;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function len2(x, y) { return Math.sqrt(x * x + y * y); }
  function len3(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }

  function sdBox(px, py, pz, bx, by, bz) {
    var qx = Math.abs(px) - bx, qy = Math.abs(py) - by, qz = Math.abs(pz) - bz;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0);
  }
  function sdBox2(px, py, bx, by) {
    var qx = Math.abs(px) - bx, qy = Math.abs(py) - by;
    return len2(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
  }
  // signed distance to the line through a,b (positive on the right of a->b)
  function side(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l = len2(dx, dy);
    return ((px - ax) * dy - (py - ay) * dx) / l;
  }
  // triangle as max of half planes (conservative, fine for marching); clockwise vertices
  function tri(px, py, ax, ay, bx, by, cx, cy) {
    var o = ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) > 0 ? 1 : -1;
    return Math.max(o * side(px, py, ax, ay, bx, by), Math.max(o * side(px, py, bx, by, cx, cy), o * side(px, py, cx, cy, ax, ay)));
  }

  /* ---------- body ---------- */
  var PX = 0.92, PY0 = -0.44, PY1 = 0.44, PZ = 0.40, PT = 0.035;
  // screw positions on each side plate (x mirrored)
  var BOLTS = [0.86, -0.39, 0.86, 0.10, 0.55, -0.39, 0.20, -0.39, 0.60, 0.40, 0.20, 0.40];

  // hexagon side profile: vertical sides, chamfered top corners
  function profile(x, y) {
    var d = sdBox2(x, y, PX, PY1);
    return Math.max(d, (Math.abs(x) + y - 1.06) * 0.7071);
  }

  // truss windows cut through each side plate
  function windows(x, y) {
    var w = FAR;
    // big triangles toward the ends
    w = Math.min(w, tri(Math.abs(x), y, 0.58, 0.30, 0.80, 0.08, 0.58, 0.08));
    w = Math.min(w, tri(Math.abs(x), y, 0.62, -0.02, 0.82, -0.02, 0.62, -0.34));
    // center column of opposed triangles
    w = Math.min(w, tri(Math.abs(x), y, 0.06, 0.32, 0.46, 0.32, 0.06, 0.10));
    w = Math.min(w, tri(Math.abs(x), y, 0.10, -0.36, 0.48, -0.36, 0.48, -0.10));
    // diagonal slots
    var sx = Math.abs(x) - 0.5, sy = y + 0.02;
    var c = 0.7071, rx = sx * c - sy * c, ry = sx * c + sy * c;
    w = Math.min(w, sdBox2(rx, ry, 0.03, 0.17));
    // window round the bearing boss
    w = Math.min(w, len2(Math.abs(x) - 0.30, y + 0.06) - 0.13);
    return w;
  }

  function plates(px, py, pz) {
    var d2 = Math.max(profile(px, py), -(windows(px, py) - 0.0));
    var plate = Math.max(d2, Math.abs(Math.abs(pz) - PZ) - PT);
    // bearing bosses, slightly proud of the plate
    var boss = Math.max(len2(Math.abs(px) - 0.30, py + 0.06) - 0.085, Math.abs(Math.abs(pz) - PZ) - 0.07);
    var d = Math.min(plate, boss);
    // socket head screws round the plate edge
    var fz = Math.abs(Math.abs(pz) - PZ);
    if (fz < 0.09) {
      var ax = Math.abs(px), b = FAR;
      for (var k = 0; k < BOLTS.length; k += 2) b = Math.min(b, len2(ax - BOLTS[k], py - BOLTS[k + 1]));
      var head = Math.max(b - 0.032, fz - (PT + 0.018));
      head = Math.max(head, -Math.max(b - 0.012, (PT + 0.018) - fz - 0.008));
      d = Math.min(d, head);
    }
    return d;
  }

  function frame(px, py, pz) {
    var d = plates(px, py, pz);
    // base plate
    d = Math.min(d, sdBox(px, py - (PY0 - 0.03), pz, PX + 0.05, 0.03, PZ + 0.06));
    // end plates with a vertical slot
    var ex = Math.abs(px) - (PX - 0.03);
    var end = Math.max(sdBox(ex, py - 0.0, pz, 0.03, 0.38, PZ - 0.02), (Math.abs(px) + py - 1.06) * 0.7071);
    var slot = sdBox2(py + 0.02, pz, 0.24, 0.045) - 0.02;
    d = Math.min(d, Math.max(end, -slot));
    return d;
  }

  /* ---------- drive ---------- */
  // DM-J4310 sits on the back plate, axis through the frame (z), offset toward one end
  var MX = 0.42, MY = -0.02, MR = 0.37, MZ0 = -0.455, MZ1 = -0.95;
  var HC = [], HS = [];
  for (var hk = 0; hk < 6; hk++) { HC.push(Math.cos(hk * 1.0472 + 0.26)); HS.push(Math.sin(hk * 1.0472 + 0.26)); }

  function motor(px, py, pz) {
    var x = px - MX, y = py - MY, r = len2(x, y);
    var zc = (MZ0 + MZ1) * 0.5, zh = (MZ0 - MZ1) * 0.5;
    // can with a chamfered back edge
    var can = Math.max(r - MR, Math.abs(pz - zc) - zh);
    can = Math.max(can, ((r - MR) + (MZ1 - pz)) * 0.7071 + 0.03);
    // mounting flange against the plate
    can = Math.min(can, Math.max(r - (MR + 0.025), Math.abs(pz - (MZ0 - 0.015)) - 0.015));
    // seam between housing halves and a shallow label band
    can = Math.max(can, -Math.max(Math.abs(pz + 0.70) - 0.006, (MR - 0.012) - r));
    // back face: six screw holes, ring groove, raised center boss
    var bz = pz - MZ1;
    if (Math.abs(bz) < 0.06 && Math.abs(r - 0.27) < 0.08) {
      var holes = FAR;
      for (var k = 0; k < 6; k++) {
        var a = k * 1.0472 + 0.26;
        holes = Math.min(holes, len2(x - 0.27 * HC[k], y - 0.27 * HS[k]) - 0.022);
      }
      can = Math.max(can, -Math.max(holes, Math.abs(bz) - 0.03));
    }
    can = Math.max(can, -Math.max(Math.abs(r - 0.17) - 0.01, Math.abs(bz) - 0.012));
    var boss = Math.max(r - 0.075, Math.abs(bz + 0.015) - 0.03);
    can = Math.min(can, boss);
    // connector housing on the rim, with two pin slots
    var cx = x - 0.20, cy = y - (MR - 0.02), cz = pz + 0.62;
    var conn = sdBox(cx, cy, cz, 0.075, 0.06, 0.09);
    conn = Math.max(conn, -sdBox(Math.abs(cx) - 0.03, cy - 0.06, cz, 0.018, 0.03, 0.06));
    return Math.min(can, conn);
  }

  function drive(px, py, pz) {
    var x = px - MX, y = py - MY, r = len2(x, y);
    // motor shaft through both plates
    var d = Math.max(r - 0.04, Math.abs(pz) - 0.47);
    // 32 tooth pinion between the plates
    var ang = Math.atan2(y, x);
    var tooth = 0.026 * clamp(Math.sin(ang * 32) * 4, -1, 1);
    var gear = Math.max(r - (0.25 + tooth), Math.abs(pz) - 0.07);
    gear = Math.max(gear, -Math.max(Math.abs(r - 0.15) - 0.035, Math.abs(pz) - 0.08));
    d = Math.min(d, gear);
    // racks above and below the pinion, one per finger carriage
    var tx = px - 0.06 * Math.floor(px / 0.06) - 0.03;
    var rTop = sdBox(px + 0.02, py - (MY + 0.32), pz, 0.78, 0.035, 0.06);
    rTop = Math.min(rTop, Math.max(sdBox(px + 0.02, py - (MY + 0.27), pz, 0.76, 0.02, 0.055), Math.abs(tx) - 0.013));
    var rBot = sdBox(px - 0.02, py - (MY - 0.32), pz, 0.78, 0.035, 0.06);
    rBot = Math.min(rBot, Math.max(sdBox(px - 0.02, py - (MY - 0.27), pz, 0.76, 0.02, 0.055), Math.abs(tx) - 0.013));
    d = Math.min(d, Math.min(rTop, rBot));
    // guide rod for the carriages, sticks out past the end plate
    d = Math.min(d, Math.max(len2(py - 0.20, pz) - 0.035, Math.abs(px + 0.12) - 0.98));
    return Math.min(d, motor(px, py, pz));
  }

  /* ---------- Fin Ray fingers ---------- */
  // left finger outline (clockwise): outer edge vertical then raked in, inner edge raked
  var F = [-0.80, 0.30, -0.80, 1.00, -0.63, 1.66, -0.55, 1.66, -0.07, 0.30];
  function finger(px, py, pz, mirror) {
    var x = mirror ? -px : px;
    // vertices run clockwise, so the inside is on the right of each edge
    var o = Math.max(
      Math.max(-side(x, py, F[0], F[1], F[2], F[3]), -side(x, py, F[2], F[3], F[4], F[5])),
      Math.max(Math.max(-side(x, py, F[4], F[5], F[6], F[7]), -side(x, py, F[6], F[7], F[8], F[9])), F[9] - py));
    var solid = Math.max(o, Math.abs(pz) - 0.13);
    // see through slots between the ribs, inset from the outline
    var period = 0.085;
    var m = py - period * Math.floor(py / period) - period * 0.5;
    var slot = Math.max(o + 0.055, Math.abs(m) - 0.025);
    slot = Math.max(slot, 0.50 - py);
    return Math.max(solid, -slot);
  }

  function scene(px, py, pz) {
    var d = FAR;
    // bounding boxes keep the march cheap
    if (sdBox(px, py - 0.0, pz, 1.0, 0.52, 0.5) < d) d = Math.min(d, frame(px, py, pz));
    if (sdBox(px + 0.12, py, pz + 0.25, 1.02, 0.46, 0.76) < d) d = Math.min(d, drive(px, py, pz));
    if (sdBox(px, py - 1.0, pz, 0.85, 0.72, 0.15) < d) {
      d = Math.min(d, finger(px, py, pz, false));
      d = Math.min(d, finger(px, py, pz, true));
    }
    return d;
  }

  // which part a surface point belongs to: 0 frame, 1 drive, 2 finger
  function material(px, py, pz) {
    var f = Math.min(finger(px, py, pz, false), finger(px, py, pz, true));
    var m = drive(px, py, pz), b = frame(px, py, pz);
    if (f <= m && f <= b) return 2;
    return m < b ? 1 : 0;
  }
  var TONE = [0.72, 0.88, 1.0];

  var CY = 0.31, BOUND = 1.75;
  var LX, LY, LZ;
  (function () { var x = -0.40, y = 0.50, z = 0.77, l = len3(x, y, z); LX = x / l; LY = y / l; LZ = z / l; })();

  var depth = null, lumBuf = null;

  // r0..r1 picks a band of rows so several workers can share a frame
  function render(cols, rows, angle, tilt, r0, r1) {
    if (r0 === undefined) { r0 = 0; r1 = rows; }
    var m0 = Math.max(0, r0 - 1), m1 = Math.min(rows, r1 + 1);
    var ca = Math.cos(angle), sa = Math.sin(angle);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var camDist = 3.55, fov = 0.5;
    var aspect = (rows * 2.05) / cols;
    var n = cols * rows;
    if (!depth || depth.length !== n) { depth = new Float32Array(n); lumBuf = new Float32Array(n); }
    var eps = 0.003;

    for (var j = m0; j < m1; j++) {
      var v = (1 - (j + 0.5) / rows * 2) * aspect;
      for (var i = 0; i < cols; i++) {
        var idx = j * cols + i;
        var u = (i + 0.5) / cols * 2 - 1;
        var dx = u * fov, dy = v * fov, dz = -1;
        var dl = len3(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        // camera orbit: tilt about x, spin about y
        var oy1 = camDist * st, oz1 = camDist * ct;
        var dy1 = dy * ct + dz * st, dz1 = -dy * st + dz * ct;
        var rx = -oz1 * sa, rz = oz1 * ca, ry = oy1 + CY;
        var qx = dx * ca - dz1 * sa, qz = dx * sa + dz1 * ca, qy = dy1;

        var bx = rx, by = ry - CY, bz = rz;
        var b = bx * qx + by * qy + bz * qz;
        var c = bx * bx + by * by + bz * bz - BOUND * BOUND;
        var h = b * b - c;
        depth[idx] = FAR; lumBuf[idx] = -1;
        if (h < 0) continue;
        var t = Math.max(-b - Math.sqrt(h), 0), tMax = -b + Math.sqrt(h);
        var hit = false, px = 0, py = 0, pz = 0;
        for (var s = 0; s < 90 && t < tMax; s++) {
          px = rx + qx * t; py = ry + qy * t; pz = rz + qz * t;
          var d = scene(px, py, pz);
          if (d < 0.002) { hit = true; break; }
          t += d * 0.9;
        }
        if (!hit) continue;
        var a1 = scene(px + eps, py - eps, pz - eps);
        var a2 = scene(px - eps, py - eps, pz + eps);
        var a3 = scene(px - eps, py + eps, pz - eps);
        var a4 = scene(px + eps, py + eps, pz + eps);
        var nx = a1 - a2 - a3 + a4, ny = -a1 - a2 + a3 + a4, nz = -a1 + a2 - a3 + a4;
        var nl = len3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        // object normal to camera space
        var wx = nx * ca + nz * sa, wz = -nx * sa + nz * ca;
        var wy = ny * ct - wz * st, wz2 = ny * st + wz * ct;
        var ndl = wx * LX + wy * LY + wz2 * LZ;
        var half = ndl * 0.5 + 0.5;
        depth[idx] = t;
        var mat = material(px, py, pz);
        var lum = (0.06 + 0.94 * Math.pow(half, 1.7)) * TONE[mat];
        // carbon twill weave on the frame
        if (mat === 0) lum *= (Math.sin((px + py + pz) * 55) * Math.sin((px - py) * 55) > 0) ? 1.0 : 0.86;
        lumBuf[idx] = clamp(lum, 0, 1);
      }
    }

    // compose: shade, then outline silhouettes and depth steps
    var out = [], nR = RAMP.length - 1;
    for (j = r0; j < r1; j++) {
      var line = "";
      for (i = 0; i < cols; i++) {
        idx = j * cols + i;
        var L = lumBuf[idx];
        if (L < 0) { line += " "; continue; }
        var dc = depth[idx];
        var dL = i > 0 ? depth[idx - 1] : FAR, dR = i < cols - 1 ? depth[idx + 1] : FAR;
        var dU = j > 0 ? depth[idx - cols] : FAR, dD = j < rows - 1 ? depth[idx + cols] : FAR;
        var thr = 0.24;
        var hx = (dL - dc > thr) || (dR - dc > thr);
        var hy = (dU - dc > thr) || (dD - dc > thr);
        if (hx || hy) {
          var gx = Math.min(dR, 9) - Math.min(dL, 9), gy = Math.min(dD, 9) - Math.min(dU, 9);
          var ch;
          if (hx && !hy) ch = "|";
          else if (hy && !hx) ch = (dU - dc > thr) ? "¯" : "_";
          else ch = (gx * gy > 0) ? "\\" : "/";
          line += ch;
          continue;
        }
        line += RAMP.charAt(1 + Math.round(L * (nR - 1)));
      }
      out.push(line);
    }
    return out.join("\n");
  }

  root.GripperASCII = { render: render, scene: scene };
  if (typeof module !== "undefined") module.exports = root.GripperASCII;
})(typeof window !== "undefined" ? window : this);
