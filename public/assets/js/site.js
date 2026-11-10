/* Magnetic · logotype, menu, barre, apparitions, relecture. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---- logotype : tracés exacts du PDF (assets/js/logo.js) ---- */
  var LOGO = window.MAGNETIC_LOGO;
  document.querySelectorAll("[data-logo]").forEach(function (host) {
    if (!LOGO) { host.textContent = "Magnetic"; return; }
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + LOGO.w + " " + LOGO.h);
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    LOGO.d.forEach(function (d, i) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", d); p.setAttribute("class", "l"); p.style.setProperty("--i", i);
      svg.appendChild(p);
    });
    host.appendChild(svg);
    if (host.hasAttribute("data-assemble") && !reduce) assemble(svg);
  });

  /* les lettres arrivent dispersées puis s'attirent jusqu'à leur place */
  function assemble(svg) {
    var paths = svg.querySelectorAll("path"), n = paths.length;
    paths.forEach(function (p, i) {
      var side = i < n / 2 ? -1 : 1;
      var dx = side * (260 + Math.random() * 380), dy = (Math.random() - 0.5) * 260, r = (Math.random() - 0.5) * 70;
      p.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + r + "deg)";
      p.style.opacity = "0";
    });
    svg.getBoundingClientRect();
    requestAnimationFrame(function () {
      svg.classList.add("assembling");
      paths.forEach(function (p) { p.style.transform = ""; p.style.opacity = ""; });
    });
    // une fois en place, les lettres se penchent un peu vers le curseur
    setTimeout(function () {
      svg.classList.remove("assembling"); svg.classList.add("live");
      if (!matchMedia("(pointer: fine)").matches) return;
      var raf = 0, mx = 0, my = 0;
      window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(lean); }, { passive: true });
      function lean() {
        raf = 0;
        paths.forEach(function (p) {
          var b = p.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          var dx = mx - cx, dy = my - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
          var f = Math.max(0, 1 - d / 420), k = f * f * 9;
          p.style.transform = "translate(" + (dx / d * k) + "px," + (dy / d * k) + "px)";
        });
      }
    }, 2400);
  }

  /* ---- barre : fond dès qu'on quitte l'ouverture, lien actif ---- */
  var bar = document.querySelector(".bar");
  // les liens de la barre mènent à des pages ; seuls d'éventuels liens d'ancre suivent le défilement
  var links = [].slice.call(document.querySelectorAll('.bar-nav a[href^="#"]'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function onScroll() {
    if (bar && document.body.getAttribute("data-id") === "accueil") bar.classList.toggle("solid", window.scrollY > window.innerHeight * 0.6);
    var mid = window.innerHeight * 0.4, active = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < mid) active = i; });
    links.forEach(function (a, i) { a.classList.toggle("on", i === active); });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---- menu (mobile) ---- */
  var btn = document.querySelector(".menu-btn"), menu = document.getElementById("menu");
  if (btn && menu) {
    var setMenu = function (open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open; root.classList.toggle("menu-open", open);
      var M = window.MAG[window.MAG_LANG] || {};
      btn.querySelector("span").textContent = open ? M["ui.fermer"] : M["ui.menu"];
    };
    btn.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); } });
  }

  /* ---- manifeste : le principe survolé renforce son pôle ---- */
  document.querySelectorAll("[data-principes] li").forEach(function (li) {
    var on = function () { li.setAttribute("data-boost", "3"); li.parentNode.classList.add("focus"); };
    var off = function () { li.removeAttribute("data-boost"); li.parentNode.classList.remove("focus"); };
    li.tabIndex = 0;
    li.addEventListener("pointerenter", on); li.addEventListener("pointerleave", off);
    li.addEventListener("focus", on); li.addEventListener("blur", off);
  });

  /* ---- apparitions ---- */
  var rv = document.querySelectorAll(".statement, .lead, .body, .quote, .kicker, .chap-head, .figures li, .formes li, .principes li, .phase, .tour > *, .avenir-list li, .duo-img, .people, .facts, .mail");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  }

  /* ---- relecture (version de travail) ---- */
  var tg = document.querySelector(".review-toggle");
  if (window.MAG_PREVIEW && tg) {
    var st = window.MAG_STATS || { prop: 0, todo: 0 };
    tg.hidden = false;
    tg.title = st.prop + " propositions · " + st.todo + " à fournir";
    tg.querySelector("i").textContent = st.prop + st.todo;
    var params = new URLSearchParams(location.search);
    var setRev = function (on) { root.classList.toggle("review", on); tg.setAttribute("aria-pressed", on ? "true" : "false"); };
    setRev(params.has("relecture"));
    tg.addEventListener("click", function () { setRev(!root.classList.contains("review")); });
  }
})();
