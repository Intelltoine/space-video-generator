// Gestion des vidéos dans UN SEUL projet Remotion (pas de npm install par vidéo).
// Chaque vidéo vit dans videos/<ID>/ ; les fichiers « actifs » (lus par Remotion et les scripts) sont échangés.
// Usage :
//   node scripts/use.mjs <ID> [--plan chemin/espace_90_videos.json]   active la vidéo <ID> (la crée depuis le plan si besoin)
//   node scripts/use.mjs --save                                      sauvegarde la vidéo active dans videos/<ID>/
//   node scripts/use.mjs --list                                      liste les vidéos et leur état
//   node scripts/use.mjs --save-mascotte                             fige l'astronaute + la capsule pour toutes les vidéos
// La mascotte (astronaute + capsule) est générée une fois puis copiée depuis mascotte/ dans chaque vidéo.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : null; };
const ACTIVE = ".active";
const FILES = ["scripts/vo-script.json", "scripts/assets.json", "scripts/process.json", "scripts/audio.json",
  "src/film.config.ts", "src/scene/Story.tsx", "src/tags.ts", "src/timeline.json", "src/subs.json"];
const DIRS = ["public/assets", "public/audio"];

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
function copy(src, dst) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src)) copy(path.join(src, e), path.join(dst, e)); }
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
}
const active = () => (fs.existsSync(ACTIVE) ? fs.readFileSync(ACTIVE, "utf8").trim() : null);

function save() {
  const id = active(); if (!id) return console.log("aucune vidéo active");
  const dir = path.join("videos", id);
  for (const f of FILES) copy(f, path.join(dir, f));
  for (const d of DIRS) { rm(path.join(dir, d)); copy(d, path.join(dir, d)); }
  console.log("sauvegardé ->", dir);
}

// découpe le script du plan en répliques de 1-2 phrases (~70-150 caractères) : une réplique = un palier visuel
function splitLines(text) {
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g).map((s) => s.trim()).filter(Boolean);
  const out = []; let cur = "";
  for (const s of sentences) { if (cur && (cur + " " + s).length > 150) { out.push(cur); cur = s; } else cur = cur ? cur + " " + s : s; if (cur.length >= 70) { out.push(cur); cur = ""; } }
  if (cur) { if (out.length && cur.length < 40) out[out.length - 1] += " " + cur; else out.push(cur); }
  return out;
}

function fromPlan(id, planPath) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const v = plan.videos.find((x) => x.id === id);
  if (!v) throw new Error(`vidéo ${id} absente du plan`);
  const base = JSON.parse(fs.readFileSync("scripts/vo-script.json", "utf8"));
  const lines = splitLines(v.script).map((t, i, a) => ({ id: `${String(i).padStart(2, "0")}-${i === 0 ? "hook" : i === a.length - 1 ? "end" : "l" + i}`, text: t, label: "", sub: "", value: i, gapAfter: i === 0 ? 8 : 10 }));
  const vo = { ...base, intro: 12, outro: 75, defaultGap: 10, lines, events: [{ id: "blackout", line: lines[lines.length - 1].id, at: "end", offset: 12 }, { id: "title", event: "blackout", offset: 20 }] };
  const dir = path.join("videos", id);
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts/vo-script.json"), JSON.stringify(vo, null, 2));
  const strip = (s) => s.replace(/^.*?Scene: /, "");
  const assets = JSON.parse(fs.readFileSync("scripts/assets.json", "utf8"));
  assets.assets = assets.assets.filter((a) => ["astronaut", "capsule"].includes(a.id));
  assets.draftScenes = v.scenes.map(strip);
  fs.writeFileSync(path.join(dir, "scripts/assets.json"), JSON.stringify(assets, null, 2));
  fs.writeFileSync(path.join(dir, "publish.json"), JSON.stringify({ id: v.id, titre: v.titre, jour: v.jour, heure: v.heure, caption: v.caption, serie: v.serie, sfx: v.sfx, musique: v.musique }, null, 2));
  // config de film : copie de la config active avec titre / question finale du plan
  let cfg = fs.readFileSync(fs.existsSync("templates-local/src/film.config.ts") ? "templates-local/src/film.config.ts" : "src/film.config.ts", "utf8");
  const q = (v.caption.split("\n")[1] || "").replace(/"/g, "'");
  cfg = cfg.replace(/title: "[^"]*"/, `title: "${v.titre.replace(/"/g, "'").toUpperCase()}"`).replace(/tagline: "[^"]*"/, `tagline: "${q}"`);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src/film.config.ts"), cfg);
  console.log(`brouillon créé depuis le plan -> ${dir} (${lines.length} répliques). À relire : vo-script.json (paliers, valeurs, événements), assets.json (draftScenes -> vrais assets détourés), Story.tsx.`);
}

function restore(id) {
  const dir = path.join("videos", id);
  // fichier propre à la vidéo s'il existe, sinon version vierge du socle (templates-local/, écrit par setup.mjs)
  for (const f of FILES) {
    if (fs.existsSync(path.join(dir, f))) copy(path.join(dir, f), f);
    else if (fs.existsSync(path.join("templates-local", f))) copy(path.join("templates-local", f), f);
  }
  for (const d of DIRS) { rm(d); fs.mkdirSync(d, { recursive: true }); copy(path.join(dir, d), d); }
  fs.mkdirSync("public/assets/raw", { recursive: true });
  if (fs.existsSync("mascotte/raw")) copy("mascotte/raw", "public/assets/raw"); // astronaute + capsule partagés
  if (!fs.existsSync("public/assets/meta.json")) fs.writeFileSync("public/assets/meta.json", "{}");
  fs.writeFileSync(ACTIVE, id);
  console.log("vidéo active :", id);
}

if (args.includes("--list")) {
  const ids = fs.existsSync("videos") ? fs.readdirSync("videos") : [];
  for (const id of ids.sort()) {
    const d = path.join("videos", id);
    const st = fs.existsSync(path.join("out", id + ".mp4")) ? "rendue" : fs.existsSync(path.join(d, "src/subs.json")) && JSON.parse(fs.readFileSync(path.join(d, "src/subs.json"), "utf8")).words.length ? "voix + sous-titres" : fs.existsSync(path.join(d, "scripts/vo-script.json")) ? "brouillon" : "?";
    console.log(id.padEnd(6), st, id === active() ? "(active)" : "");
  }
} else if (args.includes("--save-mascotte")) {
  // fige la mascotte validée : images brutes + réglages de découpe réutilisés par toutes les vidéos suivantes
  const ids = ["astronaut", "capsule"];
  fs.mkdirSync("mascotte/raw", { recursive: true });
  for (const i of ids) copy(`public/assets/raw/${i}.png`, `mascotte/raw/${i}.png`);
  const cur = JSON.parse(fs.readFileSync("scripts/process.json", "utf8"));
  const tp = "templates-local/scripts/process.json";
  const tpl = JSON.parse(fs.readFileSync(tp, "utf8"));
  for (const i of ids) if (cur.ops?.[i]) tpl.ops[i] = cur.ops[i];
  fs.writeFileSync(tp, JSON.stringify(tpl, null, 2));
  console.log("mascotte figée -> mascotte/raw + " + tp + ". Reporte aussi le bloc NARRATOR réglé dans templates-local/src/film.config.ts.");
} else if (args.includes("--save")) save();
else {
  const id = args.find((a) => !a.startsWith("--") && a !== opt("plan"));
  if (!id) throw new Error("usage : node scripts/use.mjs <ID> [--plan plan.json]");
  if (active() && active() !== id) save();
  if (!fs.existsSync(path.join("videos", id, "scripts", "vo-script.json"))) {
    const plan = opt("plan") || (fs.existsSync("plan.json") ? "plan.json" : null);
    if (!plan) throw new Error(`videos/${id} n'existe pas : passe --plan <espace_90_videos.json> (ou copie-le en plan.json)`);
    fromPlan(id, plan);
  }
  restore(id);
}
