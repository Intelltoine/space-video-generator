// Range dans le projet un fichier produit via le connecteur Fal (claude.ai), au bon endroit et au bon format.
// Usage :
//   node scripts/ingest.mjs vo <voix> <repliqueId> <url|fichier>     -> public/audio/vo/<voix>/<id>.wav (48 kHz mono)
//   node scripts/ingest.mjs asset <assetId> <url|fichier> [--full]   -> public/assets/raw/<id>.png (détouré)
//                                                                      ou raw-full/<id>.png avec --full (image brute)
//   node scripts/ingest.mjs stt <repliqueId> <fichier.json>          -> scripts/stt/<id>.json (sortie Scribe brute)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [kind, ...rest] = process.argv.slice(2);
async function fetchTo(src, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`HTTP ${r.status} sur ${src}`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  } else fs.copyFileSync(src, out);
  return out;
}
if (kind === "vo") {
  const [voice, id, src] = rest;
  const dir = path.join("public", "audio", "vo", voice.replace(/[^a-zA-Z0-9_-]/g, "_"));
  const tmp = await fetchTo(src, path.join(dir, id + ".src"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-ar", "48000", "-ac", "1", path.join(dir, id + ".wav")]);
  fs.unlinkSync(tmp);
  console.log("ok voix", id);
} else if (kind === "asset") {
  const [id, src] = rest;
  const out = path.join("public", "assets", rest.includes("--full") ? "raw-full" : "raw", id + ".png");
  const tmp = await fetchTo(src, out + ".src");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, out]); // convertit jpg/webp -> png
  fs.unlinkSync(tmp);
  console.log("ok asset", id, "->", out);
} else if (kind === "stt") {
  const [id, src] = rest;
  await fetchTo(src, path.join("scripts", "stt", id + ".json"));
  console.log("ok stt", id);
} else {
  console.log("usage : node scripts/ingest.mjs vo|asset|stt …");
  process.exit(1);
}
