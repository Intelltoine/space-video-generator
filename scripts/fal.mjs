// Client fal.ai minimal, sans dépendance : clé, file d'attente (queue.fal.run), téléchargement, data URI.
// Clé : variable d'environnement FAL_KEY, sinon fichier .env à la racine du projet vidéo (FAL_KEY=...).
// Les identifiants de modèles sont centralisés dans scripts/fal-models.json : si fal renomme un endpoint,
// on corrige ce fichier, pas les scripts.
import fs from "node:fs";
import path from "node:path";

export function falKey() {
  if (process.env.FAL_KEY) return process.env.FAL_KEY.trim();
  for (const f of [".env", path.join("..", ".env")]) {
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, "utf8").match(/^FAL_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
  throw new Error("FAL_KEY introuvable : exporte la variable ou ajoute FAL_KEY=... dans .env");
}

export function models() {
  const p = path.join("scripts", "fal-models.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Soumet une requête dans la file fal, attend le résultat, renvoie le JSON de sortie. */
export async function falRun(model, input, { timeoutMs = 10 * 60 * 1000, label = model } = {}) {
  const key = falKey();
  const headers = { Authorization: "Key " + key, "Content-Type": "application/json" };
  const sub = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers, body: JSON.stringify(input) });
  if (!sub.ok) throw new Error(`${label} : soumission HTTP ${sub.status} ${(await sub.text()).slice(0, 400)}`);
  const { status_url, response_url } = await sub.json();
  const t0 = Date.now();
  let wait = 1000;
  for (;;) {
    if (Date.now() - t0 > timeoutMs) throw new Error(`${label} : délai dépassé`);
    await sleep(wait);
    wait = Math.min(wait * 1.4, 5000);
    const st = await fetch(status_url, { headers });
    if (!st.ok) continue;
    const s = await st.json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.error) throw new Error(`${label} : échec ${JSON.stringify(s).slice(0, 400)}`);
  }
  const res = await fetch(response_url, { headers });
  const json = await res.json();
  if (!res.ok || json.detail) throw new Error(`${label} : ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

/** Réessaie une fonction async (erreurs réseau, 429, 5xx). */
export async function retry(fn, n = 3, label = "") {
  let last;
  for (let i = 1; i <= n; i++) {
    try { return await fn(); } catch (e) { last = e; console.log("retry", label, i, String(e.message).slice(0, 200)); await sleep(3000 * i); }
  }
  throw last;
}

export async function download(url, out) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("téléchargement HTTP " + r.status + " " + url);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  return out;
}

/** Fichier local -> data URI (fal accepte les data URI à la place d'une URL publique). */
export function dataUri(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", wav: "audio/wav", mp3: "audio/mpeg" }[ext] || "application/octet-stream";
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

/** Trouve la première URL de fichier dans une sortie fal (audio.url, images[0].url, image.url, video.url…). */
export function firstUrl(out) {
  if (!out || typeof out !== "object") return null;
  for (const k of ["audio", "image", "video", "audio_url"]) if (out[k]?.url) return out[k].url;
  if (Array.isArray(out.images) && out.images[0]?.url) return out.images[0].url;
  for (const v of Object.values(out)) { const u = typeof v === "object" ? firstUrl(v) : null; if (u) return u; }
  return null;
}
