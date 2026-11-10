#!/usr/bin/env node
/* Contrôle des textes du site Magnetic.
   1. Chaque texte VALIDÉ (content/fr.js, content/en.js) doit figurer mot pour mot dans sa source.
   2. Les propositions sont listées dans propositions/PROPOSITIONS.md, avec leur source.
   3. Les propositions sont passées au crible de la charte (tirets, antithèses, « ni… ni… »).

   Usage : node tools/verifier.mjs <dossier 03_TEXTES_VALIDES> [<deck en.json>]
   Les sources restent hors du dépôt : elles ne sont jamais publiées. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const srcDir = process.argv[2];
const enJson = process.argv[3] || path.join(process.env.HOME, "Projects/magnetic-deck/content/en.json");
if (!srcDir) { console.error("Usage : node tools/verifier.mjs <dossier 03_TEXTES_VALIDES> [<deck en.json>]"); process.exit(2); }

const ctx = { window: {} }; ctx.window.MAG = {}; ctx.MAG = ctx.window.MAG;
vm.createContext(ctx);
for (const f of ["fr.js", "fr.propositions.js", "en.js", "en.propositions.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "public/content", f), "utf8"), ctx);
}
const MAG = ctx.MAG;

const norm = (s) => s
  .replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
  .replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

const frCorpus = norm(fs.readdirSync(srcDir).filter((f) => f.endsWith(".txt"))
  .map((f) => fs.readFileSync(path.join(srcDir, f), "utf8")
    .replace(/^R\d+ [^|]*\|\| /gm, " ")         // fiche festival : retirer l'intitulé des lignes
    .replace(/^--- p\d+$/gm, " "))
  .join(" "));
let enCorpus = "";
try {
  const d = JSON.parse(fs.readFileSync(enJson, "utf8"));
  const walk = (o) => { for (const v of Object.values(o)) typeof v === "string" ? (enCorpus += " " + v) : v && typeof v === "object" && walk(v); };
  walk(d); enCorpus = norm(enCorpus);
} catch { console.warn("Deck anglais introuvable : " + enJson); }

/* Libellés d'interface, faits et noms propres : contrôlés à part (ce ne sont pas des textes recopiés). */
const isData = (k) => /^(ui\.|personne\.|asso\.fait\.|tour\.fait\.|tour\.partenaire\.|img\.|contact\.)/.test(k) || k === "tour.titre";
const exceptions = {
  "fr:signature": "pour que la créativité impact le monde",   // faute corrigée à la demande de Guillaume (2 nov. 2026)
};

let fail = 0, ok = 0;
for (const [lang, corpus] of [["fr", frCorpus], ["en", enCorpus]]) {
  for (const [k, v] of Object.entries(MAG[lang] || {})) {
    if (isData(k)) continue;
    const want = norm(exceptions[`${lang}:${k}`] || v);
    // les titres s'affichent en capitales : la casse de la source (capitales du deck) ne compte pas
    const titled = /\.(titre|nom)$/.test(k) && corpus.toLowerCase().includes(want.toLowerCase());
    if (corpus.includes(want) || titled) { ok++; continue; }
    fail++;
    console.log(`ÉCART  ${lang}  ${k}\n       « ${norm(v)} »`);
  }
}

/* Charte : uniquement sur les propositions */
const charte = [
  [/[—–]/, "tiret cadratin ou demi-cadratin"],
  [/\b(ne|n’|n')\s*\S+\s+pas\s+\S+,?\s+(mais|c’est|c'est)\b/i, "antithèse possible"],
  [/\bnon pas\b|\bplus qu’un\b|\bpas seulement\b/i, "antithèse"],
  [/\bni\b[^.]*\bni\b[^.]*\bmais\b/i, "« ni… ni… mais… »"],
];
const alerts = [];

/* Propositions, avec la source lue dans les commentaires du fichier */
function withSources(file) {
  const lines = fs.readFileSync(path.join(root, "public/content", file), "utf8").split("\n");
  const out = []; let note = [], inC = false;
  for (const raw of lines) {
    let l = raw.trim();
    const kv = !inC && l.match(/^"([^"]+)":\s*"(.*)",?$/);
    if (kv) { out.push({ k: kv[1], v: kv[2], src: note.join(" ").trim() }); continue; }
    if (l.startsWith("//")) { note = [l.slice(2).trim()]; continue; }
    if (l.startsWith("/*")) { inC = true; note = []; l = l.slice(2); }
    if (inC) {
      const end = l.includes("*/"); l = l.replace("*/", "").replace(/-{3,}/g, "").trim();
      if (l) note.push(l);
      if (end) inC = false;
    }
  }
  return out;
}
let md = "# Propositions à valider\n\nFichier généré par `node tools/verifier.mjs`. Ne pas éditer à la main : les textes vivent dans `public/content/*.propositions.js`.\n\nPour valider un texte, déplacer sa ligne vers `fr.js` (ou `en.js`). Pour le corriger, l'éditer directement dans le fichier de propositions.\n";
for (const [file, title] of [["fr.propositions.js", "Français"], ["en.propositions.js", "English"]]) {
  md += `\n## ${title}\n`;
  let last = "";
  for (const p of withSources(file)) {
    if (p.src && p.src !== last) { md += `\n> ${p.src}\n`; last = p.src; }
    md += `\n- **${p.k}** : ${norm(p.v)}\n`;
    for (const [re, why] of charte) if (re.test(norm(p.v))) alerts.push(`${file} ${p.k} : ${why}`);
  }
}

/* Emplacements à fournir déclarés dans les pages */
const todo = [];
const pages = [];
const walkHtml = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walkHtml(f); else if (e.name.endsWith(".html")) pages.push(path.relative(path.join(root, "public"), f)); } };
walkHtml(path.join(root, "public"));
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, "public", page), "utf8");
  for (const m of html.matchAll(/data-k="([^"]+)"[^>]*?data-need="([^"]+)"/g)) {
    for (const l of ["fr", "en"]) if (!(m[1] in (MAG[l] || {})) && !(m[1] in (MAG[l + "_prop"] || {}))) todo.push(`${l}  ${m[1]} : ${m[2]}`);
  }
}
md += "\n## À fournir\n\n" + [...new Set(todo)].map((t) => `- ${t}`).join("\n") + "\n";
fs.mkdirSync(path.join(root, "propositions"), { recursive: true });
fs.writeFileSync(path.join(root, "propositions/PROPOSITIONS.md"), md);

console.log(`\nTextes validés conformes à la source : ${ok}, écarts : ${fail}`);
console.log(`Emplacements à fournir : ${new Set(todo).size}`);
if (alerts.length) console.log("Charte, à relire :\n  " + alerts.join("\n  ")); else console.log("Charte : aucune alerte sur les propositions.");
process.exit(fail ? 1 : 0);
