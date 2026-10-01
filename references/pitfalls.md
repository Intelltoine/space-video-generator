# Pièges connus

Les sections « Rendu headless », « Shaders » et « Outillage » viennent du skill d'origine (vérifiées en produisant
Abysses). Les sections fal.ai et sous-titres sont propres à cosmos-shorts.

## Rendu headless Remotion + three.js
- **Une seule frame three.js est dessinée par image rendue.** `@remotion/three` appelle `advance()` une fois
  dans un effet après le commit React. Tout ce qui arrive ensuite (texture chargée puis `setState`, passes
  de post-prod ajoutées dans un second commit) n'est jamais redessiné. Symptômes : canvas noir, sprites
  absents, alors que le Studio (boucle continue) affiche tout.
  Parades intégrées au socle : `Effects.tsx` construit l'`EffectComposer` de `postprocessing` de façon
  impérative (passes créées de manière synchrone) au lieu du wrapper `@react-three/postprocessing` ;
  `Film.tsx` précharge toutes les textures (`useTexturesReady`) et les pistes audio avant de monter le
  canvas ; `Readvance` redessine si un commit tardif survient.
- **Ne jamais mettre `setState` dans une boucle de rendu 3D.** Tout ce qui dépend de la frame se calcule
  dans `useLayoutEffect` (positions, uniformes) à partir de `frame`, sans état React.
- Vérifier avec `node scripts/stills.mjs <frames> --sheet` (rendu réel headless), pas seulement dans le
  Studio : le Studio cache exactement les bugs ci-dessus.

## Shaders
- `pow(x, k)` avec x légèrement négatif (bords de plans, `1.0 - abs(...)`) donne NaN, et le bloom
  (chaîne de mipmaps) propage le NaN en **gros bloc noir à bord net**. Toujours `pow(max(0.0, x), k)`.
- Les matériaux additifs (rayons, cônes) doivent avoir `depthWrite: false` et `transparent: true`.
- Un `MeshStandardMaterial` sur un plan est éclairé par la SpotLight ; un `MeshBasicMaterial` (unlit) ne
  l'est pas : utiliser `unlit` seulement pour ce qui est déjà « lumineux » (surface, portrait dans la cabine).

## Assets FLUX.2 + BiRefNet (fal.ai)
- FLUX.2 n'a pas de fond transparent : générer sur « pure flat black background », puis détourage BiRefNet
  (`gen-assets.mjs` le fait). Vérifier l'alpha en composant sur un fond uni (ffmpeg `overlay` sur
  `color=c=0x1e6fa0`) : une visionneuse affiche souvent l'alpha comme du noir.
- BiRefNet peut couper une atmosphère fine ou une couronne d'étoile : c'est voulu (le bloom refait le halo). S'il
  mange une partie du sujet (anneaux de Saturne transparents), passer l'asset en `cutout: false` + `fade: "radial"`.
- Le hublot magenta de la capsule peut être considéré comme « fond » par le détourage : s'il a disparu sur la
  planche, regénérer la capsule avec `cutout: false` et laisser `chroma: "magenta"` faire la découpe.
- Texte, logos, faux lettrages : regénérer avec un autre `seed` plutôt que retoucher.
- Orientation inversée (sonde tête à droite) : `flip` dans `Sprite3D` au lieu de regénérer.
- Un endpoint fal renommé renvoie 404 : corriger `scripts/fal-models.json`, pas les scripts.

## Voix ElevenLabs (fal.ai)
- Une réplique = un appel = un fichier ; `--only id` pour refaire une réplique sans tout regénérer.
- v3 est expressive mais peut improviser légèrement (mot ajouté, répété) : `gen-subs.mjs` le signale par un score
  d'alignement bas. Regénérer la réplique plutôt que corriger les sous-titres à la main.
- Balises d'émotion v3 (`[whispers]`, `[excited]`) : avec parcimonie, et jamais dans `display` (elles seraient
  affichées).
- Nettoyer les silences et normaliser (`build-timeline.mjs`) : sinon les gaps sont irréguliers.

## Sous-titres
- `src/subs.json` doit être regénéré après CHAQUE `build-timeline.mjs` (les frames changent).
- Groupes trop longs en 9:16 : baisser `SUBS.maxChars` (16) ou `fontSize` (68) plutôt que d'autoriser 3 lignes.

## Outillage
- L'outil Bash casse sur les heredocs contenant `#` et sur les heredocs en arrière-plan : écrire les
  fichiers avec l'outil Write.
- `preview_start` lit le `launch.json` du dossier de session : changer de dossier avant, ou lancer le
  Studio autrement pour un projet frère.
- Le rendu final : `npx remotion render Film out/<ID>.mp4 --gl=angle --concurrency=4` ; ~1 200 frames 1080×1920
  avec bloom : quelques minutes. Avec `--gl=swangle` (logiciel) ça marche aussi mais 2 à 3 fois plus lent.
- Le rendu ne s'écoute pas : mesurer `ffmpeg -af volumedetect` (viser moyenne −16 à −20 dB, crête < −0,5 dB)
  et le dire à l'utilisateur.
