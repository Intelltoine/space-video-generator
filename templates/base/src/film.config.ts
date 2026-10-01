// ====================================================================================
// Réglages du film (format short vertical 9:16, thème espace). C'est ICI qu'on adapte le socle au sujet.
// Voir references/space.md : axe et compteur conseillés pour chaque série de la chaîne.
// ====================================================================================

/** Déplacement continu de la caméra le long d'un axe (un seul plan-séquence) */
export const CAMERA = {
  axis: "z" as "x" | "y" | "z",   // "z" = on avance dans l'espace (défaut) ; "y" = décollage/montée ; "x" = travelling le long d'une rangée (échelles)
  dir: -1,                        // -1 : vers le fond ; +1 : l'inverse (pour "y" : +1 = on monte)
  speed: 3.0,                     // unités monde par seconde (shorts : un peu plus rapide que le 16:9)
  rampIn: 45,                     // frames d'accélération au départ (court : le hook doit déjà bouger)
  stopEvent: null as string | null, // événement où la caméra s'arrête (ex. "arrival") ; null = jamais
  stopBeat: "",                   // réplique dont la valeur est atteinte à l'arrêt (compteur)
  rampOut: 90,
  anchorAt: 0.3,                  // 0..1 : moment de la réplique où son sujet est centré à l'écran
  distance: 30,
  fov: 40,                        // champ VERTICAL : en 9:16, la demi-largeur visible à z=0 ≈ 6 unités (garder x entre -5 et +5)
  rumble: null as { from: string; to: string; amp: number } | null,
};

/** Narrateur : l'astronaute mascotte de la chaîne, vu à travers le hublot de sa capsule (asset "capsule").
 *  En 9:16 il vit en haut à droite (le HUD est en haut à gauche, les sous-titres au centre, l'interface des réseaux en bas). */
export const NARRATOR = {
  portrait: "astronaut",                 // pièces : astronaut-body, -head, -mouth, -brow-l, -brow-r (process.json -> parts)
  vehicle: "capsule" as string | null,   // null = pas de narrateur visible (voix off seule)
  hand: null as string | null,
  width: 5.0,
  align: { x: 512, y: 470 },
  headScale: 2.1,
  offset: { u: 2.9, v: 5.4, z: 3 },
  lamp: false,                           // pas de projecteur dans l'espace : la lumière vient de l'étoile (sun)
  lampDir: -0.36,
  settleOn: null as string | null,
  handAtBeats: false,
  reactions: [
    { at: "impact", kind: "jolt" },
    { at: "reveal", kind: "lookUp" },
  ] as { at: string; from?: number; to?: number; kind: "recoil" | "jolt" | "lookUp" }[],
};

/** Chocs caméra sur des événements de la timeline (explosion, impact, supernova…) */
export const SHAKES: { event: string; amp: number; freq: number; decay: number }[] = [
  { event: "impact", amp: 0.45, freq: 9, decay: 2.0 },
];

/** Fond : gain de luminosité du dégradé et rayons de lumière (utiles sous l'eau ou dans une atmosphère, pas dans le vide) */
export const SKY = { gain: 0.55, rays: false };

/** Ambiance selon l'avancement p (0 = début, 1 = fin). Dans l'espace : fond presque noir teinté,
 *  brouillard très léger (il sert à la profondeur, pas au réalisme), "sun" = lumière de l'étoile,
 *  dust = poussière/étoiles proches qui défilent, sparks = scintillements. */
export const ENV_KEYS = [
  { p: 0.0, bg: "#060b22", near: 30, far: 120, ambient: 0.35, sun: 1.6, spot: 0.0, dust: 0.45, sparks: 0.2 },
  { p: 0.5, bg: "#050a1c", near: 30, far: 100, ambient: 0.22, sun: 1.3, spot: 0.0, dust: 0.6, sparks: 0.35 },
  { p: 1.0, bg: "#020309", near: 30, far: 90, ambient: 0.12, sun: 1.0, spot: 0.0, dust: 0.75, sparks: 0.5 },
];

const fmt = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** HUD : compteur principal + relevés. `format` reçoit la valeur interpolée (beats[].value). */
export const HUD = {
  counter: { label: "DISTANCE DE LA TERRE", unit: "km", format: fmt },
  readouts: (v: number, p: number): { label: string; value: string; color?: string; blink?: boolean }[] => {
    const s = v / 299792.458; // temps mis par la lumière pour parcourir v km
    const lt = s < 60 ? `${s.toFixed(s < 10 ? 2 : 1)} s` : s < 3600 ? `${(s / 60).toFixed(1)} min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)} h` : `${(s / 86400 / 365.25).toFixed(2)} ans`;
    return [
      { label: "LUMIÈRE", value: lt },
      { label: "AVANCÉE", value: `${Math.round(p * 100)} %` },
    ];
  },
  /** règle graduée : désactivée par défaut en 9:16 (la colonne d'icônes des réseaux est à droite) */
  ruler: null as { scale: (v: number) => number; pxPerUnit: number; marks: { v: number; label?: string; shift?: number }[] } | null,
  title: "TITRE", tagline: "la question finale", handle: "@compte",
  accent: "#9fd8ff",
};

/** Sous-titres karaoké (src/subs.json, généré par scripts/gen-subs.mjs) */
export const SUBS = {
  enabled: true,
  y: 0.6,              // hauteur du centre des sous-titres (fraction de l'écran) : au-dessus de la légende des réseaux
  fontSize: 76,
  maxWords: 3,
  maxChars: 18,
  holdFrames: 8,       // garde le groupe affiché si le suivant arrive dans moins de 8 frames (évite le clignotement)
  active: "#FFD84D",   // mot en cours
  accent: "#9fd8ff",   // mots contenant un chiffre
  stroke: 10,
  uppercase: false,
};
