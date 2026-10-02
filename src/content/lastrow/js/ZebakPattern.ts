"use strict";

// Pure Zebak RNG for the last row, from the GameMaker Last Row Sim (obj_boss Alarm_7, obj_playertile).
// No engine imports so it can be unit tested in isolation.

export type Rng = () => number;
export type ZebakStyle = "magic" | "range";

// The sim's notes say Zebak repeats his previous style ~66% of the time. (The sim's code actually
// repeats ~34% and mis-records the previous style after a ranged attack; this follows the notes.)
export const REPEAT_STYLE_CHANCE = 0.66;

export function rollZebakStyle(previous: ZebakStyle | null, rng: Rng): ZebakStyle {
  if (previous === null) {
    return rng() < 0.5 ? "range" : "magic";
  }
  if (rng() < REPEAT_STYLE_CHANCE) {
    return previous;
  }
  return previous === "magic" ? "range" : "magic";
}

function uniformInt(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

// 16-40 when not protected: 40% 16-29, 30% 30-35, 25% exactly 36, 5% 37-40
export function rollZebakDamage(rng: Rng): number {
  const roll = rng();
  if (roll <= 0.4) {
    return uniformInt(rng, 16, 29);
  } else if (roll <= 0.7) {
    return uniformInt(rng, 30, 35);
  } else if (roll <= 0.95) {
    return 36;
  }
  return uniformInt(rng, 37, 40);
}
