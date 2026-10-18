(function () {
  "use strict";

  /* ---------- project data ---------- */
  var P = "assets/photos/";
  var PROJECTS = {
    vibe: {
      tag: "Vibe Robotics", year: "2026", url: "https://www.viberobotics.co/",
      title: "Vibe 01 Grippers and Humanoid Hardware",
      hl: "Laundry handling gripper",
      what: "Grippers and end effectors for the Vibe 01 home humanoid, plus hardware across its drive system, chassis and actuation.",
      how: "Tuned TPU finger geometry and compliance for fabric. The fingers taper from palm to tip, relief windows shrink toward the tip, and grip features are printed into the finger surface. Benchmarked leading home robot hands and iterated through design reviews with the electrical and software teams.",
      results: "The gripper manipulates laundry effectively.",
      photos: [
        [P + "vibe/1.webp", "Soft gripper mounted on humanoid"],
        [P + "vibe/5.webp", "Printed fingers with built in grip"],
        [P + "vibe/2.webp", "Gripper prototype"],
        [P + "vibe/3.webp", "Gripper prototype with lattice palm"],
        [P + "vibe/4.webp", "Finger sketch"]
      ]
    },
    trace: {
      tag: "TRACE Lab, Purdue", year: "2025 to now", url: "https://thetracelab.com",
      title: "Digit on the Bus Rail Gripper",
      hl: "Humanoid rail grasping",
      what: "A rail grasping gripper that keeps Agility Robotics’ Digit humanoid anchored through 600 N vibration spikes during Digit on the Bus, a land based stand in for shipboard motion. The whole gripper fits a 150 x 150 x 120 mm volume budget.",
      how: "Made two versions with different closing mechanisms, both based on Fin Ray style TPU fingers sized for 32 to 38 mm rails. Modeled in SolidWorks around a DM-J4310 actuator and 32 tooth transmission, and ran FEA on the structure.",
      results: "Load tested under static rail engagement, with actuator motor wiring and control integrated. First testing on the bus starts soon, followed by trials aboard a naval ship in Norfolk, Virginia.",
      photos: [
        [P + "trace/2.webp", "Gripper with motor and gear"],
        [P + "trace/3.webp", "Fin Ray fingers"],
        [P + "trace/4.webp", "Fingers, side view"],
        [P + "trace/1.webp", "SolidWorks render"]
      ]
    },
    hrc: {
      tag: "Purdue Humanoid Robotics Club", year: "2025 to 2026",
      title: "Modular Humanoid Hand",
      hl: "One actuator per finger",
      what: "A modular hand for the club’s humanoid, built for manipulation in space conditions.",
      how: "Replaced string tendons with mechanical linkages so each finger runs on one actuator. Ran tolerance analysis for printed parts, fastener selection and the BOM, then assembled the hand and tested its range of motion.",
      results: "Presented with Distinction at the Purdue Office of Undergraduate Research Conference, 2025.",
      photos: [
        [P + "hrc/4.webp", "Printed hand prototype"],
        [P + "hrc/3.webp", "Finger driven by a linear actuator"],
        [P + "hrc/1.webp", "Hand CAD"],
        [P + "hrc/2.webp", "Research poster"]
      ]
    },
    origami: {
      tag: "Independent research", year: "2026",
      title: "Architected Origami Metamaterials",
      hl: "SES 2026 presenting author",
      what: "How tessellation geometry sets Poisson’s ratio in origami metamaterials, measured on physical samples rather than only simulated.",
      how: "Built a custom EV3 test rig with dual dynamometers, fabricated five tessellations and analyzed the deformation data in MATLAB.",
      results: "Measured Poisson’s ratios from −0.6 to +0.57 across five tessellations. Presenting author at the Society of Engineering Science Annual Meeting, October 2026.",
      photos: [
        [P + "origami/2.webp", "Poster presentation"],
        [P + "origami/1.webp", "Research poster"],
        [P + "origami/3.webp", "Tessellations and test rig"]
      ]
    },
    lily: {
      tag: "Purdue TECH 120", year: "2025",
      title: "LILY: Autonomous Water Quality Monitor",
      hl: "95% accuracy vs professional grade systems",
      what: "A floating monitor that replaces manual, cost intensive water quality field testing.",
      how: "Designed in Onshape across two prototypes, with a sealed, waterproof electronics enclosure and a Raspberry Pi logging temperature, ORP and TDS.",
      results: "Field validated on a frozen lake at 95% accuracy against professional grade systems priced from $219 to $499.",
      photos: [
        [P + "lily/3.webp", "Frozen lake field test with live readings"],
        [P + "lily/2.webp", "Prototype electronics"],
        [P + "lily/1.webp", "Onshape model"]
      ]
    },
    oasis: {
      tag: "Design project", year: "",
      title: "OASIS: Origami Aid Shelter",
      hl: "Sub 10 minute field setup",
      what: "A deployable origami shelter for compact transport and rapid setup in disaster response.",
      how: "Modeled crease mechanics and fold sequencing with CATIA V6 surface modeling, then rendered the deployed forms in Blender.",
      results: "Structural stability through a 1:2 height to base ratio and a sub 10 minute field setup.",
      photos: [
        [P + "oasis/1.webp", "Deployed shelter render"],
        [P + "oasis/3.webp", "Crease pattern sketch"],
        [P + "oasis/2.webp", "OASIS infographic"]
      ]
    },
    engine: {
      tag: "CAD project", year: "",
      title: "Little Blazer Engine",
      hl: "Interference free crank driven piston",
      what: "A single cylinder engine model for studying rotational to linear motion and motion sequencing.",
      how: "Full assembly in Siemens NX with constraint management, motion simulation, interference detection and tolerance stack validation across all moving parts.",
      results: "A fully constrained, interference free assembly with accurate crank driven piston translation.",
      photos: [
        [P + "engine/1.webp", "Siemens NX assembly"]
      ]
    },
    first: {
      tag: "FIRST Robotics", year: "2021 to 2025", url: "https://www.thebluealliance.com/team/9692",
      title: "FRC 9692 and FTC 20890",
      hl: "Engineering Inspiration and Inspire Awards",
      what: "Competition robots for intake, indexing, scoring and autonomous navigation under match constraints.",
      how: "Parametric CAD in SolidWorks and Onshape with tolerance analysis, 3D printing and precision machining, plus odometry based navigation in Python.",
      results: "Autonomous path accuracy within 1 to 2 inches. Led 26 member FRC and 12 member FTC teams from concept to competition.",
      photos: [
        [P + "first/3.webp", "With the 2024 Rookie All-Star Award and Finalist trophies, Hali\u00e7 Regional"],
        [P + "first/2.webp", "FRC 9692 robot"],
        [P + "first/1.webp", "FRC robot CAD"]
      ]
    }
  };

  /* ---------- ASCII gripper ---------- */
  function startGripper() {
    var pre = document.getElementById("gripper");
    if (!pre || !window.GripperASCII) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cols = 196, rows = 100;
    var angle = 0.45, tilt = 0.26, last = 0, running = true, visible = true;
    var dragging = false, dragX = 0, spin = 0.38;

    function size() {
      var narrow = pre.parentElement.clientWidth < 520;
      cols = narrow ? 120 : 196;
      rows = narrow ? 62 : 100;
      // without workers the main thread has to keep up, so drop the detail a step
      if (typeof workers !== "undefined" && !workers.length) { cols = narrow ? 96 : 140; rows = narrow ? 50 : 72; }
      var w = pre.parentElement.clientWidth;
      // monospace cell is about 0.6 of the font size wide
      var fs = Math.max(4, Math.min(11, w / (cols * 0.6)));
      pre.style.fontSize = fs.toFixed(2) + "px";
      pre.style.lineHeight = (fs * 1.18).toFixed(2) + "px";
    }
    // render in a worker when possible; fall back to the main thread
    // each frame is split into horizontal bands, one per worker
    var workers = [], busy = false, pending = false, frameId = 0, parts = [], got = 0;
    var nW = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
    function onBand(e) {
      var d = e.data;
      if (d.frame !== frameId) return;
      parts[d.band] = d.text;
      if (++got === workers.length) {
        pre.textContent = parts.join("\n");
        busy = false;
        if (pending) { pending = false; draw(); }
      }
    }
    try {
      for (var w = 0; w < nW; w++) {
        var wk = new Worker("js/gripper-worker.js");
        wk.onmessage = onBand;
        wk.onerror = function () { workers = []; busy = false; };
        workers.push(wk);
      }
    } catch (err) { workers = []; }

    function draw() {
      if (workers.length) {
        if (busy) { pending = true; return; }
        busy = true; frameId++; got = 0; parts = new Array(workers.length);
        var step = Math.ceil(rows / workers.length);
        for (var b = 0; b < workers.length; b++) {
          workers[b].postMessage({ frame: frameId, band: b, cols: cols, rows: rows, angle: angle, tilt: tilt,
            r0: b * step, r1: Math.min(rows, (b + 1) * step) });
        }
      } else {
        pre.textContent = window.GripperASCII.render(cols, rows, angle, tilt);
      }
    }
    function frame(ts) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = ts; return; }
      if (ts - last < (workers.length ? 50 : 90)) return;
      var dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
      last = ts;
      if (!dragging) angle += spin * dt;
      if (!busy) draw();
    }

    size();
    // first frame on the main thread so the hero is never empty
    pre.textContent = window.GripperASCII.render(cols, rows, angle, tilt);
    window.addEventListener("resize", function () { size(); draw(); });
    if (reduce) return;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(pre);
    }
    // drag to turn it by hand
    pre.addEventListener("pointerdown", function (e) { dragging = true; dragX = e.clientX; pre.setPointerCapture(e.pointerId); });
    pre.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      angle += (e.clientX - dragX) * 0.012; dragX = e.clientX; draw();
    });
    function release() { dragging = false; }
    pre.addEventListener("pointerup", release);
    pre.addEventListener("pointercancel", release);
    requestAnimationFrame(frame);
  }

  /* ---------- project layer ---------- */
  var layer, panel, lastFocus = null, current = null;

  function el(id) { return document.getElementById(id); }

  function showPhoto(i) {
    var p = PROJECTS[current];
    var ph = p.photos[i];
    el("layer-img").src = ph[0];
    el("layer-img").alt = ph[1];
    el("layer-cap").textContent = ph[1];
    var thumbs = el("layer-thumbs").children;
    for (var k = 0; k < thumbs.length; k++) thumbs[k].setAttribute("aria-current", k === i ? "true" : "false");
  }

  function openProject(id, fromHash) {
    var p = PROJECTS[id];
    if (!p) return;
    current = id;
    lastFocus = document.activeElement;
    var tagEl = el("layer-tag"); tagEl.textContent = "";
    var tagText = p.tag + (p.year ? " / " + p.year : "");
    if (p.url) { var a = document.createElement("a"); a.href = p.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = tagText; tagEl.appendChild(a); }
    else tagEl.textContent = tagText;
    el("layer-title").textContent = p.title;
    el("layer-hl").textContent = p.hl;
    el("layer-what").textContent = p.what;
    el("layer-how").textContent = p.how;
    el("layer-results").textContent = p.results;
    var thumbs = el("layer-thumbs");
    thumbs.innerHTML = "";
    p.photos.forEach(function (ph, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.setAttribute("aria-label", "Show photo: " + ph[1]);
      var im = document.createElement("img");
      im.src = ph[0]; im.alt = ""; im.loading = "lazy";
      b.appendChild(im);
      b.addEventListener("click", function () { showPhoto(i); });
      thumbs.appendChild(b);
    });
    thumbs.hidden = p.photos.length < 2;
    showPhoto(0);
    layer.hidden = false;
    document.documentElement.classList.add("layer-open");
    panel.scrollTop = 0;
    el("layer-close").focus();
    if (!fromHash) try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }

  function closeProject() {
    if (layer.hidden) return;
    layer.hidden = true;
    document.documentElement.classList.remove("layer-open");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    current = null;
  }

  function initLayer() {
    layer = el("layer");
    panel = el("layer-panel");
    document.querySelectorAll("[data-open]").forEach(function (b) {
      b.addEventListener("click", function () { openProject(b.getAttribute("data-open")); });
    });
    el("layer-close").addEventListener("click", closeProject);
    el("layer-backdrop").addEventListener("click", closeProject);
    document.addEventListener("keydown", function (e) {
      if (layer.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closeProject(); }
      if (e.key === "Tab") {
        // keep focus inside the open layer
        var f = panel.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    var h = (location.hash || "").replace("#", "");
    if (PROJECTS[h]) openProject(h, true);
  }

  /* ---------- copy email ---------- */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-copy");
        var done = function () {
          var old = b.textContent; b.textContent = "copied";
          setTimeout(function () { b.textContent = old; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  }

  /* ---------- typed ending on the internship line ---------- */
  function startTyping() {
    var el = document.getElementById("typed");
    if (!el) return;
    var words = (el.getAttribute("data-words") || "").split("|");
    if (words.length < 2) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var w = 0, n = words[0].length, deleting = true;
    function tick() {
      var word = words[w];
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; w = (w + 1) % words.length; n = 0; }
      } else {
        n++;
        if (n >= words[w].length) { el.textContent = words[w]; deleting = true; return setTimeout(tick, 1800); }
      }
      el.textContent = words[w].slice(0, Math.max(0, n));
      setTimeout(tick, deleting ? 45 : 85);
    }
    setTimeout(tick, 2200);
  }

  function init() { startGripper(); initLayer(); initCopy(); startTyping(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
