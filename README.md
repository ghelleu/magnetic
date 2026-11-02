# Magnetic · site de l'association

Site statique, sans dépendance ni étape de construction. Version de travail publiée sur **https://guillaumehelleu.com/magnetic/** ; destination finale : magnetic.ch.

## Ce qui est publié, ce qui ne l'est pas

Seul le dossier `public/` est servi (voir `.github/workflows/pages.yml`). Le reste du dépôt n'est jamais publié : `propositions/`, `tools/`, ce README.
Le dossier de passation (`MAGNETIC_SITE_HANDOFF`) ne doit jamais entrer dans ce dépôt.

```
public/
  index.html                 la page unique (structure seulement, aucun texte)
  mentions-legales/          page de service
  confidentialite/           page de service
  content/
    fr.js, en.js             textes VALIDÉS, recopiés à la lettre (source en commentaire)
    fr.propositions.js       PROPOSITIONS, À VALIDER (français)
    en.propositions.js       PROPOSITIONS, À VALIDER (anglais)
  assets/
    css/site.css             la mise en page
    js/field.js              le champ de limaille (canvas)
    js/content.js            pose les textes dans la page
    js/site.js               logotype, menu, relecture
    js/config.js             preview: true = version de travail
    js/logo.js               tracés exacts du logotype (depuis le PDF du deck)
    fonts/, img/
propositions/PROPOSITIONS.md liste générée des propositions et des emplacements à fournir
tools/verifier.mjs           contrôle à la lettre des textes validés
```

## Modifier un texte

Les textes sont séparés du code : on édite uniquement `public/content/`.

- **Valider une proposition** : couper sa ligne dans `fr.propositions.js` et la coller dans `fr.js` (même chose en anglais).
- **Remplir un emplacement** `[À FOURNIR : …]` : ajouter la clé indiquée dans `propositions/PROPOSITIONS.md`, avec son texte, dans le fichier voulu.
- `<br>` marque un retour à la ligne composé à la main ; sur mobile, ces retours s'effacent.

Puis lancer le contrôle :

```bash
node tools/verifier.mjs "<chemin>/MAGNETIC_SITE_HANDOFF/03_TEXTES_VALIDES"
```

Il vérifie que chaque texte validé figure mot pour mot dans sa source, regénère `propositions/PROPOSITIONS.md` et signale les tournures interdites par la charte dans les propositions.

## Relecture

Sur la version de travail, le bouton **Relecture** de la barre (ou `?relecture` dans l'adresse) souligne en bleu chaque proposition. Les emplacements à fournir sont toujours visibles, encadrés en rouge. `?lang=en` affiche l'anglais.

Avant la mise en ligne définitive : passer `preview` à `false` dans `assets/js/config.js`, retirer la balise `noindex` de chaque page, mettre l'URL de `og:image` sur le domaine final, ajouter `rel="canonical"`.

## Prévisualiser

```bash
cd public && python3 -m http.server 8080
```

## Publier

Un `git push` sur `main` publie `public/` par GitHub Actions, en une minute environ. Après chaque modification de CSS ou de JS, incrémenter le `?v=` des liens dans les trois pages HTML pour contourner le cache.

## magnetic.ch, le jour de la bascule

Le DNS est chez Infomaniak, avec la messagerie `contact@magnetic.ch`. **Ne jamais toucher aux enregistrements MX, SPF, DKIM ni DMARC.** Sauvegarder la zone, puis ne modifier que `@` et `www`. Vérifier ensuite le certificat HTTPS, la redirection `www`, l'image de partage, le rendu mobile et l'envoi d'un mail test.

## Choix de conception

- **La limaille** : des milliers d'aiguilles de fer s'orientent selon un champ dont les pôles sont des éléments de la page (`data-pole`, charge `data-q`). Le champ se recompose à mesure qu'on défile ; le curseur est un aimant de plus, un clic inverse sa polarité. Survoler un principe du manifeste renforce son pôle.
- **Le rouge et le bleu** sont réservés aux deux pôles, comme sur un aimant ; tout le reste est en encre graphite sur papier (ou l'inverse en mode sombre).
- **Polices** : Newsreader (texte, affirmations) et Archivo élargie (repères), hébergées avec le site, sous licence SIL OFL 1.1.
- **Sobriété** : aucun cookie, aucune mesure d'audience, aucune ressource tierce. `prefers-reduced-motion` donne un champ fixe, sans animation.
