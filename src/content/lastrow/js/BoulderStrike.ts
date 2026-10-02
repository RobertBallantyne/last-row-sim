"use strict";

import {
  BasicModel,
  CollisionType,
  Entity,
  GLTFModel,
  LineOfSightMask,
  Location,
  Location3,
  Model,
  Region,
  Settings,
  Unit,
} from "osrs-sdk";
import { hitPlayersOnTile, rollDamage } from "./TileDamage";
import { scaleDamage } from "./LastRowScaling";
// Exported with osrscachereader: modelBuilder spotanim 2244 name baba_ranged (gameval TOA_BABA_RANGED_TRAVEL)
import BoulderRockModel from "../assets/models/baba_ranged.glb";

// Ticks after Ba-Ba's throw (from the GameMaker sim's notes, measured with a 4-tick landing):
//   0: throw sound + rubble, then nothing until a small shadow 2 ticks before impact and a big shadow 1 tick before.
// The landing tick depends on Ba-Ba's path level (see PhantomTimings.babaImpactTick).
const RUBBLE_STAGE = 0;
const IMPACT_LINGER_TICKS = 1;

const FLOOR_Y = -0.49;
const DROP_HEIGHT = 7;
// the rock model hangs 61 units (of 128 per tile) below its origin; lift it so it rests on the floor
const BOULDER_LIFT: Location3[] = [{ x: 0, y: 0, z: 61 / 128 }];

const RUBBLE_COLOR = "#6B6B6B";
const SHADOW_COLOR = "#111111";
const BOULDER_COLOR = "#7A6248";

export class BoulderStrike extends Entity {
  age = 0;

  constructor(
    region: Region,
    location: Location,
    private source: Unit,
    private damageMultiplier: number,
    readonly impactTick: number,
  ) {
    super(region, location);
  }

  get smallShadowTick() {
    return this.impactTick - 2;
  }

  get bigShadowTick() {
    return this.impactTick - 1;
  }

  get collisionType() {
    return CollisionType.NONE;
  }

  get lineOfSight() {
    return LineOfSightMask.NONE;
  }

  get color() {
    return BOULDER_COLOR;
  }

  // the rock model has no animation; GLTF models still need a valid pose index
  get animationIndex() {
    return 0;
  }

  get drawOutline() {
    return false;
  }

  tick() {
    this.age++;
    if (this.age === this.impactTick) {
      hitPlayersOnTile(this.region, this.location, this.source, () =>
        scaleDamage(rollDamage(35, 47), this.damageMultiplier),
      );
    }
    if (this.age > this.impactTick + IMPACT_LINGER_TICKS) {
      this.dying = 0;
    }
  }

  draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D) {
    const tile = Settings.tileSize;
    const x = this.location.x * tile;
    const y = this.location.y * tile;
    if (this.age === RUBBLE_STAGE && this.age < this.smallShadowTick) {
      context.fillStyle = RUBBLE_COLOR;
      [
        [0.25, 0.3],
        [0.6, 0.2],
        [0.45, 0.65],
        [0.75, 0.7],
      ].forEach(([dx, dy]) => context.fillRect(x + dx * tile, y + dy * tile, tile * 0.12, tile * 0.12));
    } else if (this.age === this.smallShadowTick || this.age === this.bigShadowTick) {
      const radius = (this.age === this.smallShadowTick ? 0.25 : 0.42) * tile;
      context.fillStyle = SHADOW_COLOR;
      context.globalAlpha = 0.8;
      context.beginPath();
      context.arc(x + tile / 2, y + tile / 2, radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
    } else if (this.age >= this.impactTick) {
      context.fillStyle = BOULDER_COLOR;
      context.fillRect(x + tile * 0.1, y + tile * 0.1, tile * 0.8, tile * 0.8);
    }
  }

  create3dModel(): Model {
    return new BoulderModel(this);
  }
}

class BoulderModel implements Model {
  private rubble = new BasicModel(0.5, 0.05, 0x6b6b6b, null, { x: 0.25, y: FLOOR_Y - 0.25, z: -0.25 });
  private smallShadow = new BasicModel(0.5, 0.02, 0x111111, null, { x: 0.25, y: FLOOR_Y - 0.25, z: -0.25 });
  private bigShadow = new BasicModel(0.85, 0.02, 0x111111, null, { x: 0.075, y: FLOOR_Y - 0.425, z: -0.075 });
  private boulder: GLTFModel;

  constructor(private strike: BoulderStrike) {
    this.boulder = GLTFModel.forRenderable(strike, BoulderRockModel);
  }

  draw(scene, clockDelta, tickPercent, location, rotation, pitch, visible) {
    const { age, smallShadowTick, bigShadowTick, impactTick } = this.strike;
    const showRubble = age === RUBBLE_STAGE && age < smallShadowTick;
    this.rubble.draw(scene, clockDelta, tickPercent, location, 0, 0, visible && showRubble);
    this.smallShadow.draw(scene, clockDelta, tickPercent, location, 0, 0, visible && age === smallShadowTick);
    this.bigShadow.draw(scene, clockDelta, tickPercent, location, 0, 0, visible && age === bigShadowTick);

    // the boulder falls from the sky across the two shadow ticks and rests on the tile at impact
    const falling = age >= smallShadowTick && age < impactTick;
    const fallProgress = Math.min(1, (age - smallShadowTick + tickPercent) / (impactTick - smallShadowTick));
    const height = falling ? DROP_HEIGHT * (1 - fallProgress) : 0;
    this.boulder.draw(
      scene,
      clockDelta,
      tickPercent,
      { ...location, z: height },
      0,
      0,
      visible && age >= smallShadowTick,
      BOULDER_LIFT,
    );
  }

  destroy(scene) {
    [this.rubble, this.smallShadow, this.bigShadow, this.boulder].forEach((model) => model.destroy(scene));
  }

  getWorldPosition() {
    return this.rubble.getWorldPosition();
  }

  async preload() {
    return;
  }
}
