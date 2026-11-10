#!/usr/bin/env python3
"""Génère les pages HTML du site Magnetic à partir d'un gabarit commun.

Les textes ne sont pas ici : ils vivent dans public/content/*.js et sont posés par content.js.
Ce script ne produit que la structure (balises data-k). Le site publié reste du HTML statique,
sans étape de construction : on ne relance ce script que pour changer la structure des pages.

Usage : python3 tools/pages.py   (incrémente aussi la version des feuilles et scripts)
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public"
VERSION = "11"

NAV = [
    ("esprit", "esprit-de-geneve/", "ui.nav.esprit"),
    ("histoire", "notre-histoire/", "ui.nav.histoire"),
    ("manifeste", "manifeste/", "ui.nav.manifeste"),
    ("methode", "methode/", "ui.nav.methode"),
    ("projets", "projets/", "ui.nav.projets"),
    ("rejoindre", "nous-rejoindre/", "ui.nav.rejoindre"),
]


def head(r, title_k, field=True):
    js = [f'<script src="{r}assets/js/config.js?v={VERSION}"></script>']
    for c in ("fr", "fr.propositions", "en", "en.propositions"):
        js.append(f'<script src="{r}content/{c}.js?v={VERSION}"></script>')
    js.append(f'<script src="{r}assets/js/logo.js?v={VERSION}"></script>')
    js.append(f'<script src="{r}assets/js/content.js?v={VERSION}" defer></script>')
    if field:
        js.append(f'<script src="{r}assets/js/field.js?v={VERSION}" defer></script>')
    js.append(f'<script src="{r}assets/js/site.js?v={VERSION}" defer></script>')
    return f"""<!DOCTYPE html>
<html lang="fr" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Magnetic</title>
<meta name="description" content="Magnetic, association genevoise : réactiver créativement l’Esprit de Genève pour faire de la création un outil pour repenser le commun.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ecebe4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0e" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Magnetic">
<meta property="og:title" content="Magnetic">
<meta property="og:description" content="Réactiver créativement l’Esprit de Genève pour faire de la création un outil pour repenser le commun.">
<meta property="og:locale" content="fr_CH">
<meta property="og:locale:alternate" content="en_GB">
<meta property="og:image" content="https://guillaumehelleu.com/magnetic/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="{r}assets/img/favicon.svg">
<link rel="preload" href="{r}assets/fonts/newsreader-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{r}assets/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/css/site.css?v={VERSION}">
<script>document.documentElement.className='js'</script>
{chr(10).join(js)}
</head>
"""


def bar(cur):
    on = ' class="on" aria-current="page"'
    links = "\n".join(
        f'    <a data-page="{p}" data-k="{k}"{on if i == cur else ""}></a>'
        for i, p, k in NAV)
    menu = "\n".join(
        f'    <a data-page="{p}"><small>{n:02d}</small><span data-k="{k}"></span></a>'
        for n, (i, p, k) in enumerate(NAV, 1))
    return f"""<a class="skip" href="#contenu" data-k="ui.skip"></a>
<canvas id="field" aria-hidden="true"></canvas>
<div class="cursor" aria-hidden="true"></div>

<header class="bar{' solid' if cur else ''}">
  <a class="bar-logo" data-page="" aria-label="Magnetic"><span class="logo-svg" data-logo></span></a>
  <nav class="bar-nav" aria-label="Pages">
{links}
  </nav>
  <div class="bar-tools">
    <button class="review-toggle" type="button" hidden aria-pressed="false"><i></i><span data-k="ui.relecture"></span></button>
    <a class="lang" data-lang-link><span data-k="ui.langue.court"></span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><span data-k="ui.menu"></span></button>
  </div>
</header>

<div class="menu" id="menu" hidden>
  <nav aria-label="Menu">
    <a data-page=""><small>00</small><span data-k="ui.nav.accueil"></span></a>
{menu}
  </nav>
</div>

<noscript><p class="noscript">Ce site a besoin de JavaScript pour afficher ses textes. Contact : <a href="mailto:contact@magnetic.ch">contact@magnetic.ch</a></p></noscript>
"""


FOOT = """
<footer class="foot">
  <a class="foot-logo" data-page="" aria-label="Magnetic"><span class="logo-svg small" data-logo></span></a>
  <p class="serif-i" data-k="signature"></p>
  <nav aria-label="Pied de page">
    <a data-page="mentions-legales/" data-k="ui.mentions"></a>
    <a data-page="confidentialite/" data-k="ui.confidentialite"></a>
    <a href="mailto:contact@magnetic.ch">contact@magnetic.ch</a>
  </nav>
  <p class="copy">© 2026 Magnetic</p>
</footer>
</body>
</html>
"""


def suite(*pairs):
    items = "\n".join(f'    <a class="suite-link" data-page="{p}"><span data-k="{k}"></span><i aria-hidden="true">→</i></a>' for p, k in pairs)
    return f"""<nav class="suite" aria-label="Suite">
{items}
  </nav>"""


def page_head(title_k, num=None):
    n = f'<p class="chap-num" data-pole data-q="1.2">{num}</p>' if num else ""
    return f"""  <header class="chap-head page-head">
    {n}<h1 class="chap-title" data-k="{title_k}"></h1>
  </header>"""


# ------------------------------------------------------------------ pages

ACCUEIL = """<main id="contenu">
<section id="ouverture" class="hero" data-level="1">
  <i class="anchor" style="left:9%;top:50%" data-pole data-q="1.3" data-drift="1"></i><i class="anchor" style="left:91%;top:50%" data-pole data-q="-1.3" data-drift="2"></i>
  <h1 class="hero-logo"><span class="sr" lang="fr">Magnetic</span><span class="logo-svg big" data-logo data-assemble></span></h1>
  <p class="hero-sig serif-i" data-k="signature"></p>
  <div class="hero-foot">
    <p class="hero-role" data-k="accueil.intro"></p>
    <div class="hero-aside">
      <p class="hero-hint" data-k="ui.polarite"></p>
      <a class="hero-cta" data-page="esprit-de-geneve/"><span data-k="ui.entrer"></span><i aria-hidden="true">→</i></a>
    </div>
  </div>
</section>

<section class="moment bandeau" data-level="0.8">
  <i class="anchor" style="left:82%;top:40%" data-pole data-q="1.5" data-pulse="1"></i>
  <p class="label" data-k="ui.premier"></p>
  <h2 class="tour-title" data-k="tour.titre"></h2>
  <p class="bandeau-facts"><span data-k="tour.fait.lieu"></span><span data-k="tour.fait.dates"></span><span data-k="tour.fait.cadre"></span></p>
  <p class="statement s serif-i" data-k="tour.bandeau.appel"></p>
  <a class="cta" data-page="projets/"><span data-k="ui.suite.tour"></span><i aria-hidden="true">→</i></a>
</section>

<section class="moment mission" data-level="1">
  <i class="anchor" style="left:12%;top:18%" data-pole data-q="1"></i><i class="anchor" style="left:88%;top:82%" data-pole data-q="-1"></i>
  <p class="statement xl center" data-k="mission"></p>
</section>

<section class="reading" data-level="0.4">
""" + suite(("esprit-de-geneve/", "ui.nav.esprit"), ("notre-histoire/", "ui.suite.histoire"), ("manifeste/", "ui.suite.manifeste"), ("methode/", "ui.suite.methode")) + """
</section>
</main>
"""

ESPRIT = """<main id="contenu">
<section class="chapter" data-level="1">
  <i class="anchor" style="left:74%;top:46%" data-pole data-q="1.8" data-drift="3"></i>
  <header class="chap-head"><p class="chap-num">I</p><h1 class="chap-title" data-k="moment.1"></h1></header>
  <p class="statement" data-k="esprit.1"></p>
</section>
<section class="reading" data-level="0.4">
  <figure class="duo traz">
    <div class="duo-img book"><img src="../assets/img/traz.jpg" width="445" height="703" loading="lazy" data-alt="img.traz" alt=""></div>
    <div>
      <p class="lead" data-k="esprit.2"></p>
      <p class="quote" data-k="esprit.3"></p>
      <p class="lead" data-k="esprit.4"></p>
    </div>
  </figure>
</section>

<section class="chapter short" data-level="0.9">
  <header class="chap-head"><p class="chap-num">II</p><h2 class="chap-title" data-k="moment.2"></h2></header>
  <p class="kicker serif-i" data-k="figures.intro"></p>
</section>
<section class="reading figures-wrap" data-level="0.55">
  <ol class="figures">
    <li><div class="portrait"><i class="anchor" style="left:50%;top:40%" data-pole data-q="0.9"></i><img src="../assets/img/calvin.jpg" width="400" height="1100" loading="lazy" data-alt="img.calvin" alt=""></div><h3 data-k="figures.calvin.nom"></h3><p data-k="figures.calvin"></p></li>
    <li><div class="portrait"><i class="anchor" style="left:50%;top:40%" data-pole data-q="-0.9"></i><img src="../assets/img/rousseau.jpg" width="400" height="1100" loading="lazy" data-alt="img.rousseau" alt=""></div><h3 data-k="figures.rousseau.nom"></h3><p data-k="figures.rousseau"></p></li>
    <li><div class="portrait"><i class="anchor" style="left:50%;top:40%" data-pole data-q="0.9"></i><img src="../assets/img/dunant.jpg" width="253" height="693" loading="lazy" data-alt="img.dunant" alt=""></div><h3 data-k="figures.dunant.nom"></h3><p data-k="figures.dunant"></p></li>
  </ol>
  <p class="statement s center" data-k="figures.fin"></p>
  <aside class="encart"><p data-k="figures.encart"></p></aside>
</section>

<section class="chapter short" data-level="0.9">
  <header class="chap-head"><p class="chap-num">III</p><h2 class="chap-title" data-k="moment.3"></h2></header>
  <p class="kicker serif-i" data-k="formes.intro"></p>
</section>
<section class="reading" data-level="0.45">
  <ul class="formes">
    <li class="forme-text"><span class="idx" data-pole data-q="0.5">i</span><p data-k="formes.1"></p></li>
    <li><span class="idx" data-pole data-q="-0.5">ii</span><div class="forme-img"><img src="../assets/img/croix-rouge.jpg" width="1400" height="604" loading="lazy" data-alt="img.croixrouge" alt=""></div><p data-k="formes.2"></p></li>
    <li><span class="idx" data-pole data-q="0.5">iii</span><div class="forme-img"><img src="../assets/img/conventions.jpg" width="1091" height="470" loading="lazy" data-alt="img.conventions" alt=""></div><p data-k="formes.3"></p></li>
    <li><span class="idx" data-pole data-q="-0.5">iv</span><div class="forme-img"><img src="../assets/img/revue.jpg" width="458" height="198" loading="lazy" data-alt="img.revue" alt=""></div><p data-k="formes.4"></p></li>
    <li class="forme-etc"><p data-k="formes.5"></p></li>
  </ul>
  <p class="lead" data-k="formes.fin"></p>
</section>

<section class="chapter" data-level="1">
  <i class="anchor" style="left:50%;top:30%" data-pole data-q="1.4" data-pulse="1"></i>
  <header class="chap-head"><p class="chap-num">IV</p><h2 class="chap-title" data-k="moment.4"></h2></header>
  <p class="lead narrow-in" data-k="cachee.intro"></p>
</section>
<section class="reading cachee" data-level="0.5">
  <ol class="cards">
""" + "\n".join(
    f"""    <li class="card"><p class="card-date" data-pole data-q="{q}" data-k="cachee.{i}.date"></p><h3 class="card-title" data-k="cachee.{i}.titre"></h3><p class="card-text" data-k="cachee.{i}.texte"></p><p class="card-source"><small data-k="ui.source"></small> <span data-k="cachee.{i}.source"></span></p></li>"""
    for i, q in zip(range(1, 7), ["0.8", "-0.8", "0.8", "-0.8", "0.8", "-0.8"])) + """
  </ol>
</section>

<section class="moment" data-level="0.9">
  <i class="anchor" style="left:50%;top:8%" data-pole data-q="1"></i><i class="anchor" style="left:50%;top:92%" data-pole data-q="-1"></i>
  <header class="chap-head"><p class="chap-num">V</p><h2 class="chap-title" data-k="moment.5"></h2></header>
  <p class="lead" data-k="fil.1"></p>
  <p class="statement" data-k="fil.2"></p>
</section>

<section class="chapter short" data-level="0.9">
  <header class="chap-head"><p class="chap-num">VI</p><h2 class="chap-title" data-k="moment.6"></h2></header>
</section>
<section class="reading narrow objectif" data-level="0.5">
  <p class="lead" data-k="objectif.1"></p>
  <p class="lead strong" data-k="objectif.2"></p>
  <p class="body" data-k="objectif.3"></p>
  <p class="body" data-k="objectif.4"></p>
</section>
<section class="moment mission" data-level="1">
  <i class="anchor" style="left:12%;top:18%" data-pole data-q="1"></i><i class="anchor" style="left:88%;top:18%" data-pole data-q="-1"></i><i class="anchor" style="left:12%;top:82%" data-pole data-q="-1"></i><i class="anchor" style="left:88%;top:82%" data-pole data-q="1"></i>
  <p class="statement xl center" data-k="mission"></p>
</section>
<section class="moment" data-level="0.8">
  <i class="anchor" style="left:6%;top:50%" data-pole data-q="-1"></i><i class="anchor" style="left:94%;top:50%" data-pole data-q="1"></i>
  <p class="statement" data-k="cloture"></p>
""" + suite(("notre-histoire/", "ui.suite.histoire"), ("projets/", "ui.suite.tour")) + """
</section>
</main>
"""

HISTOIRE = """<main id="contenu">
<section class="chapter" data-level="1">
""" + page_head("ui.nav.histoire") + """
  <p class="statement" data-k="origine.1"></p>
  <div class="poles">
    <p class="pole n"><i class="dot" data-pole data-q="1.2"></i><b data-k="origine.pole1.nom"></b><span class="serif-i" data-k="origine.pole1.sous"></span></p>
    <p class="pole s"><i class="dot" data-pole data-q="-1.2"></i><b data-k="origine.pole2.nom"></b><span class="serif-i" data-k="origine.pole2.sous"></span></p>
  </div>
</section>
<section class="reading" data-level="0.4">
  <figure class="duo">
    <div class="duo-img"><img src="../assets/img/downtown.jpg" width="966" height="852" loading="lazy" data-alt="img.downtown" alt=""></div>
    <p class="lead" data-k="origine.2"></p>
  </figure>
  <figure class="duo reverse">
    <div class="duo-img"><img src="../assets/img/together.jpg" width="1500" height="1323" loading="lazy" data-alt="img.together" alt=""></div>
    <p class="lead" data-k="origine.3"></p>
  </figure>
</section>
<section class="reading narrow" data-level="0.4">
  <p class="lead" data-k="histoire.decouverte"></p>
</section>
<section class="moment" data-level="0.9">
  <i class="anchor" style="left:50%;top:8%" data-pole data-q="1"></i><i class="anchor" style="left:50%;top:92%" data-pole data-q="-1"></i>
  <p class="kicker serif-i" data-k="origine.4"></p>
  <p class="statement xl" data-k="origine.5"></p>
</section>
<section class="reading narrow" data-level="0.4">
  <p class="lead" data-k="histoire.premier"></p>
""" + suite(("manifeste/", "ui.suite.manifeste"), ("projets/", "ui.suite.tour")) + """
</section>
</main>
"""

MANIFESTE = """<main id="contenu">
<section class="chapter page" data-level="1">
""" + page_head("ui.nav.manifeste") + """
  <p class="lead narrow-in" data-k="manifeste.intro"></p>
  <ol class="principes" data-principes>
""" + "\n".join(
    f"""    <li data-i="{i-1}"><span class="n" data-pole data-q="{'1' if i % 2 else '-1'}">0{i}</span><h2 data-k="p{i}.titre"></h2><div><p data-k="p{i}"></p><p class="precedent"><small data-k="ui.precedent"></small><span data-k="p{i}.precedent"></span></p></div></li>"""
    for i in range(1, 7)) + """
  </ol>
""" + suite(("methode/", "ui.suite.methode"), ("projets/", "ui.suite.projets")) + """
</section>
</main>
"""

METHODE = """<main id="contenu">
<section class="chapter page methode" data-level="1">
""" + page_head("ui.nav.methode") + """
  <p class="statement s serif-i" data-k="methode.intro"></p>
  <p class="lead narrow-in" data-k="methode.chapeau"></p>
  <ol class="phases">
    <li class="phase"><p class="phase-num" data-pole data-q="1.1">I</p><h2 data-k="phase1.nom"></h2><p class="serif-i phase-sous" data-k="phase1.sous"></p><p class="body" data-k="phase1.texte"></p></li>
    <li class="phase"><p class="phase-num"><span data-pole data-q="-1.1">I</span><span data-pole data-q="1.1">I</span></p><h2 data-k="phase2.nom"></h2><p class="serif-i phase-sous" data-k="phase2.sous"></p><p class="body" data-k="phase2.texte"></p></li>
    <li class="phase"><p class="phase-num" data-pole data-q="-1.2" data-pulse="1">III</p><h2 data-k="phase3.nom"></h2><p class="serif-i phase-sous" data-k="phase3.sous"></p><p class="body" data-k="phase3.texte"></p></li>
  </ol>
""" + suite(("projets/", "ui.suite.projets"), ("nous-rejoindre/", "ui.suite.rejoindre")) + """
</section>
</main>
"""

PROJETS = """<main id="contenu">
<section class="chapter page" data-level="1">
""" + page_head("ui.nav.projets") + """
  <article class="tour">
    <i class="anchor tour-anchor" data-pole data-q="1.4" data-pulse="1"></i>
    <p class="label" data-k="ui.premier"></p>
    <h2 class="tour-title" data-k="tour.titre"></h2>
    <p class="tour-chapeau serif-i" data-k="tour.chapeau"></p>
    <dl class="facts three">
      <div><dt data-k="ui.lieu"></dt><dd data-k="tour.fait.lieu"></dd></div>
      <div><dt data-k="ui.dates"></dt><dd data-k="tour.fait.dates"></dd></div>
      <div><dt data-k="ui.cadre"></dt><dd data-k="tour.fait.cadre"></dd></div>
    </dl>
    <div class="tour-text">
      <p class="lead" data-k="tour.desc.1"></p>
      <p class="body" data-k="tour.desc.2"></p>
      <p class="body" data-k="tour.desc.3"></p>
      <p class="body" data-k="tour.desc.4"></p>
      <p class="body role" data-k="tour.esprit"></p>
    </div>
    <div class="tour-side">
      <ul class="partners">
        <li><a href="https://studiochaos.ch/" rel="noopener" target="_blank"><b data-k="tour.partenaire.1"></b><span data-k="tour.partenaire.1.role"></span></a></li>
        <li><a href="https://www.structurals.ch/" rel="noopener" target="_blank"><b data-k="tour.partenaire.2"></b><span data-k="tour.partenaire.2.role"></span></a></li>
        <li><span class="nolink"><b data-k="tour.partenaire.3"></b><span data-k="tour.partenaire.3.role"></span></span></li>
        <li><a href="https://hint3rland.com/" rel="noopener" target="_blank"><b data-k="tour.partenaire.4"></b><span data-k="tour.partenaire.4.role"></span></a></li>
      </ul>
      <a class="cta" href="https://tourdespossibles.ch/" rel="noopener" target="_blank"><span data-k="ui.visiter"></span><i aria-hidden="true">↗</i></a>
    </div>
  </article>

  <div class="avenir">
    <p class="label" data-k="ui.avenir"></p>
    <p class="body" data-k="avenir.intro"></p>
    <ul class="avenir-list">
      <li><h3 data-k="avenir.1.nom"></h3><p class="meta" data-k="avenir.1.cadre"></p><p data-k="avenir.1.desc" data-need="une phrase sur le projet AI for Good"></p></li>
      <li><h3 data-k="avenir.2.nom"></h3><p data-k="avenir.2.desc" data-need="une phrase sur La Tour en Commun"></p></li>
      <li><h3 data-k="avenir.3.nom"></h3><p data-k="avenir.3.desc" data-need="une phrase sur le projet avec le GIFF"></p></li>
    </ul>
  </div>
""" + suite(("nous-rejoindre/", "ui.suite.rejoindre")) + """
</section>
</main>
"""

REJOINDRE = """<main id="contenu">
<section class="chapter page asso" data-level="0.35">
""" + page_head("ui.nav.rejoindre") + """
  <p class="lead narrow-in" data-k="asso.bio"></p>
  <p class="statement s serif-i narrow-in" data-k="rejoindre.appel"></p>

  <div class="asso-grid">
    <div class="people">
      <p class="label" data-k="ui.personnes"></p>
      <ul>
        <li><b data-k="personne.1"></b><span data-k="personne.1.org"></span><em data-k="personne.1.role" data-need="fonction"></em></li>
        <li><b data-k="personne.2"></b><span data-k="personne.2.org"></span><em data-k="personne.2.role" data-need="fonction"></em></li>
        <li><b data-k="personne.3"></b><span data-k="personne.3.org"></span><em data-k="personne.3.role" data-need="fonction"></em></li>
        <li><b data-k="personne.4"></b><span data-k="personne.4.org"></span><em data-k="personne.4.role" data-need="fonction au comité"></em></li>
        <li><b data-k="personne.5"></b><span data-k="personne.5.org"></span></li>
      </ul>
    </div>
    <dl class="facts col">
      <div><dt data-k="ui.forme"></dt><dd data-k="asso.fait.forme"></dd></div>
      <div><dt data-k="ui.constitution"></dt><dd data-k="asso.fait.constitution"></dd></div>
      <div><dt data-k="ui.ide"></dt><dd data-k="asso.fait.ide"></dd></div>
      <div><dt data-k="ui.siege"></dt><dd data-k="asso.fait.siege"></dd></div>
    </dl>
  </div>

  <details class="statuts">
    <summary><span class="label" data-k="ui.statuts"></span><i aria-hidden="true"></i></summary>
    <div class="statuts-body" lang="fr">
      <h4 data-k="ui.art1"></h4>
      <p data-k="asso.art1" data-fixed="fr"></p>
      <h4 data-k="ui.art3"></h4>
""" + "\n".join(f'      <p data-k="asso.art3.{i}" data-fixed="fr"></p>' for i in range(1, 7)) + """
    </div>
  </details>

  <div class="soutiens">
    <p class="label" data-k="ui.soutiens"></p>
    <p class="body" data-k="soutiens.liste" data-need="la liste des soutiens à publier"></p>
  </div>
</section>

<section id="contact" class="contact" data-level="1">
  <i class="anchor" style="left:10%;top:50%" data-pole data-q="1.3"></i><i class="anchor" style="left:90%;top:50%" data-pole data-q="-1.3"></i>
  <p class="label" data-k="ui.ecrire"></p>
  <a class="mail" href="mailto:contact@magnetic.ch" data-k="contact.mail"></a>
  <p class="addr" data-k="asso.fait.siege"></p>
</section>
</main>
"""


def legal(title_k, body):
    return f"""<main id="contenu" class="page-legal">
  <h1 data-k="{title_k}"></h1>
{body}
  <a class="back" data-page="" data-k="ui.retour"></a>
</main>
"""


ML = legal("ml.titre", "".join(f'  <h2 data-k="ml.{k}.titre"></h2>\n  <p data-k="ml.{k}"></p>\n' for k in ["editeur", "hebergeur", "droits", "signalement"])
           + '  <h2 data-k="ml.credits.titre"></h2>\n  <p data-k="ml.credits" data-need="crédits photographiques des images"></p>\n')
CONF = legal("conf.titre", "".join(f'  <p data-k="conf.{i}"></p>\n' for i in range(1, 5)))

PAGES = [
    ("index.html", "", None, None, ACCUEIL, True),
    ("esprit-de-geneve/index.html", "../", "esprit", "ui.nav.esprit", ESPRIT, True),
    ("notre-histoire/index.html", "../", "histoire", "ui.nav.histoire", HISTOIRE, True),
    ("manifeste/index.html", "../", "manifeste", "ui.nav.manifeste", MANIFESTE, True),
    ("methode/index.html", "../", "methode", "ui.nav.methode", METHODE, True),
    ("projets/index.html", "../", "projets", "ui.nav.projets", PROJETS, True),
    ("nous-rejoindre/index.html", "../", "rejoindre", "ui.nav.rejoindre", REJOINDRE, True),
    ("mentions-legales/index.html", "../", "legal", "ml.titre", ML, False),
    ("confidentialite/index.html", "../", "legal", "conf.titre", CONF, False),
]

for path, r, cur, title_k, body, field in PAGES:
    title_attr = f' data-title-k="{title_k}"' if title_k else ""
    html = head(r, title_k, field) + f'<body data-root="{r}" data-id="{cur or "accueil"}"{title_attr}>\n' + bar(cur) + body.replace('src="../assets/', f'src="{r}assets/') + FOOT
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print("écrit", path)
