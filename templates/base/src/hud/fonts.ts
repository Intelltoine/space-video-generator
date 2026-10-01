// Polices servies en local (public/fonts, copiées depuis @fontsource) : aucun appel réseau à Google Fonts au rendu.
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const load = (family: string, file: string, weight: string, style: "normal" | "italic" = "normal") =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style, format: "woff2" });

load("Cormorant Garamond", "cormorant-garamond-latin-300-normal.woff2", "300");
load("Cormorant Garamond", "cormorant-garamond-latin-400-normal.woff2", "400");
load("Cormorant Garamond Italic", "cormorant-garamond-latin-300-italic.woff2", "300", "italic");
load("Cormorant Garamond Italic", "cormorant-garamond-latin-400-italic.woff2", "400", "italic");
load("IBM Plex Mono", "ibm-plex-mono-latin-300-normal.woff2", "300");
load("IBM Plex Mono", "ibm-plex-mono-latin-400-normal.woff2", "400");
load("Montserrat", "montserrat-latin-800-normal.woff2", "800");
load("Montserrat", "montserrat-latin-900-normal.woff2", "900");

export const SERIF = "Cormorant Garamond, Georgia, serif";
export const SERIF_ITALIC = "Cormorant Garamond Italic, Georgia, serif";
export const MONO = "IBM Plex Mono, monospace";
export const SANS_BOLD = "Montserrat, Arial Black, sans-serif";
