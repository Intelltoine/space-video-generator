// Sous-titres karaoké pour les shorts : 1 à 3 mots par groupe, mot prononcé en surbrillance, pop à l'entrée.
// Données : src/subs.json (scripts/gen-subs.mjs). Texte = script exact, timings = Scribe v2.
import React from "react";
import raw from "../subs.json";
import { SUBS } from "../film.config";
import { TL } from "../lib/camera";
import { smoothstep } from "../lib/math";
import { SANS_BOLD } from "./fonts";

const fontFamily = SANS_BOLD;
type W = { t: string; from: number; to: number; line: string; emph: boolean };
const WORDS = (raw as { words: W[] }).words;

// groupes : coupe sur la ponctuation forte, le changement de réplique, ou au-delà de maxWords / maxChars
const GROUPS: W[][] = [];
{
  let g: W[] = [];
  const flush = () => { if (g.length) GROUPS.push(g); g = []; };
  for (const w of WORDS) {
    if (g.length && (g[0].line !== w.line || g.length >= SUBS.maxWords || [...g, w].map((x) => x.t).join(" ").length > SUBS.maxChars)) flush();
    g.push(w);
    if (/[.!?…:;]$/.test(w.t)) flush();
  }
  flush();
}

export const Subtitles: React.FC<{ frame: number }> = ({ frame }) => {
  if (!SUBS.enabled) return null;
  const gi = GROUPS.findIndex((g, i) => {
    const next = GROUPS[i + 1];
    const end = next && next[0].from - g[g.length - 1].to < SUBS.holdFrames ? next[0].from : g[g.length - 1].to + 4;
    return frame >= g[0].from - 2 && frame < end;
  });
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const inK = smoothstep(g[0].from - 2, g[0].from + 4, frame);
  return (
    <div style={{ position: "absolute", left: 60, right: TL.height > TL.width ? 150 : 60, top: TL.height * SUBS.y, transform: `translateY(-50%) scale(${0.9 + 0.1 * inK})`, opacity: inK, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.28em", fontFamily, fontWeight: 900, fontSize: SUBS.fontSize, lineHeight: 1.12, textAlign: "center", textTransform: SUBS.uppercase ? "uppercase" : "none" }}>
      {g.map((w, i) => {
        const on = frame >= w.from && frame < (g[i + 1]?.from ?? w.to + 4);
        const said = frame >= w.from;
        const pop = 1 + 0.08 * (smoothstep(w.from - 1, w.from + 2, frame) - smoothstep(w.from + 3, w.from + 8, frame));
        const color = on ? SUBS.active : w.emph ? SUBS.accent : said ? "#ffffff" : "rgba(255,255,255,0.88)";
        return (
          <span key={i} style={{ display: "inline-block", color, transform: `scale(${pop})`, WebkitTextStroke: `${SUBS.stroke}px #000`, paintOrder: "stroke fill", textShadow: "0 4px 18px rgba(0,0,0,0.65)" }}>{w.t}</span>
        );
      })}
    </div>
  );
};
