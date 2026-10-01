---
name: cosmos-shorts
description: Fabrique les shorts verticaux (9:16, 30–45 s) de la chaîne d'Antoine sur l'Espace et l'univers — vrais petits films animés Remotion + three.js (caméra en plan-séquence, profondeur, particules, astronaute mascotte dans sa capsule, HUD de données, sous-titres karaoké mot à mot), avec fal.ai pour tout le génératif (FLUX.2 pour les assets détourés, ElevenLabs v3 pour la voix FR, Scribe v2 pour les timings) et BrightBean pour la publication. Utilise ce skill DÈS QUE l'utilisateur parle de la chaîne espace, d'une vidéo ou d'un short sur l'espace, les planètes, les étoiles, les trous noirs, la conquête spatiale, d'un ID du plan (A01, B08, E12…), du fichier espace_90_videos, de produire / rendre / programmer les vidéos du jour, de Remotion, fal.ai ou BrightBean pour une vidéo — même s'il ne dit pas « skill » ni « film ».
---

# cosmos-shorts — la chaîne Espace, un vrai film par short

Adapté du skill open source `cinematic-film` (minosdevs, licence MIT) : même moteur Remotion + three.js et même
philosophie (« un film, pas un diaporama »), mais recâblé pour la chaîne :

- **format** : vertical 1080×1920, 30–45 s, zones sûres TikTok / Reels / Shorts intégrées au HUD ;
- **génératif** : fal.ai uniquement (une seule clé `FAL_KEY`), modèles centralisés dans `scripts/fal-models.json` ;
- **sous-titres** : karaoké mot à mot, texte = script exact, timings = Scribe v2 réaligné (`gen-subs.mjs`) ;
- **production en série** : UN projet Remotion pour les 90 vidéos, on bascule de vidéo avec `use.mjs <ID>` ;
- **mascotte** : un astronaute dans sa capsule, générée une seule fois et réutilisée partout (identité de la chaîne) ;
- **musique et bruitages** : synthétisés (`make-audio.mjs`), zéro droit d'auteur, zéro coût ;
- **publication** : connecteur BrightBean, jamais sans validation d'Antoine.

`<skill>` = le dossier de ce SKILL.md. Tous les scripts s'exécutent depuis la racine du projet vidéo.

## Ce qu'il faut lire, et quand

| Fichier | Quand |
|---|---|
| `references/space.md` | à l'étape 1 : recette (axe, compteur, relevés, révélation) par série A à F, règles de faits et de hook |
| `references/wow.md` | à l'étape 1 aussi : les six leviers qui distinguent un film d'un collage |
| `references/prompts.md` | avant d'écrire `assets.json` (FLUX.2 + détourage, style commun, mascotte) |
| `references/pitfalls.md` | avant de toucher au moteur, ou si un rendu est noir ou vide |
| `templates/example-abysses/` | pour s'inspirer d'une chorégraphie complète (film 16:9 d'origine ; ses scripts OpenAI ne servent plus) |

## 0. Une seule fois : installer la chaîne

```
node <skill>/scripts/setup.mjs ../chaine-espace --name "Chaîne Espace" --plan <chemin>/espace_90_videos.json
```

Crée le projet (Remotion 4.0.529, three, r3f 9, postprocessing, sharp ; `npm install` 2–4 min), copie le plan en
`plan.json`, écrit `.env` (y mettre `FAL_KEY=...` ; ne jamais afficher la clé ni la committer) et `templates-local/`
(versions vierges utilisées pour chaque nouvelle vidéo). Vérifier : `npx tsc --noEmit` vert, puis
`node scripts/stills.mjs 100 --scale=0.4` produit une image (fond + particules) : le WebGL headless marche.

**La mascotte (une seule fois, avant la première vidéo)** : `node scripts/use.mjs A01`, puis
`node scripts/gen-assets.mjs astronaut capsule`, `node scripts/contact-sheet.mjs`, regarder la planche. Pour le rig,
`node scripts/contact-sheet.mjs --grid astronaut` et relever tête / bouche / sourcils / cou / yeux dans `process.json`.
Montrer 2–3 variantes à Antoine (seeds différents), faire valider, régler `NARRATOR` dans `src/film.config.ts`
(`align`, `headScale`, `offset`), puis `node scripts/use.mjs --save-mascotte` et reporter le bloc `NARRATOR` réglé
dans `templates-local/src/film.config.ts`. Ensuite, toutes les vidéos réutilisent la même mascotte.

**La voix (une seule fois)** : choisir 3 voix françaises natives dans la bibliothèque ElevenLabs, lancer
`node scripts/gen-vo.mjs "<voix>" --test` pour chacune (hook de A01), envoyer les 3 fichiers à Antoine. La voix
retenue va dans `templates-local/scripts/vo-script.json` → `voice.voice`. Une seule voix pour toute la chaîne.

## 1. Cadrer la vidéo et écrire les paliers (avant toute génération)

```
node scripts/use.mjs <ID>          # ex. A01 ; crée le brouillon depuis plan.json la première fois
```

Le brouillon découpe le script du plan en répliques de 1–2 phrases et reprend titre, question finale et légende
(`videos/<ID>/publish.json`). Ensuite, en s'appuyant sur `references/space.md` pour la série :

1. Choisir **l'axe** (on avance vers un astre, on décolle, on longe une rangée d'objets…) et **le compteur**
   (km, années-lumière, °C, année, × la Terre…). Régler `CAMERA` et `HUD` dans `src/film.config.ts`.
2. Écrire dans le chat le tableau des paliers : `réplique | valeur du compteur | ce qu'on voit | le fait dit`.
   Chaque palier = une chose à voir + une chose à savoir. Prévoir un **événement physique** au milieu (`impact`,
   explosion, freinage) et une **révélation** juste avant le noir.
3. **Vérifier chaque chiffre** contre une source fiable (NASA, ESA, CNES, publications de référence). En cas de
   doute, reformuler prudemment plutôt qu'affirmer. Si le plan contient une imprécision, corriger le script et le
   signaler à Antoine.
4. Compléter `scripts/vo-script.json` : `value` par réplique (valeur du compteur), `label` / `sub` courts si utiles
   (souvent vides en 9:16 : les sous-titres suffisent), `events` (`impact`, `reveal`, `blackout`, `title`).
   Garder les chiffres en chiffres dans `text` (ElevenLabs v3 les lit bien en français). Si une lecture sonne faux,
   écrire le nombre en lettres dans `text` et mettre la version chiffrée dans `display` (affichée à l'écran).
5. Attendre le go d'Antoine sur le tableau, sauf s'il a dit « enchaîne » ou « je te laisse gérer ».

Durée cible : 30–45 s, soit ~70–110 mots. Le **hook** (première réplique) doit se comprendre en 2 secondes et
l'image doit déjà bouger à la frame 0 (`rampIn` court, particules actives, mascotte visible).

## 2. Voix, timeline, sous-titres (la timeline est la colonne vertébrale)

```
node scripts/gen-vo.mjs              # voix de vo-script.json ; --only 02-l2 pour refaire une réplique ; --eco = moins cher
node scripts/build-timeline.mjs "<voix>" 1.04
node scripts/gen-subs.mjs
```

`build-timeline` nettoie les silences, accélère de 4 % (imperceptible ; jamais au-delà de 1.10), normalise et écrit
`src/timeline.json`. Si la vidéo dépasse 45 s, raccourcir des répliques plutôt qu'accélérer.
`gen-subs` affiche « N/M mots alignés » par réplique : sous 80 %, réécouter la réplique (mot avalé, voix qui
improvise) et la regénérer avec `--only`, puis relancer `build-timeline` et `gen-subs`. Les sous-titres affichent
toujours le texte du script, jamais la transcription.

## 3. Assets (FLUX.2 sur fond noir → détourage BiRefNet)

Lire `references/prompts.md`. Remplacer `draftScenes` de `scripts/assets.json` par de vrais assets **isolés** :
astres, sondes, objets de comparaison, décor lointain (nébuleuse en `cutout: false`), révélation. 5–9 assets par
vidéo, `hero: true` pour les 1–2 qui portent la vidéo. La mascotte est déjà dans `public/assets/raw`.

```
node scripts/gen-assets.mjs          # 4 en parallèle, reprend là où ça s'est arrêté ; --force <id> ; --eco
node scripts/contact-sheet.mjs       # puis REGARDER public/assets/contact-sheet.png
node scripts/process-assets.mjs      # rognage, chroma du hublot, pièces du rig -> public/assets/*.png + meta.json
```

Sur la planche, chercher : halo noir resté autour d'un astre (regénérer, ou `fade: "radial"` dans `process.json`),
texte ou logo parasite (regénérer avec un autre seed), orientation (sonde « facing left » attendue par les
shaders), style incohérent. Si une image est ratée, regarder la brute dans `public/assets/raw-full/`.

## 4. Musique et bruitages

`scripts/audio.json` : `mood` d'après `publish.json` → `musique` (mystery → `dark-ambient`, tension → `tension`,
epic → `epic`, wonder / calm / retro → `wonder`), `impacts` sur `impact` / `reveal`, `riserBefore: "blackout"`,
`heartbeatFrom` pour les sujets angoissants (trou noir, casque retiré). Puis `node scripts/make-audio.mjs`.

## 5. Mise en scène

- `src/film.config.ts` : `CAMERA`, `ENV_KEYS` (teinte du vide, densité de poussière d'étoiles), `HUD` (compteur,
  relevés, titre = titre du plan, tagline = question), `SUBS` (taille, couleur du mot actif), `NARRATOR`.
- `src/scene/Story.tsx` : placer les astres avec `anchorPos(repliqueId, u, v, z)`, écrire les trajectoires,
  choisir les modes `Sprite3D`, préparer la révélation. Remplacer l'id générique `SECOND` par les vrais ids.
- `src/tags.ts` : étiquettes ancrées courtes (« Io · 400 volcans actifs »).

Règles 9:16 (détail dans `references/space.md`) : à z = 0, la largeur utile va de x ≈ −5 à +5 ; la profondeur
remplace la largeur. Le haut-gauche est au HUD, le haut-droit à la mascotte, la bande à 60 % aux sous-titres. Le bas
(≈ 20 %) et la colonne de droite appartiennent à l'interface des réseaux : rien d'important dedans.

## 6. Vérifier avec des images fixes headless

```
node scripts/stills.mjs <6 à 8 frames dont le hook et la révélation> --scale=0.4 --sheet
```

Regarder `out/stills/sheet.png`. En plus des contrôles de `pitfalls.md` : sous-titres lisibles et au-dessus des
78 % de hauteur, mot actif synchronisé (comparer avec `src/subs.json`), rien d'important dans les zones
d'interface, mascotte bien dans son hublot, compteur plausible à chaque palier.

## 7. Rendre

Si un connecteur Remotion est disponible dans la conversation, l'utiliser pour rendre la composition `Film` avec
les mêmes réglages. Sinon :

```
npx remotion render Film out/<ID>.mp4 --gl=angle --codec=h264 --crf=18 --concurrency=4
```

Puis : `ffprobe` (durée, vidéo 1080×1920 + audio), 3 images extraites (`ffmpeg -ss`) aux moments non vus,
`ffmpeg -af volumedetect` (moyenne −16 à −20 dB). Dire clairement que le mix n'a pas été écouté et comment ajuster
(`musicVolume`, `sfxVolume`, `voiceVolume` sont des props de la composition). Enfin `node scripts/use.mjs --save`.

## 8. Publier (BrightBean), toujours après validation

Montrer à Antoine la vidéo, la légende de `publish.json` (corrigée si le script a changé), le créneau (jour / heure
du plan) et le coût de la vidéo. Seulement après son feu vert, programmer via le connecteur BrightBean sur TikTok,
Reels et Shorts, avec le label « contenu généré par IA » activé. Si BrightBean n'est pas connecté, livrer le MP4 et
la légende prêts à coller.

## Rythme : 3 vidéos par jour

Traiter une journée du plan à la fois (3 IDs). Enchaîner les étapes 1 à 7 pour chaque vidéo, montrer les trois
ensemble, publier après validation. Ne jamais sauter la vérification des faits ni la planche d'images fixes pour
aller plus vite. `node scripts/use.mjs --list` donne l'état de chaque vidéo.

## Coût indicatif par vidéo (prix fal.ai relevés fin septembre 2026, à revérifier)

| Poste | Estimation |
|---|---|
| Voix ElevenLabs v3 (~500 caractères à 0,10 $ / 1 000) | ~0,05 $ |
| Timings Scribe v2 (~0,6 min à 0,008 $ / min) | < 0,01 $ |
| 5–9 assets FLUX.2 [pro] 1024² (0,03 $ pièce) | 0,15–0,30 $ |
| Détourage BiRefNet | tarif à vérifier sur fal (faible) |
| Musique, bruitages, rendu local | 0 $ |
| **Total avec ~30 % de regénérations** | **~0,30–0,50 $** |

La mascotte n'est payée qu'une fois. Pas de clip image-to-video : c'est le moteur 3D qui anime.

## Pièges à connaître avant de coder

Lire `references/pitfalls.md`. Les trois qui coûtent des heures : (1) en headless, Remotion ne dessine qu'une frame
three.js par image — composer impératif, préchargement et `Readvance` du socle, à ne pas contourner ; (2) `pow()`
d'une base négative dans un shader → NaN → bloc noir via le bloom ; (3) un id de réplique inconnu dans `Story.tsx`
ou `tags.ts` (`beat("...")`) fait planter tout le rendu : après `use.mjs`, les ids viennent du nouveau script.
