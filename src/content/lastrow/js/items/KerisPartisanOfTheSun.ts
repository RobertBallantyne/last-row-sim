import { AttackBonuses, AttackStyle, AttackStyleTypes, ItemName, MeleeWeapon, Player, Unit } from "osrs-sdk";

import KerisImage from "../../assets/images/keris_sun.png";

// From the OSRS wiki. Special attack "Tumeken's Light": costs 75% special energy and 50 prayer points (can't be used
// below 50 prayer). Heals to 20% above base Hitpoints, restores drained stats (except prayer) and run energy.
// It doesn't attack, so it's applied instantly by LastRowRegion rather than on the next swing.
// TODO: the ToA passive (+25% accuracy against targets under 25% health) isn't modelled.
const SPECIAL_ENERGY = 75;
const SPECIAL_PRAYER_COST = 50;

export class KerisPartisanOfTheSun extends MeleeWeapon {
  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 58, slash: -2, crush: 57, magic: 2, range: 0 },
      defence: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      other: { meleeStrength: 45, rangedStrength: 0, magicDamage: 0, prayer: 3 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }

  // the engine has no partisan style set, so borrow the sword set (it includes stab)
  attackStyles() {
    return [AttackStyle.ACCURATE, AttackStyle.AGGRESSIVECRUSH, AttackStyle.STAB, AttackStyle.DEFENSIVE];
  }

  attackStyleCategory(): AttackStyleTypes {
    return AttackStyleTypes.SLASHSWORD;
  }

  defaultStyle(): AttackStyle {
    return AttackStyle.STAB;
  }

  get itemName(): ItemName {
    return "Keris partisan of the sun" as ItemName;
  }

  get isTwoHander() {
    return false;
  }

  get weight() {
    return 1.0;
  }

  get attackRange() {
    return 1;
  }

  get attackSpeed() {
    return 4;
  }

  get inventoryImage() {
    return KerisImage;
  }

  hasSpecialAttack() {
    return true;
  }

  specialAttackDrain() {
    return SPECIAL_ENERGY;
  }

  // the engine only fires specials on an attack; keep it working that way too, just in case
  specialAttack(from: Unit, to: Unit, bonuses: AttackBonuses = {}) {
    if (from instanceof Player) {
      KerisPartisanOfTheSun.applyTumekensLight(from);
    }
  }

  // Performs the special immediately if the player has toggled it on with the keris equipped.
  // Called every tick by the region. Returns true if it fired.
  static tryInstantSpecial(player: Player): boolean {
    if (!player.useSpecialAttack || !(player.equipment.weapon instanceof KerisPartisanOfTheSun)) {
      return false;
    }
    player.useSpecialAttack = false;
    if (
      player.currentStats.specialAttack < SPECIAL_ENERGY ||
      player.currentStats.prayer < SPECIAL_PRAYER_COST
    ) {
      return false;
    }
    player.currentStats.specialAttack -= SPECIAL_ENERGY;
    player.regenTimer.specUsed();
    KerisPartisanOfTheSun.applyTumekensLight(player);
    return true;
  }

  private static applyTumekensLight(player: Player) {
    player.currentStats.prayer = Math.max(0, player.currentStats.prayer - SPECIAL_PRAYER_COST);

    const overheal = player.stats.hitpoint + Math.floor(player.stats.hitpoint * 0.2);
    player.currentStats.hitpoint = Math.max(player.currentStats.hitpoint, overheal);

    (["attack", "strength", "defence", "range", "magic"] as const).forEach((stat) => {
      player.currentStats[stat] = Math.max(player.currentStats[stat], player.stats[stat]);
    });
    player.currentStats.run = Math.max(player.currentStats.run, player.stats.run);
  }
}
