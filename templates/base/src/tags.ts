// Étiquettes ancrées dans la 3D (ligne de rappel + texte), affichées par le HUD.
// Chaque tag : point monde (x,y,z), fenêtre de frames, décalage écran (dx,dy) du texte.
// 9:16 : textes courts (« Jupiter · 11× la Terre »), dx vers le centre de l'écran pour ne pas sortir du cadre.
import { TL, anchorPos, beat } from "./lib/camera";

export type Tag = { key: string; text: string; x: number; y: number; z: number; from: number; to: number; dx?: number; dy?: number };

export function tagsAt(frame: number): Tag[] {
  void frame;
  const id = TL.beats[Math.min(1, TL.beats.length - 1)].id; // à remplacer par l'id de la réplique concernée
  const b = beat(id);
  const p = anchorPos(id, 0.6, 5.3, -14); // ex. : haut de la planète placée dans Story.tsx
  return [
    { key: "planet", text: "exemple · étiquette", x: p.x, y: p.y, z: p.z, from: b.start - 10, to: b.end + 20, dx: -60, dy: -70 },
  ];
}
