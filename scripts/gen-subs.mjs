// Sous-titres mot à mot : Scribe v2 (fal.ai) donne les timings, le texte vient TOUJOURS du script
// (aucune faute de transcription possible à l'écran). À lancer après build-timeline.mjs.
// Usage : node scripts/gen-subs.mjs   (utilise scripts/stt/<id>.json s'il existe : sortie Scribe obtenue via le connecteur Fal)
// Par réplique de vo-script.json : `text` (ce qui est dit) et `display` optionnel (ce qui est affiché,
// ex. chiffres au lieu de lettres). Sortie : src/subs.json { words: [{ t, from, to, line, emph }] }
import fs from "node:fs";
import path from "node:path";
import { falRun, models, retry, dataUri } from "./fal.mjs";

const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const script = JSON.parse(fs.readFileSync("scripts/vo-script.json", "utf8"));
const M = models();
const FPS = tl.fps;
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
// ponctuation isolée (« : », « ? », « — ») collée au mot précédent : un mot affiché = un mot dit
const tokens = (s) => s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean)
  .reduce((acc, t) => { if (acc.length && !/[\p{L}\p{N}]/u.test(t)) acc[acc.length - 1] += " " + t; else acc.push(t); return acc; }, []);

// alignement global (Needleman-Wunsch) entre mots du script et mots transcrits
function align(a, b) {
  const n = a.length, m = b.length, D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1)), P = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
  for (let i = 1; i <= n; i++) { D[i][0] = i; P[i][0] = 1; }
  for (let j = 1; j <= m; j++) { D[0][j] = j; P[0][j] = 2; }
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const x = norm(a[i - 1]), y = norm(b[j - 1].text);
    const sub = D[i - 1][j - 1] + (x === y ? 0 : x && y && (x.startsWith(y) || y.startsWith(x)) ? 0.5 : 1.2);
    const del = D[i - 1][j] + 1, ins = D[i][j - 1] + 1;
    if (sub <= del && sub <= ins) { D[i][j] = sub; P[i][j] = 0; } else if (del <= ins) { D[i][j] = del; P[i][j] = 1; } else { D[i][j] = ins; P[i][j] = 2; }
  }
  const map = new Array(n).fill(-1);
  let i = n, j = m;
  while (i > 0 || j > 0) { const p = P[i][j]; if (i > 0 && j > 0 && p === 0) { map[i - 1] = j - 1; i--; j--; } else if (i > 0 && (j === 0 || p === 1)) i--; else j--; }
  return map;
}

// timings des mots non appariés : interpolation entre voisins appariés, au prorata des caractères
function fillTimes(toks, times, t0, t1) {
  const out = times.slice();
  let k = 0;
  while (k < toks.length) {
    if (out[k]) { k++; continue; }
    let e = k; while (e < toks.length && !out[e]) e++;
    const a = k > 0 ? out[k - 1].end : t0, b = e < toks.length ? out[e].start : t1;
    const len = toks.slice(k, e).reduce((s, t) => s + t.length + 1, 0);
    let c = a;
    for (let q = k; q < e; q++) { const d = ((b - a) * (toks[q].length + 1)) / len; out[q] = { start: c, end: c + d }; c += d; }
    k = e;
  }
  return out;
}

const words = [];
for (const beat of tl.beats) {
  const line = script.lines.find((l) => l.id === beat.id);
  const file = path.join("public", beat.voSrc);
  const said = tokens(line.text);
  // résultat Scribe déjà récupéré (connecteur Fal) : scripts/stt/<id>.json ; sinon appel direct avec FAL_KEY
  const cached = path.join("scripts", "stt", beat.id + ".json");
  const out = fs.existsSync(cached) ? JSON.parse(fs.readFileSync(cached, "utf8")) : await retry(() => falRun(M.stt, { audio_url: dataUri(file), language_code: script.voice?.stt_language || "fra", tag_audio_events: false, diarize: false }, { label: "stt " + beat.id }), 3, beat.id);
  const stt = (out.words || []).filter((w) => (w.type ?? "word") === "word" && w.text.trim());
  const dur = beat.dur / FPS;
  const map = align(said, stt);
  let times = fillTimes(said, said.map((_, i) => (map[i] >= 0 ? { start: stt[map[i]].start, end: stt[map[i]].end } : null)), 0, dur);
  // un mot du script qui correspond à plusieurs mots dits (« 2019 » = « deux mille dix-neuf ») couvre toute la plage
  let prevJ = -1, prevEnd = 0;
  said.forEach((_, i) => {
    if (map[i] >= 0) { if (map[i] - prevJ > 1) times[i] = { start: Math.min(times[i].start, prevJ >= 0 ? stt[prevJ + 1].start : stt[0].start), end: times[i].end }; prevJ = map[i]; }
    times[i].start = Math.max(times[i].start, prevEnd); prevEnd = times[i].end;
  });
  let shown = said;
  if (line.display) {
    // texte affiché différent du texte dit : on répartit au prorata des caractères sur la durée parlée
    shown = tokens(line.display);
    const s0 = times[0].start, s1 = times[times.length - 1].end, total = shown.reduce((s, t) => s + t.length + 1, 0);
    let c = s0; times = shown.map((t) => { const d = ((s1 - s0) * (t.length + 1)) / total; const r = { start: c, end: c + d }; c += d; return r; });
  }
  const matched = map.filter((x) => x >= 0).length;
  console.log(`${beat.id.padEnd(14)} ${matched}/${said.length} mots alignés`);
  shown.forEach((t, i) => words.push({ t, from: beat.start + Math.round(times[i].start * FPS), to: beat.start + Math.round(times[i].end * FPS), line: beat.id, emph: /\d/.test(t) }));
}
fs.writeFileSync("src/subs.json", JSON.stringify({ words }, null, 1));
console.log(`src/subs.json -> ${words.length} mots`);
