/* Magnetic · le champ de limaille.
   Des milliers d'aiguilles de fer couvrent l'écran et s'orientent selon le champ créé par des pôles.
   Les pôles sont des éléments de la page ([data-pole], charge data-q) : le texte attire la limaille,
   et le champ se recompose à mesure qu'on défile. Le curseur est un aimant de plus ; un clic inverse sa polarité.
   Mouvement réduit : le champ est dessiné une fois, fixe, sans curseur. */
(function () {
  var cv = document.getElementById("field");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;

  var W = 0, H = 0, DPR = 1, U = 1, SP = 16, N = 0;
  var X, Y, A, L, R;               // positions, angle courant, longueur, graine
  var poles = [];                  // { el, q, drift, pulse, x, y, w }
  var pointer = { x: -9999, y: -9999, on: 0, target: 0, sign: 1, last: 0 };
  var level = 1, levelTarget = 1;
  var colors = { ink: "#121216", n: "#e03c22", s: "#2433ff" };
  var dirty = true, t0 = performance.now();

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors.ink = cs.getPropertyValue("--ink").trim() || colors.ink;
    colors.n = cs.getPropertyValue("--north").trim() || colors.n;
    colors.s = cs.getPropertyValue("--south").trim() || colors.s;
    dirty = true;
  }

  function build() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight; U = Math.min(W, H);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    SP = W < 640 ? 13 : W < 1100 ? 15 : 17;
    var cols = Math.ceil(W / SP) + 1, rows = Math.ceil(H / SP) + 1;
    N = cols * rows;
    X = new Float32Array(N); Y = new Float32Array(N); A = new Float32Array(N); L = new Float32Array(N); R = new Float32Array(N);
    var i = 0, rnd = mulberry(7);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++, i++) {
      X[i] = c * SP + (rnd() - 0.5) * SP * 0.8;
      Y[i] = r * SP + (rnd() - 0.5) * SP * 0.8;
      A[i] = rnd() * Math.PI;
      L[i] = SP * (0.45 + rnd() * 0.3);
      R[i] = rnd();
    }
    collect();
    dirty = true;
  }

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function collect() {
    poles = [];
    document.querySelectorAll("[data-pole]").forEach(function (el) {
      poles.push({ el: el, q: parseFloat(el.getAttribute("data-q") || "1"), drift: +(el.getAttribute("data-drift") || 0),
                   pulse: !!el.getAttribute("data-pulse"), x: 0, y: 0, w: 0, boost: 1 });
    });
  }

  /* position des pôles d'après la page, avec un poids qui s'éteint loin de l'écran */
  function placePoles(now) {
    var moved = false, ts = (now - t0) / 1000;
    for (var i = 0; i < poles.length; i++) {
      var p = poles[i], b = p.el.getBoundingClientRect();
      var x = b.left + b.width / 2, y = b.top + b.height / 2;
      if (p.drift && !reduce) { x += Math.sin(ts * 0.31 + p.drift * 2.1) * U * 0.035; y += Math.cos(ts * 0.23 + p.drift) * U * 0.05; }
      var off = Math.max(0, Math.abs(y - H / 2) - H * 0.5) / H;     // 0 à l'écran, croît hors champ
      var w = off > 1.3 ? 0 : 1 - smooth(off / 1.3);
      if (b.width === 0 && b.height === 0 && !p.el.offsetParent) w = 0;
      var host = p.el.closest("[data-boost]");
      var boost = host ? parseFloat(host.getAttribute("data-boost")) : 1;
      p.boost += (boost - p.boost) * 0.12;
      var q = p.q * p.boost * (p.pulse && !reduce ? 0.75 + 0.35 * Math.sin(ts * 1.6) : 1);
      if (Math.abs(x - p.x) > 0.3 || Math.abs(y - p.y) > 0.3 || Math.abs(w - p.w) > 0.002 || Math.abs(q - p.qe) > 0.002) moved = true;
      p.x = x; p.y = y; p.w = w; p.qe = q;
    }
    return moved;
  }
  function smooth(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }

  function sceneLevel() {
    var mid = H * 0.5, best = null;
    document.querySelectorAll("[data-level]").forEach(function (s) {
      var b = s.getBoundingClientRect();
      if (b.top <= mid && b.bottom >= mid) best = s;
    });
    levelTarget = best ? parseFloat(best.getAttribute("data-level")) : 0.4;
  }

  /* tampons de tracé : 3 couleurs × 4 niveaux d'opacité */
  var BUCKETS = 12, buf = [], cnt = new Int32Array(BUCKETS);
  function ensureBuf() { for (var b = 0; b < BUCKETS; b++) if (!buf[b] || buf[b].length < N * 4) buf[b] = new Float32Array(N * 4); }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    var moved = placePoles(now);
    sceneLevel();
    level += (levelTarget - level) * 0.06;
    if (Math.abs(levelTarget - level) > 0.003) moved = true;

    // le curseur s'allume quand il bouge et s'éteint après un temps d'immobilité
    if (!reduce && fine) {
      if (now - pointer.last > 2600) pointer.target = 0;
      var po = pointer.on;
      pointer.on += (pointer.target - pointer.on) * 0.08;
      if (Math.abs(po - pointer.on) > 0.001) moved = true;
    }
    if (!moved && !dirty && !settling) return;
    draw();
  }

  var settling = true;
  function draw() {
    ensureBuf();
    for (var b = 0; b < BUCKETS; b++) cnt[b] = 0;
    var soft = (U * 0.03) * (U * 0.03);
    var P = [], i, j;
    for (i = 0; i < poles.length; i++) if (poles[i].w > 0.001) P.push(poles[i]);
    if (pointer.on > 0.01) P.push({ x: pointer.x, y: pointer.y, qe: 1.7 * pointer.sign, w: pointer.on });
    var np = P.length, px = new Float32Array(np), py = new Float32Array(np), pq = new Float32Array(np);
    for (j = 0; j < np; j++) { px[j] = P[j].x; py[j] = P[j].y; pq[j] = P[j].qe * P[j].w; }

    var ease = reduce ? 1 : 0.16, maxd = 0, HALF = Math.PI / 2, PI = Math.PI;
    for (i = 0; i < N; i++) {
      var x = X[i], y = Y[i], ex = 0, ey = 0, s = 0;
      for (j = 0; j < np; j++) {
        var dx = x - px[j], dy = y - py[j], d2 = dx * dx + dy * dy + soft, inv = pq[j] / d2;
        ex += dx * inv; ey += dy * inv; s += pq[j] / Math.sqrt(d2);
      }
      var m = Math.sqrt(ex * ex + ey * ey) * U;
      var target = np ? Math.atan2(ey, ex) : A[i];
      var diff = target - A[i];
      diff = ((diff + HALF) % PI + PI) % PI - HALF;      // limaille sans sens : angle modulo π
      A[i] += diff * ease;
      if (Math.abs(diff) > maxd) maxd = Math.abs(diff);

      var g = Math.min(1, Math.log(1 + m * 0.9) / 2.6);   // intensité locale, 0 à 1
      var alpha = level * (0.08 + 0.62 * g) * (0.75 + 0.5 * R[i]);
      var lvl = alpha < 0.12 ? 0 : alpha < 0.24 ? 1 : alpha < 0.4 ? 2 : 3;
      if (lvl === 0 && R[i] > 0.55) continue;            // le vide respire
      var tint = s * U * 0.045;
      var col = tint > 0.55 ? 1 : tint < -0.55 ? 2 : 0;
      var k = col * 4 + lvl, len = L[i] * (0.75 + 0.6 * g);
      var c = Math.cos(A[i]) * len * 0.5, sn = Math.sin(A[i]) * len * 0.5, o = cnt[k] * 4, bb = buf[k];
      bb[o] = x - c; bb[o + 1] = y - sn; bb[o + 2] = x + c; bb[o + 3] = y + sn; cnt[k]++;
    }
    settling = maxd > 0.004;
    dirty = false;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    var ALPHAS = [0.1, 0.2, 0.34, 0.55], COLS = [colors.ink, colors.n, colors.s];
    for (var kk = 0; kk < BUCKETS; kk++) {
      var n = cnt[kk]; if (!n) continue;
      var arr = buf[kk];
      ctx.globalAlpha = ALPHAS[kk % 4];
      ctx.strokeStyle = COLS[(kk / 4) | 0];
      ctx.lineWidth = kk % 4 === 3 ? 1.25 : 1;
      ctx.beginPath();
      for (var q = 0; q < n * 4; q += 4) { ctx.moveTo(arr[q], arr[q + 1]); ctx.lineTo(arr[q + 2], arr[q + 3]); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* curseur aimanté */
  var cursor = document.querySelector(".cursor");
  if (!reduce && fine) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.last = performance.now(); pointer.target = 1;
      if (cursor) { cursor.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; cursor.classList.add("on"); }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { pointer.target = 0; if (cursor) cursor.classList.remove("on"); });
    window.addEventListener("click", function (e) {
      if (e.target.closest("a, button, summary, input, label, [data-principes] li, details")) return;
      pointer.sign *= -1; pointer.last = performance.now(); pointer.target = 1;
      if (cursor) { cursor.classList.toggle("south", pointer.sign < 0); cursor.classList.remove("pop"); void cursor.offsetWidth; cursor.classList.add("pop"); }
      dirty = true;
    });
  }

  var rw = W;
  window.addEventListener("resize", function () {
    if (Math.abs(window.innerWidth - rw) > 2 || Math.abs(window.innerHeight - H) > 140) { rw = window.innerWidth; build(); }
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
  document.addEventListener("mag:refresh", function () { collect(); dirty = true; });

  readColors(); build();
  if (reduce) {
    // une image fixe : le champ tel qu'il est à l'ouverture
    var still = function () { placePoles(performance.now()); sceneLevel(); level = levelTarget; draw(); };
    still();
    window.addEventListener("load", still);
    if (document.fonts) document.fonts.ready.then(still);
    window.addEventListener("scroll", still, { passive: true });
  } else {
    requestAnimationFrame(frame);
  }
  window.MAG_FIELD = { pointer: pointer, poles: function () { return poles; } };
})();
