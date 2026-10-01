# cosmos-shorts

Skill Claude pour produire les shorts verticaux (9:16, 30–45 s) de la chaîne Espace : de vrais petits films
animés Remotion + three.js, générés avec fal.ai (FLUX.2, ElevenLabs v3, Scribe v2) et publiés via BrightBean.

Adapté de [minosdevs/cinematic-film](https://github.com/minosdevs/cinematic-film) (licence MIT) : le moteur 3D
(caméra en plan-séquence, sprites déformés par shaders, narrateur riggé, post-prod, HUD) vient de ce projet.
Ajouts et changements : format vertical et zones sûres, client fal.ai et détourage BiRefNet à la place d'OpenAI,
sous-titres karaoké mot à mot réalignés sur le script, gestion de 90 vidéos dans un seul projet (`use.mjs`),
mascotte partagée, recettes par série (`references/space.md`), étape de publication.

Prérequis sur la machine : Node 20+, ffmpeg/ffprobe dans le PATH, une clé `FAL_KEY` (fichier `.env` du projet).

```bash
node scripts/setup.mjs ../chaine-espace --name "Chaîne Espace" --plan espace_90_videos.json
cd ../chaine-espace && node scripts/use.mjs A01
node scripts/gen-vo.mjs && node scripts/build-timeline.mjs "<voix>" && node scripts/gen-subs.mjs
node scripts/gen-assets.mjs && node scripts/contact-sheet.mjs && node scripts/process-assets.mjs
node scripts/make-audio.mjs && node scripts/stills.mjs --sheet
npx remotion render Film out/A01.mp4 --gl=angle --codec=h264 --crf=18 && node scripts/use.mjs --save
```

## Contenu du repo

| Chemin | Rôle |
|---|---|
| `SKILL.md` | le workflow suivi par Claude (cadrage → voix → sous-titres → assets → audio → mise en scène → rendu → publication) |
| `scripts/` | pipeline : `setup.mjs`, `use.mjs`, `fal.mjs`, `gen-vo.mjs`, `build-timeline.mjs`, `gen-subs.mjs`, `gen-assets.mjs`, `process-assets.mjs`, `contact-sheet.mjs`, `make-audio.mjs`, `stills.mjs` |
| `templates/base/` | moteur Remotion + three.js en 9:16 |
| `references/` | `space.md` (recettes par série), `prompts.md`, `wow.md`, `pitfalls.md` |
| `plan/` | les 90 vidéos (scripts, prompts, calendrier, budget) |

## Installer le skill dans Claude Code

```bash
git clone https://github.com/Intelltoine/space-video-generator ~/.claude/skills/cosmos-shorts
```
