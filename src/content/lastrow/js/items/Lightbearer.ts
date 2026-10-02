import { ImageLoader, ItemName, Player, PlayerRegenTimer, Ring } from "osrs-sdk";

import LightbearerImage from "../../assets/images/lightbearer.png";

// From the OSRS wiki: no stats; special attack energy regenerates twice as fast (10% every 15 seconds).
export class Lightbearer extends Ring {
  inventorySprite: HTMLImageElement = ImageLoader.createImage(this.inventoryImage);

  get inventoryImage() {
    return LightbearerImage;
  }

  get itemName(): ItemName {
    return "Lightbearer" as ItemName;
  }

  get weight() {
    return 0.004;
  }

  constructor() {
    super();
    this.bonuses = {
      attack: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      defence: { stab: 0, slash: 0, crush: 0, magic: 0, range: 0 },
      other: { meleeStrength: 0, rangedStrength: 0, magicDamage: 0, prayer: 0 },
      targetSpecific: { undead: 0, slayer: 0 },
    };
  }
}

const NORMAL_SPEC_REGEN_TICKS = 50; // 10% every 30 seconds
const LIGHTBEARER_SPEC_REGEN_TICKS = 25; // 10% every 15 seconds

// The engine's regen timer always uses 30 seconds; this one halves it while a Lightbearer is worn.
export class LightbearerRegenTimer extends PlayerRegenTimer {
  private get specInterval() {
    return this.player.equipment?.ring instanceof Lightbearer ? LIGHTBEARER_SPEC_REGEN_TICKS : NORMAL_SPEC_REGEN_TICKS;
  }

  constructor(player: Player) {
    super(player);
    this.spec = this.specInterval;
  }

  specUsed() {
    if (this.spec <= 0) {
      this.spec = this.specInterval;
    }
  }

  specRegen() {
    this.spec = Math.min(this.spec, this.specInterval) - 1;
    if (this.spec <= 0) {
      this.spec = this.specInterval;
      this.player.currentStats.specialAttack = Math.min(100, this.player.currentStats.specialAttack + 10);
    }
  }
}
