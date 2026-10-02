"use strict";

import { Location, Projectile, Random, Region, Unit } from "osrs-sdk";

// Uniform integer in [min, max]
export function rollDamage(min: number, max: number) {
  return min + Math.floor(Random.get() * (max - min + 1));
}

// Damages any living player standing on `location`. Returns true if someone was hit.
// Called from entity ticks, which run before players move, so this sees where the player
// stood at the end of the previous tick (OSRS processes NPCs before players).
export function hitPlayersOnTile(region: Region, location: Location, source: Unit, damage: () => number): boolean {
  let hit = false;
  region.players.forEach((player) => {
    if (player.dying >= 0) {
      return;
    }
    if (player.location.x === location.x && player.location.y === location.y) {
      hit = true;
      player.addProjectile(new Projectile(null, damage(), source, player, "magic", { hidden: true, color: "#FFFFFF" }));
    }
  });
  return hit;
}
