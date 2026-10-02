import { ImageLoader, ItemName, Player, Potion } from "osrs-sdk";

import OneDose from "../../assets/images/ranging_1.png";
import TwoDose from "../../assets/images/ranging_2.png";
import ThreeDose from "../../assets/images/ranging_3.png";
import FourDose from "../../assets/images/ranging_4.png";

// From the OSRS wiki: boosts Ranged by floor(Ranged / 10) + 4. 4 doses.
// (Boosts wearing off over time isn't modelled by the engine.)
export class RangingPotion extends Potion {
  oneDose: HTMLImageElement = ImageLoader.createImage(OneDose);
  twoDose: HTMLImageElement = ImageLoader.createImage(TwoDose);
  threeDose: HTMLImageElement = ImageLoader.createImage(ThreeDose);
  fourDose: HTMLImageElement = ImageLoader.createImage(FourDose);

  constructor(doses = 4) {
    super();
    this.doses = doses;
    this.updateInventorySprite();
  }

  get inventoryImage() {
    return [OneDose, OneDose, TwoDose, ThreeDose, FourDose][this.doses] ?? FourDose;
  }

  get itemName(): ItemName {
    return "Ranging potion" as ItemName;
  }

  drink(player: Player) {
    super.drink(player);
    const boosted = player.stats.range + Math.floor(player.stats.range / 10) + 4;
    player.currentStats.range = Math.max(player.currentStats.range, boosted);
  }

  updateInventorySprite() {
    const sprites = [this.vial, this.oneDose, this.twoDose, this.threeDose, this.fourDose];
    this.inventorySprite = sprites[this.doses] ?? this.vial;
  }
}
