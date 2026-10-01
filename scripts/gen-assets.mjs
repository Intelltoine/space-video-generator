// Assets via fal.ai : FLUX.2 génère le sujet sur fond noir, BiRefNet le détoure (PNG alpha).
// Usage : node scripts/gen-assets.mjs [id ...] [--force] [--eco]
// scripts/assets.json :
// { "styleSuffix": "...",
//   "assets": [ { "id": "earth", "prompt": "...", "size": "1024x1024", "seed": 7, "cutout": true, "hero": true } ] }
//   size   : 1024x1024 | 1536x1024 (large) | 1024x1536 (haut)
//   cutout : true (défaut) = détourage BiRefNet ; false = image pleine (fond de ciel, nébuleuse plein cadre)
//   hero   : modèle pro même avec --eco
// Sorties : public/assets/raw/<id>.png (détouré) et public/assets/raw-full/<id>.png (image brute)
import fs from "node:fs";
import path from "node:path";
import { falRun, models, retry, download, firstUrl, dataUri } from "./fal.mjs";

const manifest = JSON.parse(fs.readFileSync("scripts/assets.json", "utf8"));
const args = process.argv.slice(2);
const force = args.includes("--force"), eco = args.includes("--eco");
const only = args.filter((a) => !a.startsWith("--"));
const M = models();
const outDir = "public/assets/raw", fullDir = "public/assets/raw-full";
fs.mkdirSync(fullDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
const queue = manifest.assets.filter((a) => (only.length ? only.includes(a.id) : true));
let cost = 0;

async function gen(a) {
  const out = path.join(outDir, a.id + ".png"), full = path.join(fullDir, a.id + ".png");
  if (!force && fs.existsSync(out)) return console.log("skip", a.id);
  const t0 = Date.now();
  const [w, h] = (a.size || "1024x1024").split("x").map(Number);
  const model = eco && !a.hero ? M.image_eco : M.image;
  const input = { prompt: a.prompt + (manifest.styleSuffix || ""), image_size: { width: w, height: h }, output_format: "png" };
  if (a.seed !== undefined) input.seed = a.seed;
  const img = await retry(() => falRun(model, input, { label: "image " + a.id }), 3, a.id);
  const url = firstUrl(img);
  if (!url) throw new Error("pas d'image : " + JSON.stringify(img).slice(0, 300));
  await download(url, full);
  cost += model === M.image ? 0.03 + 0.015 * Math.max(0, Math.ceil((w * h) / 1048576) - 1) : 0.012 * (w * h) / 1048576;
  if (a.cutout === false) {
    fs.copyFileSync(full, out);
  } else {
    const cut = await retry(() => falRun(M.cutout, { image_url: dataUri(full), output_format: "png" }, { label: "cutout " + a.id }), 3, a.id);
    const cu = firstUrl(cut);
    if (!cu) throw new Error("pas de détourage : " + JSON.stringify(cut).slice(0, 300));
    await download(cu, out);
  }
  console.log("ok", a.id, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
const CONC = 4;
let i = 0;
const failed = [];
await Promise.all(Array.from({ length: CONC }, async () => {
  while (i < queue.length) { const a = queue[i++]; try { await gen(a); } catch (e) { failed.push(a.id); console.log("FAILED", a.id, e.message); } }
}));
console.log(`done -> ${outDir} · images ≈ ${cost.toFixed(2)} $ (hors détourage)` + (failed.length ? ` · échecs : ${failed.join(", ")}` : ""));
