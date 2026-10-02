import { ImageLoader, ItemName, Player, Potion } from "osrs-sdk";

import OneDose from "../../assets/images/ambrosia_1.png";
import TwoDose from "../../assets/images/ambrosia_2.png";

// Tombs of Amascut supply. From the OSRS wiki: fully restores and boosts Hitpoints by floor(HP / 4) + 2 and
// Prayer by floor(Prayer / 5) + 5, and restores run energy. 2 doses.
// (Cures poison/venom too, which doesn't matter here.)
export class Ambrosia extends Potion {
  oneDose: HTMLImageElement = ImageLoader.createImage(OneDose);
  twoDose: HTMLImageElement = ImageLoader.createImage(TwoDose);

  constructor(doses = 2) {
    super();
    this.doses = doses;
    this.updateInventorySprite();
  }

  get inventoryImage() {
    return this.doses === 1 ? OneDose : TwoDose;
  }

  get itemName(): ItemName {
    return "Ambrosia" as ItemName;
  }

  drink(player: Player) {
    super.drink(player);

    const boostedHitpoints = player.stats.hitpoint + Math.floor(player.stats.hitpoint / 4) + 2;
    player.currentStats.hitpoint = Math.max(player.currentStats.hitpoint, boostedHitpoints);

    const boostedPrayer = player.stats.prayer + Math.floor(player.stats.prayer / 5) + 5;
    player.currentStats.prayer = Math.max(player.currentStats.prayer, boostedPrayer);

    player.currentStats.run = Math.max(player.currentStats.run, player.stats.run);
  }

  updateInventorySprite() {
    if (this.doses === 2) {
      this.inventorySprite = this.twoDose;
    } else if (this.doses === 1) {
      this.inventorySprite = this.oneDose;
    } else {
      this.inventorySprite = this.vial;
    }
  }
}
