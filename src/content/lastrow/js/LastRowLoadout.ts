import {
  AvasAssembler,
  BarrowsGloves,
  BowOfFaerdhinen,
  CrystalBody,
  CrystalHelm,
  CrystalLegs,
  HolyBlessing,
  Item,
  NecklaceOfAnguish,
  PegasianBoots,
  Player,
  RingOfSufferingImbued,
  SaradominBrew,
  SuperRestore,
  UnitOptions,
} from "osrs-sdk";
import { Ambrosia } from "./items/Ambrosia";
import { BlessedCrystalScarab } from "./items/BlessedCrystalScarab";
import { KerisPartisanOfTheSun } from "./items/KerisPartisanOfTheSun";
import { RangingPotion } from "./items/RangingPotion";
import { SmellingSalts } from "./items/SmellingSalts";
import { Lightbearer } from "./items/Lightbearer";
import { InventoryLayout, arrangeByLayout } from "./InventoryLayout";

const INVENTORY_SIZE = 28;

// Supply presets for the common challenge setups: with or without the Helpful Spirit's supplies,
// and with or without brews. The keris (for Tumeken's Light heals) is in every preset.
export const SUPPLY_PRESETS = {
  spirit: "Helpful Spirit supplies",
  own: "No Helpful Spirit",
  own_no_brews: "No Helpful Spirit, no brews",
} as const;
export type SupplyPreset = keyof typeof SUPPLY_PRESETS;
export const DEFAULT_SUPPLY_PRESET: SupplyPreset = "spirit";

function many(count: number, make: () => Item): Item[] {
  return Array.from({ length: count }, make);
}

function suppliesFor(preset: SupplyPreset): Item[] {
  const keris = new KerisPartisanOfTheSun();
  switch (preset) {
    case "spirit":
      return [
        keris,
        ...many(2, () => new Ambrosia()),
        ...many(2, () => new SmellingSalts()),
        ...many(4, () => new BlessedCrystalScarab()),
        ...many(8, () => new SaradominBrew()),
        ...many(8, () => new SuperRestore()),
      ];
    case "own":
      return [
        keris,
        ...many(2, () => new RangingPotion()),
        ...many(10, () => new SaradominBrew()),
        ...many(10, () => new SuperRestore()),
      ];
    case "own_no_brews":
      // healing comes from keris specials, fed by restores
      return [keris, ...many(2, () => new RangingPotion()), ...many(20, () => new SuperRestore())];
  }
}

// Bowfa setup matching the GameMaker sim's default (4-tick ranged).
// TODO: add Tumeken's Shadow once it exists as an item in osrs-sdk.
export class LastRowLoadout {
  constructor(
    private preset: SupplyPreset,
    private layout: InventoryLayout | null = null,
    private lightbearer = false,
  ) {}

  setStats(player: Player) {
    player.stats.prayer = 99;
    player.currentStats.prayer = 99;
    player.stats.defence = 99;
    player.currentStats.defence = 99;
  }

  getLoadout(): UnitOptions {
    const inventory = arrangeByLayout(suppliesFor(this.preset), this.layout, INVENTORY_SIZE);
    return {
      equipment: {
        weapon: new BowOfFaerdhinen(),
        offhand: null,
        helmet: new CrystalHelm(),
        necklace: new NecklaceOfAnguish(),
        cape: new AvasAssembler(),
        ammo: new HolyBlessing(),
        chest: new CrystalBody(),
        legs: new CrystalLegs(),
        feet: new PegasianBoots(),
        gloves: new BarrowsGloves(),
        ring: this.lightbearer ? new Lightbearer() : new RingOfSufferingImbued(),
      },
      inventory,
    };
  }
}
