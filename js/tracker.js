/* Home page: the stage-tracker run.
   One continuous, eased pass along the path. The leopard is drawn here (body + four
   articulated legs + tail) and its stride is driven by the distance it covers, so the
   legs cycle faster as it speeds up and gather into a stand as it arrives.
   Styles live in css/home.css. */
(function () {
  var wrap = document.getElementById("stagesTracker");
  if (!wrap) return;

  var svg    = wrap.querySelector(".stages-svg");
  var path   = wrap.querySelector(".zigzag-path");
  var marker = wrap.querySelector(".trail-marker");
  var glow   = wrap.querySelector(".trail-glow");
  var cat    = marker.querySelector(".trail-run");
  var paws   = Array.prototype.slice.call(wrap.querySelectorAll(".paw"));
  var stages = Array.prototype.slice.call(wrap.querySelectorAll(".stage"));

  var VB_W = 100, VB_H = 20;   // must match the stages svg viewBox
  var DURATION = 2300;         // ms — the whole sprint
  var DELAY = 200;             // ms — a beat before it starts
  var STRIDE = 2.7;            // body-lengths covered per full leg cycle (long, bounding strides)

  /* ---------- the leopard (Panthera pardus), drawn as one sleek outline ----------
     long low body, dipped back, prominent shoulders, tucked waist, powerful haunch,
     refined head, tapered legs, long tail with a curled tip, rosette spots.
     Everything is bent by one "spine" deformer so the silhouette flows as it runs. */
  var NS = "http://www.w3.org/2000/svg";
  var GROUND = 59;
  var SPOT = "rgba(14,10,6,.66)";

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || cat).appendChild(n);
    return n;
  }
  function rot(x, y, cx, cy, deg) {
    var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), dx = x - cx, dy = y - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  var OUTLINE = [
    [22,25],[27,18.5],[38,15.2],[50,17.6],[60,19.6],[72,17.4],[83,14.8],[94,14.4],[104,13.6],
    [111,11.8],[118,12.8],[124,16.2],[129.6,20.4],[131.4,23.6],[129.8,26.6],[125,28.8],[118,30.6],[111,31.2],
    [105,35],[99,40],[90,40.6],[78,38],[66,35.6],[54,35.4],[44,38],[36,39],[26,35.4],[21,30.5]
  ];
  var EAR = [[109.4,12.6],[111.6,4.4],[117.6,11.4]];
  var SPOTS = [
    [30,22,1.9],[36,19.5,2],[43,21,1.8],[33,27,2],[40,27.5,1.9],[29.5,31,1.5],
    [48,22,2],[54,25,1.9],[60,23,2],[66,22,2],[72,21,1.9],[78,24,2],[52,30,1.7],[64,29.5,1.8],[74,30,1.7],
    [86,20,2],[92,24,2],[98,20,1.9],[92,33,1.6],[100,26,1.6],[107,18.5,1.3],[112,16.5,1.2]
  ];
  var EYE = [118.8,18.8,1.5], NOSE = [130.2,23,1.6];

  cat.setAttribute("viewBox", "-10 -2 150 66");
  cat.innerHTML = "";
  var tail     = el("path", { fill: "none", stroke: "currentColor", "stroke-width": "4.2", "stroke-linecap": "round", "stroke-linejoin": "round" });
  var tailTip  = el("path", { fill: "none", stroke: SPOT, "stroke-width": "4.4", "stroke-linecap": "round" });
  var farLegs  = el("g", { fill: "currentColor", opacity: ".5" });
  var bodyPath = el("path", { fill: "currentColor", stroke: "currentColor", "stroke-width": ".6", "stroke-linejoin": "round" });
  var earPath  = el("path", { fill: "currentColor", stroke: "currentColor", "stroke-width": "2.4", "stroke-linejoin": "round" });
  var spotEls  = SPOTS.map(function (d) { return el("circle", { r: d[2], fill: SPOT }); });
  var eyeEl    = el("circle", { r: EYE[2], fill: SPOT });
  var noseEl   = el("circle", { r: NOSE[2], fill: SPOT });
  var nearLegs = el("g", { fill: "currentColor" });

  // hips carry the taper widths: [hip, knee, foot]
  var legs = [
    { g: farLegs,  hx: 40, hy: 31, cx: 38,  S: 27, lift: 15, off: 0.07, L: 19, W: [9, 5.6, 3.6], hind: true  },
    { g: farLegs,  hx: 90, hy: 31, cx: 96,  S: 25, lift: 17, off: 0.57, L: 19, W: [8, 5, 3.4],   hind: false },
    { g: nearLegs, hx: 36, hy: 31, cx: 34,  S: 27, lift: 15, off: 0.00, L: 19, W: [9, 5.6, 3.6], hind: true  },
    { g: nearLegs, hx: 94, hy: 31, cx: 100, S: 25, lift: 17, off: 0.50, L: 19, W: [8, 5, 3.4],   hind: false }
  ];
  legs.forEach(function (l) {
    l.a = el("path", {}, l.g); l.b = el("path", {}, l.g);
    l.k = el("circle", {}, l.g); l.h = el("circle", {}, l.g); l.f = el("ellipse", { rx: 4.3, ry: 2.4 }, l.g);
  });

  function taper(A, B, wa, wb) {
    var dx = B.x - A.x, dy = B.y - A.y, n = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / n, ny = dx / n;
    function P(p, w, s) { return (p.x + nx * w / 2 * s).toFixed(1) + "," + (p.y + ny * w / 2 * s).toFixed(1); }
    return "M" + P(A, wa, 1) + " L" + P(B, wb, 1) + " L" + P(B, wb, -1) + " L" + P(A, wa, -1) + "Z";
  }

  function smooth(u) { return u * u * (3 - 2 * u); }

  function foot(l, t, amp) {
    var STANCE = 0.40, x, y;
    if (t < STANCE) {                       // paw on the ground, sweeping back
      var u = t / STANCE;
      x = l.cx + l.S * (1 - 2 * u); y = GROUND;
    } else {                                // paw lifting and reaching forward
      var v = (t - STANCE) / (1 - STANCE);
      x = l.cx - l.S + 2 * l.S * smooth(v); y = GROUND - l.lift * Math.sin(Math.PI * v);
    }
    return { x: l.cx + amp * (x - l.cx), y: GROUND + amp * (y - GROUND) };
  }

  function drawLeg(l, phase, amp, hip) {
    var t = ((phase + l.off) % 1 + 1) % 1;
    var f = foot(l, t, amp);
    var hx = hip.x, hy = hip.y;
    var dx = f.x - hx, dy = f.y - hy;
    var raw = Math.sqrt(dx * dx + dy * dy) || 1;
    var d = Math.min(raw, 2 * l.L - 0.4);
    var ux = dx / raw, uy = dy / raw;
    var h = Math.sqrt(Math.max(0, l.L * l.L - (d / 2) * (d / 2)));
    var mx = hx + ux * d / 2, my = hy + uy * d / 2;
    var kx = mx + uy * h, ky = my - ux * h;
    var kx2 = mx - uy * h, ky2 = my + ux * h;
    if (kx2 < kx) { kx = kx2; ky = ky2; }                   // joint always points backwards
    var H = { x: hx, y: hy }, K = { x: kx, y: ky }, F = { x: hx + ux * d, y: hy + uy * d };
    l.a.setAttribute("d", taper(H, K, l.W[0], l.W[1]));
    l.b.setAttribute("d", taper(K, F, l.W[1], l.W[2]));
    l.h.setAttribute("cx", H.x.toFixed(1)); l.h.setAttribute("cy", H.y.toFixed(1)); l.h.setAttribute("r", (l.W[0] / 2).toFixed(1));
    l.k.setAttribute("cx", K.x.toFixed(1)); l.k.setAttribute("cy", K.y.toFixed(1)); l.k.setAttribute("r", (l.W[1] / 2).toFixed(1));
    l.f.setAttribute("cx", (F.x + 1.6).toFixed(1)); l.f.setAttribute("cy", (F.y - 0.6).toFixed(1));
  }

  // closed Catmull-Rom spline through points -> smooth cubic path
  function spline(pts) {
    var n = pts.length, d = "M" + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += " C" + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + "," + (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
           " " + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + "," + (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
           " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
    }
    return d + "Z";
  }

  function pose(phase, amp) {
    var a = 2 * Math.PI * phase;
    var bob   = -3.0 * amp * Math.sin(a + 0.6);             // whole body rises and falls
    var pitch =  2.4 * amp * Math.sin(a + 2.2);
    var flex  =  6.5 * amp * Math.sin(a + 0.9);             // spine gathers and extends
    var head  =  3.4 * amp * Math.sin(a + 2.6);
    var F = flex * 0.85;
    var neck = rot(104, 20, 76, 27, F);

    function T(x, y) {                                       // the spine deformer
      var r = rot(x, y, 50, 27, -flex), f = rot(x, y, 76, 27, F);
      var w = clamp((x - 50) / 26, 0, 1);
      var p = { x: r.x + (f.x - r.x) * w, y: r.y + (f.y - r.y) * w };
      var wh = clamp((x - 100) / 8, 0, 1);
      if (wh > 0) p = rot(p.x, p.y, neck.x, neck.y, head * wh);
      p = rot(p.x, p.y, 62, 28, pitch);
      p.y += bob;
      return p;
    }

    bodyPath.setAttribute("d", spline(OUTLINE.map(function (q) { return T(q[0], q[1]); })));
    earPath.setAttribute("d", "M" + EAR.map(function (q) { var p = T(q[0], q[1]); return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" L") + "Z");
    SPOTS.forEach(function (d, i) { var p = T(d[0], d[1]); spotEls[i].setAttribute("cx", p.x.toFixed(1)); spotEls[i].setAttribute("cy", p.y.toFixed(1)); });
    var pe = T(EYE[0], EYE[1]);   eyeEl.setAttribute("cx", pe.x.toFixed(1));  eyeEl.setAttribute("cy", pe.y.toFixed(1));
    var pn = T(NOSE[0], NOSE[1]); noseEl.setAttribute("cx", pn.x.toFixed(1)); noseEl.setAttribute("cy", pn.y.toFixed(1));

    legs.forEach(function (l) { drawLeg(l, phase, amp, T(l.hx, l.hy)); });

    var root = T(22, 26), w = 8 * amp * Math.sin(a - 0.9), rx = root.x, ry = root.y;
    tail.setAttribute("d",
      "M" + rx.toFixed(1) + "," + ry.toFixed(1) +
      " C" + (rx - 13).toFixed(1) + "," + (ry + 4 + w * 0.3).toFixed(1) +
      " " + (rx - 24).toFixed(1) + "," + (ry - 4 + w * 0.8).toFixed(1) +
      " " + (rx - 29).toFixed(1) + "," + (ry - 13 + w).toFixed(1) +
      " C" + (rx - 31).toFixed(1) + "," + (ry - 18 + w).toFixed(1) +
      " " + (rx - 26).toFixed(1) + "," + (ry - 22 + w * 1.1).toFixed(1) +
      " " + (rx - 21).toFixed(1) + "," + (ry - 19.5 + w * 1.1).toFixed(1));
    tailTip.setAttribute("d",
      "M" + (rx - 30.4).toFixed(1) + "," + (ry - 16 + w).toFixed(1) +
      " C" + (rx - 31).toFixed(1) + "," + (ry - 19 + w).toFixed(1) +
      " " + (rx - 26).toFixed(1) + "," + (ry - 22 + w * 1.1).toFixed(1) +
      " " + (rx - 21).toFixed(1) + "," + (ry - 19.5 + w * 1.1).toFixed(1));
  }
  pose(0, 0);

  /* ---------- the run ---------- */
  var total = path.getTotalLength();
  var pawX = paws.map(function (p) { return parseFloat(p.getAttribute("cx")); });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var done = false, angle = 0, started = false, phase = 0, lastX = null;

  // sprint profile: explosive launch, full speed through the zigzag, quick settle at the end
  var ACC = 0.14, DEC = 0.26, VMAX = 1 / (1 - ACC / 2 - DEC / 2), vNorm = 0;
  function profile(t) {
    if (t < ACC)       { vNorm = t / ACC;           return VMAX * t * t / (2 * ACC); }
    if (t < 1 - DEC)   { vNorm = 1;                 return VMAX * (ACC / 2 + (t - ACC)); }
    vNorm = (1 - t) / DEC;                          return 1 - VMAX * (1 - t) * (1 - t) / (2 * DEC);
  }

  function render(p, running) {
    var len = p * total;
    var pt  = path.getPointAtLength(len);
    var a   = path.getPointAtLength(Math.max(0, len - 0.6));
    var b   = path.getPointAtLength(Math.min(total, len + 0.6));

    var box = svg.getBoundingClientRect();
    var sx = box.width / VB_W, sy = box.height / VB_H;
    var x = pt.x * sx, y = pt.y * sy;

    // tilt with the slope of the path, softened so it never snaps
    var target = Math.atan2((b.y - a.y) * sy, (b.x - a.x) * sx) * 180 / Math.PI;
    target = Math.max(-16, Math.min(16, target * 3.2));   // lean into every rise and dip
    angle += (target - angle) * 0.22;

    // stride follows distance covered; legs gather into a stand at the very start and end
    if (running) {
      if (lastX !== null) phase += (x - lastX) / (marker.offsetWidth * STRIDE);
      lastX = x;
      pose(phase, smooth(clamp(vNorm * 1.5, 0, 1)));
    } else {
      pose(0, 0);
    }

    marker.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) translate(-50%,-100%) rotate(" + angle.toFixed(2) + "deg)";
    glow.style.transform   = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) translate(-50%,-50%)";

    if (!done) svg.style.clipPath = "inset(-30px " + (100 - pt.x).toFixed(2) + "% -30px 0)";

    for (var i = 0; i < paws.length; i++) {
      if (pt.x >= pawX[i] - 0.3) {
        paws[i].classList.add("on");
        if (stages[i]) stages[i].classList.add("on");
      }
    }
  }

  function finish() {
    done = true;
    wrap.classList.add("done");
    svg.style.clipPath = "";
    render(1, false);
  }

  function showStatic() {
    done = true;
    wrap.classList.add("done");
    paws.forEach(function (p) { p.classList.add("on"); });
    stages.forEach(function (s) { s.classList.add("on"); });
  }

  function play() {
    if (started) return;
    started = true;
    if (reduce) { showStatic(); return; }
    wrap.classList.add("running");
    render(0, false);
    var start = null;
    function frame(t) {
      if (start === null) start = t + DELAY;
      var raw = Math.max(0, Math.min(1, (t - start) / DURATION));
      render(profile(raw), true);
      if (raw < 1) requestAnimationFrame(frame); else finish();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", function () { if (done && !reduce) render(1, false); });

  if (!("IntersectionObserver" in window)) { play(); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { play(); io.unobserve(wrap); }
    });
  }, { threshold: 0.5 });
  io.observe(wrap);
})();