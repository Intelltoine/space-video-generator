# Recettes Espace (séries A à F) et règles des shorts

## Table des matières
1. Géométrie 9:16 et zones sûres
2. Recette par série
3. Compteurs : formats qui ne mentent pas
4. Hook, révélation, fin en boucle
5. Faits : les règles
6. Rendre l'espace crédible (et pas « fond d'écran »)

## 1. Géométrie 9:16 et zones sûres
- Caméra à `distance: 30`, `fov: 40` (vertical) : à z = 0, l'écran couvre y ∈ [−10,9 ; +10,9] et x ∈ [−6,1 ; +6,1].
  Garder les sujets entre x = −5 et +5. Un objet à z = −14 couvre environ 1,5 fois plus de monde : c'est là que
  vont les astres qu'on approche.
- Zones (hauteur en % depuis le haut) : 0–8 % barre de l'app ; 8–30 % HUD à gauche, mascotte à droite ;
  30–55 % le sujet principal ; ~60 % sous-titres ; 78–100 % légende et boutons des réseaux ; colonne droite
  (≈ 140 px) sur 50–90 % : icônes. Rien d'essentiel (chiffre, visage, texte) dans ces deux dernières zones.
- Durée : 30–45 s. Au-delà, la rétention chute ; en dessous de 25 s, les faits n'ont pas le temps de respirer.

## 2. Recette par série

| Série | Axe caméra | Compteur | Relevés (`HUD.readouts`) | Événement | Révélation |
|---|---|---|---|---|---|
| A · Et si… ? | z, dir −1 (on avance) | temps écoulé (s, min, jours, ans) ou grandeur du scénario | 2 grandeurs qui changent (température, marée, vitesse) | le basculement (disparition, arrêt, impact) : `impact` + secousse | la conséquence finale (Terre gelée, anneau de débris) |
| B · Échelle | x (travelling le long d'une rangée) pour les tailles ; z pour les distances | diamètre (km) ou « × Terre » ; distance (km / années-lumière) | temps-lumière, « combien de Terres » | passage d'un ordre de grandeur (zoom arrière brusque) | l'objet géant qui remplit tout l'écran |
| C · Planètes & lunes | z vers l'astre, arrêt (`stopEvent`) devant lui | distance du Soleil (millions de km) ou température (°C) | gravité (% Terre), durée du jour, pression | entrée dans l'atmosphère / geyser / éruption | la surface ou le détail signature (geysers, lacs, cœur de Pluton) |
| D · Étoiles & trous noirs | z vers le centre, vitesse qui ralentit près de l'horizon | distance (années-lumière) ou masse (Soleils) | température (K), densité, temps-lumière | flash (supernova, sursaut) | l'horizon / l'anneau / le pulsar qui balaie |
| E · Conquête spatiale | y, dir +1 (on décolle) pour les lancements ; z pour les sondes lointaines | altitude (km) ou année | vitesse, durée de mission, distance de la Terre | allumage / alarme / explosion | l'image historique recréée (sans visage réel identifiable) |
| F · Idées reçues | z | la vraie valeur (90 % de gravité, 23,4°, 100 km…) | l'idée reçue vs la réalité | le « FAUX » (secousse + ping) | l'explication visuelle (station qui tombe autour de la Terre) |

Couleurs d'accent conseillées (`HUD.accent`, `SUBS.accent`) : A `#b9a4ff`, B `#9fd8ff`, C `#ffc08a`, D `#ff8fb1`,
E `#ffd27a`, F `#8affc8`. Une couleur par série aide l'abonné à reconnaître la série au premier coup d'œil.

## 3. Compteurs : formats qui ne mentent pas
- Le compteur est interpolé entre paliers (cubique monotone) : entre deux valeurs vraies, il ne passe jamais par
  une valeur absurde. Mais la valeur à chaque palier doit être exacte.
- Années : `format: (v) => Math.round(v).toString()` (sinon le séparateur de milliers affiche « 1 957 »).
- Grandeurs sur plusieurs ordres (km → années-lumière) : compteur en échelle log. Stocker `log10(valeur)` dans
  `value` et afficher `format: (v) => fmt(10 ** v)` avec changement d'unité au-delà d'un seuil (km → UA → al).
- Températures négatives : garder le signe et l'unité (« −180 °C »), pas de valeur absolue.
- Le relevé « LUMIÈRE » par défaut calcule le temps mis par la lumière pour parcourir la distance du compteur :
  parfait pour B et D, à retirer quand le compteur n'est pas une distance.

## 4. Hook, révélation, fin en boucle
- Frame 0 : ça bouge déjà (caméra lancée, poussière, mascotte qui flotte). Pas de fondu au noir d'ouverture long :
  `intro: 12`.
- Le hook est la réplique `00-hook` : une affirmation ou une question qui crée un manque (« Si le Soleil
  disparaissait, tu ne le saurais pas tout de suite. »). Pas de « Salut, aujourd'hui on va parler de… ».
- Un événement physique toutes les 10–15 s en short (secousse, flash, changement de vitesse).
- Révélation juste avant `blackout`, puis `title` : le titre et la question du plan. La question finale sert de
  relance en commentaires et la fin courte favorise le re-visionnage en boucle.

## 5. Faits : les règles
- Chaque chiffre du script est vérifié avant la voix (NASA, ESA, CNES, IAU, publications). Une seule erreur
  relevée en commentaire coûte plus cher que tout le reste.
- Les estimations incertaines se disent comme telles (« selon certaines estimations », « environ »).
- Les découvertes récentes (après 2024) : vérifier par une recherche avant d'affirmer.
- Pas d'image qui contredit la voix (planète avec anneaux qui n'en a pas, couleur fausse de Mars…).
- Pas de visage réel identifiable (Gagarine, Armstrong, Pesquet) ni de logo d'agence dans les images générées :
  silhouettes, casques, vues de dos, recréations génériques.

## 6. Rendre l'espace crédible
- Le vide n'est pas noir pur : `bg` bleu nuit très sombre (#050a1c), brouillard léger pour la profondeur.
- Une seule source de lumière dure (l'étoile, `sun`), un `ambient` faible : les astres ont un côté nuit.
- Les planètes tournent (`rot` lent) et ont un léger `emissive` pour l'atmosphère ; les étoiles et quasars :
  `emissive` 0,8–1,1 pour que le bloom les fasse rayonner.
- La poussière d'étoiles (`dust`) qui défile près de la caméra donne la sensation de vitesse : l'augmenter quand on
  accélère, la baisser à l'arrêt.
- Échelle : quand on compare, on ne montre jamais les vraies proportions impossibles (Soleil et Terre côte à côte
  à l'échelle rendent la Terre invisible) : on enchaîne les plans avec un compteur « × Terre » qui dit la vérité.
