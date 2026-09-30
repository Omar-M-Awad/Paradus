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
  var DURATION = 2700;         // ms — the whole run
  var DELAY = 250;             // ms — a beat before it starts
  var STRIDE = 2.3;            // body-lengths covered per full leg cycle (long, flowing strides)

  /* ---------- the leopard: a sleek, elongated silhouette ----------
     long low body, arched neck, small refined head, tapered limbs, long tail.
     One gold-gradient shape; everything flows through a single spine deformer. */
  var NS = "http://www.w3.org/2000/svg";
  var GROUND = 56;

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
  function smooth(u) { return u * u * (3 - 2 * u); }

  var OUTLINE = [
    [31,27],[33,22.6],[38,20],[46,19],[56,20.4],[68,22],[80,21],[90,19],[96,17.8],[103,16.8],[110,16],
    [116,14.4],[121.4,13.4],[126.4,13.8],[130.6,15.6],[133.8,18.4],[135.6,21.6],[135.4,24.2],[133.6,26.2],[130,27.4],[125,28.2],[119.4,29.6],[114.4,31.6],
    [110.6,34.4],[106.6,37.6],[101,40],[93,40],[84,37.6],[73,35],[62,33.6],[52,34.4],[44,36.4],[38,37],[33.5,34],[31.6,30.5]
  ];
  var SHEEN = [[33,22.6],[38,20],[46,19],[56,20.4],[68,22],[80,21],[90,19],[103,16.8],[110,16]];
  // rounded, dome-shaped ears set into the skull: [start, control, tip, control, end]
  var EAR_NEAR = [[114.4,15.8],[114.2,11],[117.6,10.6],[120.6,11.2],[120.8,15.4]];
  var EAR_FAR  = [[122.2,15.2],[122.4,10.8],[125.4,10.4],[128.2,11.2],[128.2,15.6]];
  var EYE = [[123,19],[126.2,17.9],[129.2,19.4],[126,20.5]];

  cat.setAttribute("viewBox", "0 3 140 57");
  cat.innerHTML = "";
  var defs = el("defs", {});
  var grad = el("linearGradient", { id: "pdGold", gradientUnits: "userSpaceOnUse", x1: "0", y1: "8", x2: "0", y2: "58" }, defs);
  el("stop", { offset: "0", "stop-color": "#f6e3ae" }, grad);
  el("stop", { offset: ".55", "stop-color": "#dcb872" }, grad);
  el("stop", { offset: "1", "stop-color": "#a9803f" }, grad);
  var FILL = "url(#pdGold)";

  var tail     = el("path", { fill: FILL });
  var farLegs  = el("g", { opacity: ".55" });
  var farEar   = el("path", { fill: FILL });
  var bodyPath = el("path", { fill: FILL, stroke: FILL, "stroke-width": ".5", "stroke-linejoin": "round" });
  var sheenEl  = el("path", { fill: "none", stroke: "rgba(255,250,232,.5)", "stroke-width": ".55", "stroke-linecap": "round" });
  var earPath  = el("path", { fill: FILL });
  var eyeEl    = el("path", { fill: "rgba(14,9,3,.9)" });
  var nearLegs = el("g", {});

  // hip/shoulder anchor, resting paw, foot-path centre, sweep, lift, phase, widths along the limb
  var legs = [
    { g: farLegs,  hx: 48, hy: 30.5, rest: [53, GROUND],   cx: 46, S: 19, lift: 11, off: 0.08, L: 13.8, W: [11.5, 8, 4.6, 3.4, 3] },
    { g: farLegs,  hx: 93, hy: 31.5, rest: [103, GROUND],  cx: 96, S: 17, lift: 12, off: 0.58, L: 13.8, W: [9.6, 6.8, 4.4, 3.2, 2.8] },
    { g: nearLegs, hx: 42, hy: 30.5, rest: [38, GROUND],   cx: 40, S: 19, lift: 11, off: 0.00, L: 13.8, W: [12.6, 8.6, 4.8, 3.5, 3.1] },
    { g: nearLegs, hx: 98, hy: 31.5, rest: [100, GROUND],  cx: 101, S: 17, lift: 12, off: 0.50, L: 13.8, W: [10.4, 7.2, 4.6, 3.3, 2.9] }
  ];
  legs.forEach(function (l) { l.p = el("path", { fill: FILL }, l.g); l.f = el("path", { fill: FILL }, l.g); });

  function foot(l, t, amp) {
    var STANCE = 0.38, x, y;
    if (t < STANCE) {                       // paw on the ground, sweeping back
      var u = t / STANCE;
      x = l.cx + l.S * (1 - 2 * u); y = GROUND;
    } else {                                // paw lifting and reaching forward
      var v = (t - STANCE) / (1 - STANCE);
      x = l.cx - l.S + 2 * l.S * smooth(v); y = GROUND - l.lift * Math.sin(Math.PI * v);
    }
    return { x: l.rest[0] + amp * (x - l.rest[0]), y: l.rest[1] + amp * (y - l.rest[1]) };
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
  function openSpline(pts) {
    var n = pts.length, d = "M" + pts[0].x.toFixed(1) + "," + pts[0].y.toFixed(1);
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      d += " C" + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + "," + (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
           " " + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + "," + (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
           " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
    }
    return d;
  }

  // a sculpted, tapering limb/tail: offset a centreline by a width profile and smooth the outline
  function sculpt(C, W, round) {
    var n = C.length, L = [], R = [];
    for (var i = 0; i < n; i++) {
      var a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, m = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / m, ny = dx / m;
      L.push({ x: C[i].x + nx * W[i] / 2, y: C[i].y + ny * W[i] / 2 });
      R.push({ x: C[i].x - nx * W[i] / 2, y: C[i].y - ny * W[i] / 2 });
    }
    var e = C[n - 1], e0 = C[n - 2], tx = e.x - e0.x, ty = e.y - e0.y, tm = Math.sqrt(tx * tx + ty * ty) || 1;
    var cap = round ? [{ x: e.x + tx / tm * W[n - 1] * .55, y: e.y + ty / tm * W[n - 1] * .55 }] : [];
    var s0 = C[0], s1 = C[1], sx = s0.x - s1.x, sy = s0.y - s1.y, sm = Math.sqrt(sx * sx + sy * sy) || 1;
    var top = [{ x: s0.x + sx / sm * W[0] * .5, y: s0.y + sy / sm * W[0] * .5 }];
    return spline(L.concat(cap, R.reverse(), top));
  }

  function drawLeg(l, phase, amp, hip) {
    var t = ((phase + l.off) % 1 + 1) % 1;
    var f = foot(l, t, amp);
    var hx = hip.x, hy = hip.y;
    var dx = f.x - hx, dy = f.y - hy;
    var raw = Math.sqrt(dx * dx + dy * dy) || 1;
    var d = Math.min(raw, 2 * l.L - 0.3);
    var ux = dx / raw, uy = dy / raw;
    var h = Math.sqrt(Math.max(0, l.L * l.L - (d / 2) * (d / 2)));
    var mx = hx + ux * d / 2, my = hy + uy * d / 2;
    var kx = mx + uy * h, ky = my - ux * h;
    var kx2 = mx - uy * h, ky2 = my + ux * h;
    if (kx2 < kx) { kx = kx2; ky = ky2; }                   // joint always points backwards
    var H = { x: hx, y: hy }, K = { x: kx, y: ky }, F = { x: hx + ux * d, y: hy + uy * d };
    function mid(A, B, q) { return { x: A.x + (B.x - A.x) * q, y: A.y + (B.y - A.y) * q }; }
    var C = [H, mid(H, K, .5), K, mid(K, F, .55), F];
    l.p.setAttribute("d", sculpt(C, l.W, false));
    // a small, refined paw
    l.f.setAttribute("d", "M" + (F.x - 2.4).toFixed(1) + "," + (F.y - 1.2).toFixed(1) +
      " Q" + (F.x + 1.6).toFixed(1) + "," + (F.y - 2.1).toFixed(1) + " " + (F.x + 4.2).toFixed(1) + "," + (F.y - .2).toFixed(1) +
      " Q" + (F.x + 3.6).toFixed(1) + "," + (F.y + 1.3).toFixed(1) + " " + (F.x + 1).toFixed(1) + "," + (F.y + 1.2).toFixed(1) +
      " Q" + (F.x - 2.4).toFixed(1) + "," + (F.y + 1.1).toFixed(1) + " " + (F.x - 2.4).toFixed(1) + "," + (F.y - 1.2).toFixed(1) + "Z");
  }

  function pose(phase, amp) {
    var a = 2 * Math.PI * phase;
    var bob   = -1.7 * amp * Math.sin(a + 0.6);             // the whole body rises and falls
    var pitch =  1.8 * amp * Math.sin(a + 2.2);
    var flex  =  5.5 * amp * Math.sin(a + 0.9);             // the spine gathers and lengthens
    var F = flex * 0.85;
    var neck = rot(104, 24, 76, 27, F);

    function T(x, y) {                                       // the spine deformer
      var r = rot(x, y, 48, 27, -flex), f = rot(x, y, 80, 27, F);
      var w = clamp((x - 48) / 32, 0, 1);
      var p = { x: r.x + (f.x - r.x) * w, y: r.y + (f.y - r.y) * w };
      var wh = clamp((x - 104) / 10, 0, 1);
      if (wh > 0) p = rot(p.x, p.y, neck.x, neck.y, -F * 0.55 * wh);   // the head stays proud and level
      p = rot(p.x, p.y, 76, 27, pitch);
      p.y += bob;
      return p;
    }
    function P(arr) { return arr.map(function (q) { return T(q[0], q[1]); }); }

    bodyPath.setAttribute("d", spline(P(OUTLINE)));
    sheenEl.setAttribute("d", openSpline(P(SHEEN)));
    function ear(E) {
      var q = P(E); function f(p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }
      return "M" + f(q[0]) + " Q" + f(q[1]) + " " + f(q[2]) + " Q" + f(q[3]) + " " + f(q[4]) + "Z";
    }
    earPath.setAttribute("d", ear(EAR_NEAR));
    farEar.setAttribute("d", ear(EAR_FAR));
    var e = P(EYE);
    eyeEl.setAttribute("d", "M" + e[0].x.toFixed(1) + "," + e[0].y.toFixed(1) + " Q" + e[1].x.toFixed(1) + "," + e[1].y.toFixed(1) + " " + e[2].x.toFixed(1) + "," + e[2].y.toFixed(1) +
      " Q" + e[3].x.toFixed(1) + "," + e[3].y.toFixed(1) + " " + e[0].x.toFixed(1) + "," + e[0].y.toFixed(1) + "Z");

    legs.forEach(function (l) { drawLeg(l, phase, amp, T(l.hx, l.hy)); });

    // the tail: long, streaming behind in an easy S, tip lifted and curled
    var root = T(32, 25.5), w = 4.5 * amp * Math.sin(a - 0.9), C = [], Wd = [5.6, 5.5, 5.3, 5.1, 4.9, 4.7, 4.5, 4.4, 4.3];
    for (var i = 0; i < 9; i++) {
      var s = i / 8;
      var x = root.x - 28 * s - 3 * Math.sin(Math.PI * s);
      var y = root.y + 2.2 + 3.2 * Math.sin(Math.PI * 1.25 * s) - 13 * Math.pow(s, 2.4) + w * s * Math.sin(3.2 * s + 0.4);
      C.push({ x: x, y: y });
    }
    tail.setAttribute("d", sculpt(C, Wd, true));
  }
  pose(0, 0);

  /* ---------- the run ---------- */
  var total = path.getTotalLength();
  var pawX = paws.map(function (p) { return parseFloat(p.getAttribute("cx")); });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var done = false, angle = 0, started = false, phase = 0, lastX = null;

  // pace profile: a graceful launch, full flowing speed through the zigzag, a soft settle at the end
  var ACC = 0.2, DEC = 0.3, VMAX = 1 / (1 - ACC / 2 - DEC / 2), vNorm = 0;
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
    target = Math.max(-12, Math.min(12, target * 3));    // lean into each rise and dip
    angle += (target - angle) * 0.16;

    // stride follows distance covered; legs settle into a stand at the very start and end
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