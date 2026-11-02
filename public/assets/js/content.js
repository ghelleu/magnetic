/* Magnetic · pose les textes dans la page.
   Ordre de recherche d'une clé : textes validés (content/xx.js), puis propositions (content/xx.propositions.js),
   sinon un emplacement [À FOURNIR : …] décrit par l'attribut data-need. */
(function () {
  var MAG = window.MAG || {};
  var CFG = window.MAG_CONFIG || {};
  var params = new URLSearchParams(location.search);
  var lang = params.get("lang") === "en" ? "en" : "fr";
  var stats = { prop: 0, todo: 0 };

  document.documentElement.lang = lang;
  if (params.has("og")) document.documentElement.classList.add("og");   // capture de l'image de partage
  window.MAG_LANG = lang;

  function typo(s, l) {
    s = s.replace(/(CHE-[\d.]+\d)/g, '<span class="nw">$1</span>');
    if (l !== "fr") return s;
    // espaces fines insécables devant la ponctuation haute (rendu seulement, le texte source n'est pas modifié)
    return s.replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");
  }

  function resolve(k, l) {
    var v = (MAG[l] || {})[k];
    if (v != null) return { t: v, st: "ok" };
    var p = (MAG[l + "_prop"] || {})[k];
    if (p != null) return { t: p, st: "prop" };
    return null;
  }

  function todo(need) {
    stats.todo++;
    return '<span class="todo">[À FOURNIR : ' + (need || "texte") + "]</span>";
  }

  function fill(root) {
    root.querySelectorAll("[data-k]").forEach(function (el) {
      var k = el.getAttribute("data-k");
      var l = el.getAttribute("data-fixed") || lang;
      var r = resolve(k, l);
      el.classList.remove("is-prop", "is-todo");
      if (!r) {
        el.innerHTML = todo(el.getAttribute("data-need") || k);
        el.classList.add("is-todo");
        return;
      }
      // une espace suit chaque retour à la ligne : sur mobile, où les <br> s'effacent, les mots restent séparés
      el.innerHTML = typo(r.t, l).replace(/<br\s*\/?>/gi, "<br> ");
      if (r.st === "prop") {
        el.classList.add("is-prop");
        el.setAttribute("data-mark", (MAG[lang] || {})["ui.prop"] || "Proposition, à valider");
        stats.prop++;
      }
    });
    root.querySelectorAll("img[data-alt]").forEach(function (img) {
      var k = img.getAttribute("data-alt");
      var v = (MAG[lang + "_alt"] || {})[k] || (MAG[lang] || {})[k] || (MAG[lang + "_prop"] || {})[k];
      img.alt = v || "";
    });
    var other = lang === "en" ? "fr" : "en";
    root.querySelectorAll("[data-lang-link]").forEach(function (a) {
      var u = new URL(location.href);
      if (other === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
      a.href = u.pathname + u.search + u.hash;
      a.hreflang = other; a.lang = other;
      a.setAttribute("aria-label", (MAG[lang] || {})["ui.langue"] || other);
    });
    root.querySelectorAll("[data-page]").forEach(function (a) {
      var base = document.body.getAttribute("data-root") || "";
      a.href = base + a.getAttribute("data-page") + (lang === "en" ? "?lang=en" : "");
    });
  }

  fill(document);
  var sig = resolve("signature", lang);
  var pageTitle = document.body.getAttribute("data-title-k");
  var t = pageTitle ? resolve(pageTitle, lang) : null;
  document.title = t ? t.t + " · Magnetic" : "Magnetic · " + (sig ? sig.t : "");

  window.MAG_STATS = stats;
  window.MAG_PREVIEW = !!CFG.preview;
  document.dispatchEvent(new CustomEvent("mag:content", { detail: { lang: lang, stats: stats } }));
})();
