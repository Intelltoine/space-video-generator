import React from "react";
import { EV, FPS, TL, anchorPos, at, beat, camPos } from "../lib/camera";
import { easeOut, smoothstep } from "../lib/math";
import { META } from "../lib/textures";
import { Sprite3D } from "./Sprite3D";

// ====================================================================================
// LA MISE EN SCÈNE : ce fichier s'écrit pour chaque vidéo. Exemple par défaut : on avance (axe z)
// vers une planète qui grossit, un objet passe devant la caméra, une révélation finale s'ouvre.
// Règles (references/wow.md + references/space.md) :
//  - tout est placé dans le monde (anchorPos) et c'est la caméra qui avance : jamais de "slide" d'écran
//  - 9:16 : garder x entre -5 et +5 à z = 0 (au-delà : hors cadre), jouer sur la profondeur plutôt que la largeur
//  - planètes et astres : mode "static" + rotation lente ; comètes, sondes, astronautes : "flag" ou "breathe"
//  - rien d'immobile : dérive lente, rotation, halo qui pulse
// ====================================================================================

const has = (id: string) => !!META[id];
// ids des répliques qui portent chaque élément (par défaut : la 2e réplique) — à remplacer par les vrais ids
const SECOND = TL.beats[Math.min(1, TL.beats.length - 1)].id;
const IDS = { planet: SECOND, flyby: SECOND };

/** un objet (sonde, comète, astéroïde) qui traverse le cadre devant la caméra pendant une réplique */
export function flybyPose(frame: number) {
  const b = beat(IDS.flyby);
  const f0 = b.start, f1 = b.end + 30;
  const k = smoothstep(f0, f1, frame);
  const c = camPos(frame);
  return { x: -9 + 18 * k, y: c.y - 1.5 + 2.5 * k, z: c.z + 4 - 2 * k, rot: -0.3 + 0.2 * k, visible: frame > f0 - 10 && frame < f1 + 10 };
}

export const Story: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const planet = anchorPos(IDS.planet, 0.6, 0.8, -14);
  const fly = has("flyby") ? flybyPose(frame) : null;
  const revealF = at("reveal");
  const revK = revealF === undefined ? 0 : easeOut((frame - revealF) / 55);

  return (
    <>
      {/* planète fixe dans le monde : elle grossit parce que la caméra avance */}
      {has("planet") && <Sprite3D id="planet" frame={frame} width={9} x={planet.x} y={planet.y} z={planet.z} rot={t * 0.01} mode="static" emissive={0.08} />}
      {/* objet qui passe devant la caméra (parallaxe forte) */}
      {fly && <Sprite3D id="flyby" frame={frame} width={3.2} x={fly.x} y={fly.y} z={fly.z} rot={fly.rot} mode="breathe" amp={0.05} visible={fly.visible} />}
      {/* révélation : quelque chose d'immense qui s'ouvre sans brouillard avant le noir */}
      {has("reveal") && revK > 0 && frame < (EV.blackout ?? Infinity) && (
        <Sprite3D id="reveal" frame={frame} width={16} x={0} y={camPos(frame).y + 1} z={camPos(frame).z - 18 + 3 * revK} mode="static" scaleY={0.04 + 0.96 * revK} opacity={smoothstep(0, 0.4, revK) * 0.95} emissive={0.8} depthWrite={false} noFog />
      )}
    </>
  );
};
