import { DelayedAction, ImageLoader, Item, ItemName, Player } from "osrs-sdk";

import OneUse from "../../assets/images/scarab_1.png";
import TwoUses from "../../assets/images/scarab_2.png";

// Tombs of Amascut supply. From the OSRS wiki: cracking it restores 8 Prayer points every 4 ticks, 9 times
// (72 points over 40 ticks). 2 uses.
const RESTORE_AMOUNT = 8;
const RESTORE_INTERVAL_TICKS = 4;
const RESTORE_COUNT = 9;

// The wiki doesn't say what happens when a second scarab is cracked while one is still restoring.
// We assume the newer crack replaces the older one rather than stacking.
const activeRestore = new WeakMap<Player, number>();

export class BlessedCrystalScarab extends Item {
  uses: number;
  private oneUse: HTMLImageElement = ImageLoader.createImage(OneUse);
  private twoUses: HTMLImageElement = ImageLoader.createImage(TwoUses);

  constructor(uses = 2) {
    super();
    this.uses = uses;
    this.defaultAction = "Crack";
    this.updateInventorySprite();
  }

  get inventoryImage() {
    return this.uses === 1 ? OneUse : TwoUses;
  }

  get itemName(): ItemName {
    return "Blessed crystal scarab" as ItemName;
  }

  get weight() {
    return 0.453;
  }

  get hasInventoryLeftClick() {
    return true;
  }

  inventoryLeftClick(player: Player) {
    if (this.uses <= 0) {
      return;
    }
    this.uses--;
    BlessedCrystalScarab.startRestore(player);
    if (this.uses === 0) {
      this.consumeItem(player);
    }
    this.updateInventorySprite();
  }

  private static startRestore(player: Player) {
    const restoreId = Math.random();
    activeRestore.set(player, restoreId);
    for (let i = 1; i <= RESTORE_COUNT; i++) {
      DelayedAction.registerDelayedAction(
        new DelayedAction(() => {
          if (activeRestore.get(player) !== restoreId || player.dying >= 0) {
            return;
          }
          // restores up to the prayer level, but never lowers a boost (e.g. from ambrosia)
          const restored = Math.min(player.stats.prayer, player.currentStats.prayer + RESTORE_AMOUNT);
          player.currentStats.prayer = Math.max(player.currentStats.prayer, restored);
        }, i * RESTORE_INTERVAL_TICKS),
      );
    }
  }

  updateInventorySprite() {
    this.inventorySprite = this.uses === 1 ? this.oneUse : this.twoUses;
  }
}
