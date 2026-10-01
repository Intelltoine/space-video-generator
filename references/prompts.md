# Prompts FLUX.2 pour des assets qui s'assemblent (fal.ai)

Principe : FLUX.2 ne sait pas produire de fond transparent. On génère donc chaque sujet **isolé sur un fond noir
uni**, puis `gen-assets.mjs` le détoure avec BiRefNet (PNG alpha). Le noir est idéal pour l'espace : un reste de
bord sombre ne se voit pas sur le vide. Un **suffixe de style unique** (`assets.json` → `styleSuffix`) garantit que
tous les assets ont l'air peints par la même main ; pas de fond, pas d'étoiles, pas de nébuleuse dans les prompts
d'objets : le fond, la profondeur et la lumière viennent de la 3D.

## Suffixe de style (défaut de la chaîne)
```
Cinematic painterly space illustration, NASA concept-art feel, rich detail, strong rim light from top-left,
deep saturated colors, no text, no watermark, no logo. The subject is isolated on a pure flat black background
with generous margin around it, entire subject visible, no stars, no nebula, no glow outside the subject.
```
Garder « rim light from top-left » quel que soit le sujet : la lumière directionnelle 3D (`sun`) vient du même côté.
Variante série E (histoire) : ajouter « 1960s space-age archival look, subtle film grain ».

## Astres (planètes, lunes, étoiles)
```
The planet <nom>, full disc seen from space, <signes distinctifs exacts : bandes, tache, glace fissurée…>,
terminator shadow on the right side, thin atmospheric rim.
```
- 1024x1024 ; `hero: true` pour l'astre principal.
- Vérifier la fidélité : couleur réelle, anneaux seulement s'ils existent, satellites cohérents.
- Étoiles, soleils, quasars : demander le disque et sa couronne « contained within the frame » ; le halo est ensuite
  fait par le bloom (`emissive`), pas par l'image.

## Objets et engins (sondes, fusées, stations, astéroïdes, comètes)
```
The <engin>, full side view facing left, <détails techniques exacts>, <panneaux solaires / antennes>.
```
- « facing left » : les modes `flag` / `breathe` supposent l'avant à gauche. Sinon `flip`.
- Longs objets (fusée couchée, station) : 1536x1024 ; hauts (fusée debout, jet) : 1024x1536.
- Pas de logo d'agence, pas d'inscription : « unmarked hull, no insignia, no lettering ».

## Décors plein cadre (sans détourage, `cutout: false`)
Nébuleuse lointaine, surface d'une planète qui occupe le bas, ciel d'une autre planète :
```
Distant <nébuleuse / champ d'étoiles>, soft and dim, low contrast, occupying the whole frame.
```
Puis `process.json` → `fade: "radial"` (nébuleuse) ou `fade: "top"` (sol) pour fondre les bords dans le vide.

## La mascotte (une fois pour toute la chaîne)
Portrait riggable :
```
Bust portrait (head and shoulders) of a friendly young astronaut in a white spacesuit, helmet visor raised,
facing the viewer directly, mouth closed, curious expression, no hands visible, lit by warm amber light from
below-left and cool blue rim light from above-right.
```
Capsule avec hublot à percer :
```
Small retro-futuristic space capsule seen from the side, slightly three-quarter, with one large round window in
the center facing the viewer. The window glass is a solid flat pure magenta disc (RGB 255, 0, 255), perfectly
uniform, no reflections, nothing visible inside.
```
Le disque magenta est percé par `process.json` → `chroma: "magenta"`. Fixer `seed` une fois la mascotte validée :
elle doit rester identique sur les 90 vidéos. Ne pas faire ressembler l'astronaute à une personne réelle.

## Révélation
```
A colossal <chose> emerging from absolute darkness, seen from the front, only <la partie visible> visible,
edges fading softly into black.
```
Posée en `noFog` avec `scaleY` qui s'ouvre (0,04 → 1) et `emissive` 0,7–0,9.

## Tailles et coûts (FLUX.2 [pro] sur fal)
1024x1024 = 1 MP = 0,03 $ ; 1536x1024 ≈ 1,5 MP arrondi à 2 MP = 0,045 $. En `--eco`, FLUX.2 [dev] (≈ 0,012 $/MP)
pour les assets secondaires ; les `hero` restent en pro.
