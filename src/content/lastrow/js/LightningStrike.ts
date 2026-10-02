"use strict";

import {
  BasicModel,
  CollisionType,
  Entity,
  GLTFModel,
  LineOfSightMask,
  Location,
  Model,
  Region,
  Settings,
  Unit,
} from "osrs-sdk";
// Exported with osrscachereader: modelBuilder spotanim 2197 name lightning_strike (gameval WARDENS_LIGHTNING)
import LightningBoltModel from "../assets/models/lightning_strike.glb";
import { hitPlayersOnTile, rollDamage } from "./TileDamage";
import { scaleDamage } from "./LastRowScaling";

// shadow sizes for the small > mid > large telegraph before the strike
const SHADOW_STAGES = 3;
const SHADOW_SCALE = [0.35, 0.6, 0.85];
const ZAP_LINGER_TICKS = 1;
const FLOOR_Y = -0.49;

// Shared by every strike in one lightning cycle: the player can only be hit once per cycle.
export interface LightningCycleState {
  playerHit: boolean;
}

export class LightningStrike extends Entity {
  age = 0;

  constructor(
    region: Region,
    location: Location,
    readonly delay: number,
    private source: Unit,
    private cycle: LightningCycleState,
    private damageMultiplier: number,
  ) {
    super(region, location);
  }

  // < 0: not visible yet, 0-2: shadow, 3: strike, then lingers briefly
  get stage() {
    return this.age - this.delay;
  }

  get collisionType() {
    return CollisionType.NONE;
  }

  get lineOfSight() {
    return LineOfSightMask.NONE;
  }

  get color() {
    return this.stage >= SHADOW_STAGES ? "#FFF35C" : "#1A1A2E";
  }

  visible() {
    return this.stage >= 0;
  }

  // the bolt model loops its strike animation (index 0)
  get animationIndex() {
    return 0;
  }

  get drawOutline() {
    return false;
  }

  tick() {
    this.age++;
    if (this.stage === SHADOW_STAGES) {
      this.strike();
    }
    if (this.stage > SHADOW_STAGES + ZAP_LINGER_TICKS) {
      this.dying = 0;
    }
  }

  private strike() {
    if (this.cycle.playerHit) {
      return;
    }
    const damage = () => scaleDamage(rollDamage(17, 27), this.damageMultiplier);
    if (hitPlayersOnTile(this.region, this.location, this.source, damage)) {
      this.cycle.playerHit = true;
    }
  }

  draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D) {
    if (!this.visible()) {
      return;
    }
    const scale = this.stage >= SHADOW_STAGES ? 1 : SHADOW_SCALE[this.stage];
    const inset = ((1 - scale) / 2) * Settings.tileSize;
    context.fillStyle = this.color;
    context.globalAlpha = 0.8;
    context.fillRect(
      this.location.x * Settings.tileSize + inset,
      this.location.y * Settings.tileSize + inset,
      Settings.tileSize - inset * 2,
      Settings.tileSize - inset * 2,
    );
    context.globalAlpha = 1;
  }

  create3dModel(): Model {
    return new LightningModel(this);
  }
}

// Swaps between per-stage meshes so the shadow grows, then shows the game's lightning bolt for the strike.
class LightningModel implements Model {
  private stageModels: BasicModel[];
  private bolt: GLTFModel;

  constructor(private strike: LightningStrike) {
    this.stageModels = SHADOW_SCALE.map(
      (s) => new BasicModel(s, 0.02, 0x1a1a2e, null, { x: 0.5 - s / 2, y: FLOOR_Y - s / 2, z: -0.5 + s / 2 }),
    );
    this.bolt = GLTFModel.forRenderable(strike, LightningBoltModel);
  }

  draw(scene, clockDelta, tickPercent, location, rotation, pitch, visible) {
    const stage = this.strike.stage;
    this.stageModels.forEach((model, index) =>
      model.draw(scene, clockDelta, tickPercent, location, 0, 0, visible && index === stage),
    );
    this.bolt.draw(scene, clockDelta, tickPercent, location, 0, 0, visible && stage >= SHADOW_STAGES, []);
  }

  destroy(scene) {
    this.stageModels.forEach((model) => model.destroy(scene));
    this.bolt.destroy(scene);
  }

  getWorldPosition() {
    return this.stageModels[0].getWorldPosition();
  }

  async preload() {
    return;
  }
}
