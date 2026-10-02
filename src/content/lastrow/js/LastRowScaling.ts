"use strict";

// Tombs of Amascut scaling, from the OSRS wiki (Tombs of Amascut/Strategies):
//   - every 5 raid levels add 2% to NPC hitpoints, defence, accuracy and damage: x(1 + raidLevel / 250)
//   - damage scaling caps at +150%
//   - path level 1 adds 8% to most enemy hitpoints and damage, each further level adds 5%, up to 6
// No engine imports so it can be unit tested in isolation.

export const MAX_RAID_LEVEL = 600;
export const MAX_PATH_LEVEL = 6;

// Tumeken's Warden, phase 3 (base values at raid level 0, solo)
export const WARDEN_P3_BASE_HITPOINTS = 880;
// defence is raised from 150 to 180 when the enrage (last row) begins
export const WARDEN_P3_ENRAGED_DEFENCE = 180;

// The GameMaker sim's Warden had 2300 HP, which matches raid level ~400 (880 x 2.6 = 2288).
// Damage is capped from raid level 375 upwards, so its observed damage numbers are treated as capped damage.
export const SIM_REFERENCE_RAID_LEVEL = 400;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function raidLevelMultiplier(raidLevel: number) {
  return 1 + clamp(raidLevel, 0, MAX_RAID_LEVEL) / 250;
}

export function raidLevelDamageMultiplier(raidLevel: number) {
  return Math.min(raidLevelMultiplier(raidLevel), 2.5);
}

export function pathLevelMultiplier(pathLevel: number) {
  const level = clamp(Math.floor(pathLevel), 0, MAX_PATH_LEVEL);
  return level === 0 ? 1 : 1.08 + 0.05 * (level - 1);
}

export function wardenMaxHitpoints(raidLevel: number) {
  return Math.floor(WARDEN_P3_BASE_HITPOINTS * raidLevelMultiplier(raidLevel));
}

export function wardenDefence(raidLevel: number) {
  return Math.floor(WARDEN_P3_ENRAGED_DEFENCE * raidLevelMultiplier(raidLevel));
}

// Multiplier to apply to damage numbers observed in the GameMaker sim (raid level ~400, path level 0).
export function damageMultiplier(raidLevel: number, pathLevel = 0) {
  return (
    (raidLevelDamageMultiplier(raidLevel) / raidLevelDamageMultiplier(SIM_REFERENCE_RAID_LEVEL)) *
    pathLevelMultiplier(pathLevel)
  );
}

export function scaleDamage(damage: number, multiplier: number) {
  return Math.max(0, Math.floor(damage * multiplier));
}
