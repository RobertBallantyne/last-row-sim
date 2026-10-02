"use strict";

import {
  CollisionType,
  Entity,
  GLTFModel,
  LineOfSightMask,
  Location,
  Location3,
  Model,
  Player,
  Projectile,
  Random,
  Region,
  Settings,
  Unit,
} from "osrs-sdk";
import { ZebakStyle, rollZebakDamage } from "./ZebakPattern";
import { scaleDamage } from "./LastRowScaling";
import { ZebakTiming } from "./PhantomTimings";
// Exported with osrscachereader (gameval names ZEBAK_MAGE_PROJANIM_INITIAL / ZEBAK_RANGE_PROJANIM_INITIAL):
//   modelBuilder spotanim 2176 name zebak_jug
//   modelBuilder spotanim 2178 name zebak_rock
import JugModel from "../assets/models/zebak_jug.glb";
import RockModel from "../assets/models/zebak_rock.glb";

// Ticks after Zebak winds up (from the GameMaker sim's notes):
//   0: mouth full, 1: pot/rock appears and rises, launch tick: breaks and the projectile flies at the player,
//   launch + flight: prayer is checked, next tick: damage lands.
// The launch tick and flight time depend on Zebak's path level (see PhantomTimings.zebakTiming).
const APPEAR_TICK = 1;
const RISE_HEIGHT = 4;
const LAND_HEIGHT = 1;

const STYLE_PRAYER: Record<ZebakStyle, string> = {
  magic: "Protect from Magic",
  range: "Protect from Range",
};
const STYLE_COLOR: Record<ZebakStyle, string> = {
  magic: "#3F7FFF",
  range: "#9C8A5A",
};

export class ZebakProjectile extends Entity {
  age = 0;
  private launchTick: number;
  private landTick: number;

  constructor(
    region: Region,
    private origin: Location,
    private target: Player,
    readonly style: ZebakStyle,
    private source: Unit,
    timing: ZebakTiming,
    private damageMultiplier: number,
  ) {
    super(region, { ...origin });
    this.launchTick = timing.launchTick;
    this.landTick = timing.launchTick + timing.flightTicks;
  }

  get collisionType() {
    return CollisionType.NONE;
  }

  get lineOfSight() {
    return LineOfSightMask.NONE;
  }

  get color() {
    return STYLE_COLOR[this.style];
  }

  visible() {
    return this.age >= APPEAR_TICK && this.age < this.landTick;
  }

  tick() {
    this.age++;
    if (this.age === this.landTick) {
      this.land();
    }
    if (this.age > this.landTick) {
      this.dying = 0;
    }
  }

  private land() {
    const player = this.target;
    if (player.dying >= 0) {
      return;
    }
    // Entity ticks run before the player's tick, so this is the prayer as of the start of this tick.
    const protectedAgainst = !!player.prayerController.isPrayerActiveByName(STYLE_PRAYER[this.style]);
    const damage = protectedAgainst ? 0 : scaleDamage(rollZebakDamage(() => Random.get()), this.damageMultiplier);
    // setDelay 2: the player's own tick consumes one, so the hitsplat appears next tick
    player.addProjectile(
      new Projectile(null, damage, this.source, player, this.style === "magic" ? "magic" : "range", {
        hidden: true,
        setDelay: 2,
      }),
    );
  }

  // Location (in tile coordinates) and height of the projectile at this moment.
  private flightPosition(tickPercent: number): Location3 {
    const t = this.age + tickPercent;
    if (t < this.launchTick) {
      const rise = Math.max(0, (t - APPEAR_TICK) / (this.launchTick - APPEAR_TICK));
      return { x: this.origin.x, y: this.origin.y, z: 3 + rise * RISE_HEIGHT };
    }
    const progress = Math.min(1, (t - this.launchTick) / (this.landTick - this.launchTick));
    const to = this.target.getPerceivedLocation(tickPercent);
    const startHeight = 3 + RISE_HEIGHT;
    return {
      x: this.origin.x + (to.x - this.origin.x) * progress,
      y: this.origin.y + (to.y - this.origin.y) * progress,
      z: startHeight + (LAND_HEIGHT - startHeight) * progress,
    };
  }

  getPerceivedLocation(tickPercent: number): Location3 {
    return this.flightPosition(tickPercent);
  }

  draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D) {
    if (!this.visible()) {
      return;
    }
    const { x, y } = this.flightPosition(tickPercent);
    const tile = Settings.tileSize;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc((x + 0.5) * tile, (y + 0.5) * tile, tile * (this.age < this.launchTick ? 0.4 : 0.25), 0, Math.PI * 2);
    context.fill();
  }

  // the jug/rock models loop their spin animation (index 0)
  get animationIndex() {
    return 0;
  }

  get drawOutline() {
    return false;
  }

  create3dModel(): Model {
    return GLTFModel.forRenderable(this, this.style === "magic" ? JugModel : RockModel);
  }
}
