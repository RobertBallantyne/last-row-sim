"use strict";

import { MAX_PATH_LEVEL, MAX_RAID_LEVEL } from "./LastRowScaling";
import { DEFAULT_SUPPLY_PRESET, SUPPLY_PRESETS, SupplyPreset } from "./LastRowLoadout";
import { InventoryLayout } from "./InventoryLayout";

const KEY_PREFIX = "lastrow_";

function readNumber(key: string, fallback: number, min: number, max: number) {
  const value = parseInt(window.localStorage.getItem(KEY_PREFIX + key), 10);
  if (isNaN(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

// a phantom's path level of PHANTOM_OFF removes that phantom and its attacks
export const PHANTOM_OFF = -1;

export class LastRowSettings {
  static raidLevel = 400;
  static zebakPathLevel = 0;
  static babaPathLevel = 0;
  // the GameMaker sim started the last row with the Warden on 350 / 2300 HP
  static startingHitpointsPercent = 15;
  static supplies: SupplyPreset = DEFAULT_SUPPLY_PRESET;
  // wear a Lightbearer instead of the ring of suffering
  static lightbearer = false;

  // inventory layouts are saved per supply preset
  static loadInventoryLayout(preset: SupplyPreset): InventoryLayout | null {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY_PREFIX + "layout_" + preset));
      return Array.isArray(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  static saveInventoryLayout(preset: SupplyPreset, layout: InventoryLayout | null) {
    if (layout === null) {
      window.localStorage.removeItem(KEY_PREFIX + "layout_" + preset);
    } else {
      window.localStorage.setItem(KEY_PREFIX + "layout_" + preset, JSON.stringify(layout));
    }
  }

  static persistToStorage() {
    window.localStorage.setItem(KEY_PREFIX + "raidLevel", String(LastRowSettings.raidLevel));
    window.localStorage.setItem(KEY_PREFIX + "zebakPathLevel", String(LastRowSettings.zebakPathLevel));
    window.localStorage.setItem(KEY_PREFIX + "babaPathLevel", String(LastRowSettings.babaPathLevel));
    window.localStorage.setItem(KEY_PREFIX + "startingHitpointsPercent", String(LastRowSettings.startingHitpointsPercent));
    window.localStorage.setItem(KEY_PREFIX + "supplies", LastRowSettings.supplies);
    window.localStorage.setItem(KEY_PREFIX + "lightbearer", String(LastRowSettings.lightbearer));
  }

  static readFromStorage() {
    LastRowSettings.raidLevel = readNumber("raidLevel", LastRowSettings.raidLevel, 0, MAX_RAID_LEVEL);
    LastRowSettings.zebakPathLevel = readNumber(
      "zebakPathLevel",
      LastRowSettings.zebakPathLevel,
      PHANTOM_OFF,
      MAX_PATH_LEVEL,
    );
    LastRowSettings.babaPathLevel = readNumber(
      "babaPathLevel",
      LastRowSettings.babaPathLevel,
      PHANTOM_OFF,
      MAX_PATH_LEVEL,
    );
    LastRowSettings.lightbearer = window.localStorage.getItem(KEY_PREFIX + "lightbearer") === "true";
    const supplies = window.localStorage.getItem(KEY_PREFIX + "supplies");
    LastRowSettings.supplies =
      supplies !== null && supplies in SUPPLY_PRESETS ? (supplies as SupplyPreset) : DEFAULT_SUPPLY_PRESET;
    LastRowSettings.startingHitpointsPercent = readNumber(
      "startingHitpointsPercent",
      LastRowSettings.startingHitpointsPercent,
      1,
      100,
    );
  }
}
