"use strict";

// How path level changes the phantoms' attacks. Per the OSRS wiki, the change happens every two path levels, and path
// mechanics stop changing after level 4.
// No engine imports so it can be unit tested in isolation.

// Zebak: ticks from his wind-up to the jug/rock breaking (launch) and from there to landing on the player.
// From the GameMaker Last Row Sim's in-game notes: path 0 and 2 break on tick 4 and fly 3 ticks; path 4 and 6 break
// a tick sooner and fly 2 ticks.
export interface ZebakTiming {
  launchTick: number;
  flightTicks: number;
}

// Zebak's attack rate: 4 ticks, a tick faster every two path levels (2 ticks from path 4).
// (The GameMaker sim's notes say "every 4 ticks regardless of path level"; this follows player reports that his
// attack rate does speed up.)
export function zebakAttackInterval(pathLevel: number): number {
  return 4 - Math.floor(Math.min(Math.max(pathLevel, 0), 4) / 2);
}

export function zebakTiming(pathLevel: number): ZebakTiming {
  return pathLevel >= 4 ? { launchTick: 3, flightTicks: 2 } : { launchTick: 4, flightTicks: 3 };
}

// Ba-Ba: ticks from her throw to the boulder landing.
// The cache has three versions of the boulder-fall graphic (gameval TOA_BABA_ROCK_FALL, _FASTER, _FASTEST), the same
// animation at 3x, 2x and 1x frame lengths, landing ~5, ~3.3 and ~1.65 ticks after it starts. The GameMaker sim
// measured a landing 4 ticks after the throw, which only fits the "faster" version, so that's treated as path 2-3;
// the others keep the same offset from the throw.
export function babaImpactTick(pathLevel: number): number {
  if (pathLevel >= 4) {
    return 2;
  }
  if (pathLevel >= 2) {
    return 4;
  }
  return 6;
}
