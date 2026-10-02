import { DelayedAction, ImageLoader, Item, ItemName, Player } from "osrs-sdk";

import OneUse from "../../assets/images/salts_1.png";
import TwoUses from "../../assets/images/salts_2.png";

// Tombs of Amascut supply. From the OSRS wiki: crushing it boosts Attack, Strength, Defence, Ranged and Magic by
// floor(base * 16 / 100) + 11 and restores 25% run energy, repeating every 15 seconds for 8 minutes. 2 uses.
const BOOST_INTERVAL_TICKS = 25; // 15 seconds
const BOOST_DURATION_TICKS = 800; // 8 minutes
const RUN_RESTORE = 2500; // run energy is stored out of 10000
const BOOSTED_STATS = ["attack", "strength", "defence", "range", "magic"] as const;

// Crushing another while one is active restarts the effect rather than stacking.
const activeSalts = new WeakMap<Player, number>();

export class SmellingSalts extends Item {
  uses: number;
  private oneUse: HTMLImageElement = ImageLoader.createImage(OneUse);
  private twoUses: HTMLImageElement = ImageLoader.createImage(TwoUses);

  constructor(uses = 2) {
    super();
    this.uses = uses;
    this.defaultAction = "Crush";
    this.updateInventorySprite();
  }

  get inventoryImage() {
    return this.uses === 1 ? OneUse : TwoUses;
  }

  get itemName(): ItemName {
    return "Smelling salts" as ItemName;
  }

  get hasInventoryLeftClick() {
    return true;
  }

  inventoryLeftClick(player: Player) {
    if (this.uses <= 0) {
      return;
    }
    this.uses--;
    SmellingSalts.start(player);
    if (this.uses === 0) {
      this.consumeItem(player);
    }
    this.updateInventorySprite();
  }

  private static start(player: Player) {
    const saltsId = Math.random();
    activeSalts.set(player, saltsId);
    SmellingSalts.applyBoost(player);
    for (let ticks = BOOST_INTERVAL_TICKS; ticks < BOOST_DURATION_TICKS; ticks += BOOST_INTERVAL_TICKS) {
      DelayedAction.registerDelayedAction(
        new DelayedAction(() => {
          if (activeSalts.get(player) === saltsId && player.dying < 0) {
            SmellingSalts.applyBoost(player);
          }
        }, ticks),
      );
    }
  }

  private static applyBoost(player: Player) {
    BOOSTED_STATS.forEach((stat) => {
      const boosted = player.stats[stat] + Math.floor((player.stats[stat] * 16) / 100) + 11;
      player.currentStats[stat] = Math.max(player.currentStats[stat], boosted);
    });
    player.currentStats.run = Math.min(10000, player.currentStats.run + RUN_RESTORE);
  }

  updateInventorySprite() {
    this.inventorySprite = this.uses === 1 ? this.oneUse : this.twoUses;
  }
}
