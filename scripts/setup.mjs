// Scaffold du projet de la chaîne (UN projet pour toutes les vidéos, voir use.mjs) : Remotion + three.js, 9:16.
// Usage : node <skill>/scripts/setup.mjs <dossier> --name "Titre" [--w 1080 --h 1920] [--port 3012] [--plan espace_90_videos.json]
// - package.json + dépendances (versions éprouvées), tsconfig, remotion.config, launch.json
// - copie templates/base (socle générique) et les scripts du pipeline dans <dossier>/scripts
// - écrit des fichiers de config vides à remplir : scripts/vo-script.json, assets.json, process.json, audio.json
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.resolve(here, "..");
const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith("--")) || "film-video");
const opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const name = opt("name", "Film"), W = Number(opt("w", 1080)), H = Number(opt("h", 1920)), port = Number(opt("port", 3012));

fs.mkdirSync(dir, { recursive: true });
const pkg = {
  name: path.basename(dir).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
  private: true, type: "commonjs",
  scripts: { studio: `remotion studio --port ${port}`, render: "remotion render Film out/film.mp4 --gl=angle --codec=h264 --crf=18", typecheck: "tsc --noEmit", stills: "node scripts/stills.mjs --sheet" },
  dependencies: {
    "@react-three/fiber": "^9.8.1", "@remotion/cli": "4.0.529", "@remotion/fonts": "4.0.529", "@remotion/media-utils": "4.0.529",
    "@remotion/noise": "4.0.529", "@remotion/paths": "4.0.529", "@remotion/three": "4.0.529", "@remotion/bundler": "4.0.529", "@remotion/renderer": "4.0.529",
    postprocessing: "^6.39.5", react: "^19.3.0", "react-dom": "^19.3.0", remotion: "4.0.529", three: "^0.186.1",
  },
  devDependencies: { "@types/react": "^19.3.0", "@types/react-dom": "^19.3.0", "@types/three": "^0.186.0", sharp: "^0.35.5", typescript: "^5.9.0" },
};
fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2));

// copie récursive du socle
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else if (!fs.existsSync(d)) fs.copyFileSync(s, d);
  }
}
copyDir(path.join(skill, "templates", "base"), dir);
fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
for (const f of ["fal.mjs", "fal-models.json", "gen-assets.mjs", "process-assets.mjs", "contact-sheet.mjs", "gen-vo.mjs", "build-timeline.mjs", "gen-subs.mjs", "make-audio.mjs", "stills.mjs", "use.mjs", "browser.mjs", "render.mjs", "ingest.mjs"]) {
  fs.copyFileSync(path.join(skill, "scripts", f), path.join(dir, "scripts", f));
}
fs.mkdirSync(path.join(dir, "public", "assets", "raw"), { recursive: true });
fs.mkdirSync(path.join(dir, "public", "audio"), { recursive: true });
fs.mkdirSync(path.join(dir, "out"), { recursive: true });

// launch.json avec le bon port
const lj = path.join(dir, ".claude", "launch.json");
fs.mkdirSync(path.dirname(lj), { recursive: true });
fs.writeFileSync(lj, JSON.stringify({ version: "0.0.1", configurations: [{ name: "studio", runtimeExecutable: "npx", runtimeArgs: ["remotion", "studio", "--port", String(port)], port }] }, null, 2));

// configs à remplir
const w = (f, obj) => { const p = path.join(dir, "scripts", f); if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(obj, null, 2)); };
w("vo-script.json", {
  fps: 30, width: W, height: H, intro: 12, outro: 75, defaultGap: 10,
  voice: { voice: "", speed: 1.04, stability: 0.5, similarity: 0.75, style: 0.3, stt_language: "fra" },
  lines: [
    { id: "00-intro", text: "Le hook : une phrase choc, lisible en deux secondes.", label: "", sub: "", value: 0, gapAfter: 8 },
    { id: "01-step", text: "Le fait principal, avec un chiffre précis.", label: "", sub: "", value: 384400 },
    { id: "09-end", text: "La chute, puis la question pour les commentaires ?", label: "", sub: "", value: 384400, gapAfter: 0 },
  ],
  events: [
    { id: "impact", line: "01-step", at: "start", offset: 40 },
    { id: "blackout", line: "09-end", at: "end", offset: 12 },
    { id: "title", event: "blackout", offset: 20 },
  ],
});
w("assets.json", {
  styleSuffix: " Cinematic painterly space illustration, NASA concept-art feel, rich detail, strong rim light from top-left, deep saturated colors, no text, no watermark, no logo. The subject is isolated on a pure flat black background with generous margin around it, entire subject visible, no stars, no nebula, no glow outside the subject.",
  assets: [
    { id: "astronaut", hero: true, size: "1024x1024", seed: 11, prompt: "Bust portrait (head and shoulders) of a friendly young astronaut in a white spacesuit, helmet visor raised, facing the viewer directly, mouth closed, curious expression, no hands visible, lit by warm amber light from below-left and cool blue rim light from above-right." },
    { id: "capsule", hero: true, size: "1024x1024", seed: 12, prompt: "Small retro-futuristic space capsule seen from the side, slightly three-quarter, with one large round window in the center facing the viewer. The window glass is a solid flat pure magenta disc (RGB 255, 0, 255), perfectly uniform, no reflections, nothing visible inside. White and brushed-metal hull with small orange details." },
  ],
});
w("process.json", {
  trimPad: 4,
  ops: {
    capsule: { chroma: "magenta", hole: "porthole", points: { lamp: [820, 260] } },
    astronaut: { parts: { head: [160, 40, 860, 700], mouth: [400, 540, 624, 660], "brow-l": [360, 360, 500, 430], "brow-r": [524, 360, 664, 430] }, bodyClear: { box: [160, 40, 860, 640], featherFrom: 600 }, points: { neck: [512, 720], eyes: [[436, 460], [588, 460]] } },
  },
});
w("audio.json", { mood: "wonder", root: 36.71, pingsAtBeats: true, pulseFrom: null, heartbeatFrom: null, creaksFrom: null, riserBefore: "blackout", impacts: [{ event: "impact", level: 0.5 }], finalPing: "blackout", openingBubbles: false });

// timeline placeholder pour que le projet compile avant la voix
const tlp = path.join(dir, "src", "timeline.json");
if (!fs.existsSync(tlp)) fs.writeFileSync(tlp, JSON.stringify({ fps: 30, width: W, height: H, durationInFrames: 900, intro: 12, outro: 75, voice: "", speed: 1, beats: [
  { id: "00-intro", value: 0, text: "", label: "", sub: "", zone: "", voSrc: "", start: 12, dur: 150, end: 162, gapAfter: 8 },
  { id: "01-step", value: 384400, text: "", label: "", sub: "", zone: "", voSrc: "", start: 170, dur: 500, end: 670, gapAfter: 10 },
  { id: "09-end", value: 384400, text: "", label: "", sub: "", zone: "", voSrc: "", start: 680, dur: 150, end: 830, gapAfter: 0 },
], events: { impact: 210, blackout: 842, title: 862 } }, null, 2));
const sp = path.join(dir, "src", "subs.json");
if (!fs.existsSync(sp)) fs.writeFileSync(sp, JSON.stringify({ words: [] }));
// meta.json vide pour que les imports passent avant la génération des assets
const mp = path.join(dir, "public", "assets", "meta.json");
if (!fs.existsSync(mp)) fs.writeFileSync(mp, "{}");

// versions vierges, utilisées par use.mjs pour chaque nouvelle vidéo
for (const f of ["scripts/vo-script.json", "scripts/assets.json", "scripts/process.json", "scripts/audio.json", "src/film.config.ts", "src/scene/Story.tsx", "src/tags.ts", "src/timeline.json", "src/subs.json"]) {
  const d = path.join(dir, "templates-local", f);
  if (!fs.existsSync(d)) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(dir, f), d); }
}
const envp = path.join(dir, ".env");
// Si FAL_KEY est déjà dans l'environnement (variable du conteneur cloud), on n'écrit pas de .env vide : un `source .env` écraserait la vraie clé.
if (!fs.existsSync(envp) && !process.env.FAL_KEY) fs.writeFileSync(envp, "FAL_KEY=\n");
fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules\n.env\nout\npublic/audio\npublic/assets/raw-full\n");
const planArg = opt("plan", null);
if (planArg && fs.existsSync(planArg)) fs.copyFileSync(planArg, path.join(dir, "plan.json"));

fs.writeFileSync(path.join(dir, "FILM.md"), `# ${name}\n\nProjet de la chaîne, généré par le skill cosmos-shorts. Une vidéo à la fois (node scripts/use.mjs <ID>) :\n1. node scripts/use.mjs A01 --plan plan.json\n2. vo-script.json -> node scripts/gen-vo.mjs <voix> -> node scripts/build-timeline.mjs <voix> -> node scripts/gen-subs.mjs\n3. assets.json -> node scripts/gen-assets.mjs -> node scripts/contact-sheet.mjs -> process.json -> node scripts/process-assets.mjs\n4. audio.json -> node scripts/make-audio.mjs\n5. src/film.config.ts + src/scene/Story.tsx + src/tags.ts\n6. node scripts/stills.mjs --sheet ; npx remotion render Film out/<ID>.mp4 --gl=angle --codec=h264 --crf=18\n7. node scripts/use.mjs --save\n`);

console.log("npm install dans", dir, "(2 à 4 minutes)…");
execSync("npm install --no-audit --no-fund", { cwd: dir, stdio: "inherit" });
console.log("OK ->", dir);
