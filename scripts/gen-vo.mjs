// Voix off via fal.ai (ElevenLabs), une réplique = un fichier. Convertit en wav 48 kHz mono.
// Usage : node scripts/gen-vo.mjs [voix] [--eco] [--only id,id] [--test]
//   voix  : nom ou voice_id ElevenLabs (défaut : vo-script.json -> voice.voice)
//   --eco : modèle tts_eco (moins cher, moins expressif)
//   --test: ne génère que la première réplique (pour comparer des voix)
// Lit scripts/vo-script.json : { voice: { voice, stability, similarity, style }, lines: [{ id, text }] }
// Sortie : public/audio/vo/<voix>/<id>.wav
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { falRun, models, retry, download, firstUrl } from "./fal.mjs";

const args = process.argv.slice(2);
const script = JSON.parse(fs.readFileSync(path.join("scripts", "vo-script.json"), "utf8"));
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--only");
const voice = positional[0] || script.voice?.voice;
if (!voice) throw new Error("aucune voix : passe un nom en argument ou renseigne voice.voice");
const M = models();
const model = args.includes("--eco") ? M.tts_eco : M.tts;
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1].split(",") : null;
let lines = script.lines.filter((l) => (only ? only.includes(l.id) : true));
if (args.includes("--test")) lines = lines.slice(0, 1);
const slug = voice.replace(/[^a-zA-Z0-9_-]/g, "_");
const outDir = path.join("public", "audio", "vo", slug);
fs.mkdirSync(outDir, { recursive: true });
const v = script.voice || {};

async function gen(line) {
  const input = { text: line.text, voice };
  if (v.stability !== undefined) input.stability = v.stability;
  if (v.similarity !== undefined) input.similarity_boost = v.similarity;
  if (v.style !== undefined) input.style = v.style;
  if (v.language_code) input.language_code = v.language_code;
  const out = await retry(() => falRun(model, input, { label: "tts " + line.id }), 3, line.id);
  const url = firstUrl(out);
  if (!url) throw new Error("pas d'audio dans la réponse : " + JSON.stringify(out).slice(0, 300));
  const tmp = path.join(outDir, line.id + ".src");
  await download(url, tmp);
  const wav = path.join(outDir, line.id + ".wav");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", tmp, "-ar", "48000", "-ac", "1", wav]);
  fs.unlinkSync(tmp);
  return wav;
}

// 3 requêtes en parallèle maximum
const res = [];
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => { while (i < lines.length) { const l = lines[i++]; res.push(await gen(l)); } }));
const chars = lines.reduce((s, l) => s + l.text.length, 0);
console.log(`${voice} (${model}) -> ${res.length} fichiers dans ${outDir} · ${chars} caractères`);
