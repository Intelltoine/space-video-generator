// Rendu final de la vidéo active -> out/<ID>.mp4, avec le navigateur local et le bon moteur WebGL.
// Usage : node scripts/render.mjs [--crf=18] [--frames=0-299]
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { findBrowser, defaultGl } from "./browser.mjs";

const id = fs.existsSync(".active") ? fs.readFileSync(".active", "utf8").trim() : "film";
const extra = process.argv.slice(2);
const args = ["remotion", "render", "Film", `out/${id}.mp4`, "--codec=h264", `--gl=${defaultGl()}`, `--concurrency=${Math.max(1, Math.min(4, os.cpus().length))}`];
if (!extra.some((a) => a.startsWith("--crf"))) args.push("--crf=18");
const b = findBrowser();
if (b) args.push(`--browser-executable=${b}`);
args.push(...extra);
console.log("npx " + args.join(" "));
const t0 = Date.now();
const r = spawnSync("npx", args, { stdio: "inherit" });
console.log(`rendu ${r.status === 0 ? "terminé" : "ÉCHOUÉ"} en ${((Date.now() - t0) / 60000).toFixed(1)} min -> out/${id}.mp4`);
process.exit(r.status ?? 1);
