// Navigateur headless déjà présent sur la machine (évite le téléchargement de Remotion quand le réseau le bloque).
// Ordre : variable REMOTION_BROWSER, caches puppeteer / playwright, sinon null (Remotion télécharge le sien).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function findBrowser() {
  if (process.env.REMOTION_BROWSER && fs.existsSync(process.env.REMOTION_BROWSER)) return process.env.REMOTION_BROWSER;
  const roots = [path.join(os.homedir(), ".cache", "puppeteer", "chrome-headless-shell"), "/opt/pw-browsers"];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    const stack = [r];
    while (stack.length) {
      const d = stack.pop();
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.name === "chrome-headless-shell" || e.name === "headless_shell") return p;
      }
    }
  }
  return null;
}
/** angle si un GPU est visible, sinon swangle (rendu logiciel) */
export const defaultGl = () => (fs.existsSync("/dev/dri") ? "angle" : "swangle");
