"use strict";

import {
  CanvasSpriteModel,
  CollisionType,
  Entity,
  GLTFModel,
  ImageLoader,
  LineOfSightMask,
  Location,
  Model,
  Pathing,
  Region,
  Settings,
} from "osrs-sdk";
import { ModelFit, modelOffsets, modelOptions } from "./ModelFit";
import { ROW_LENGTH, ROW_Y, rowTileX } from "./LastRowConstants";

export interface ArenaBossAppearance {
  name: string;
  // 2D image; the source images face west
  image: string;
  // mirror the 2D image to face east
  faceEast: boolean;
  // 3D model exported from the cache (animation 0 = idle) and how to fit it; falls back to a cut-out of the image
  model?: { url: string; fit: ModelFit; attackAnimation?: number };
}

// Non-attackable side boss (Zebak, Ba-Ba) so attacks have a visible origin.
export class ArenaBoss extends Entity {
  private image: HTMLImageElement;

  constructor(
    region: Region,
    location: Location,
    private appearance: ArenaBossAppearance,
    private bossSize: number,
  ) {
    super(region, location);
    this.image = ImageLoader.createImage(appearance.image);
  }

  entityName() {
    return this.appearance.name;
  }

  get size() {
    return this.bossSize;
  }

  get height() {
    return 3;
  }

  get color() {
    return "#FFFFFF";
  }

  get collisionType() {
    return CollisionType.NONE;
  }

  get lineOfSight() {
    return LineOfSightMask.NONE;
  }

  // GLTF models play the animation at this index on loop; 0 is the idle
  get animationIndex() {
    return 0;
  }

  // plays once, then the model returns to its idle
  playAttackAnimation() {
    const attackAnimation = this.appearance.model?.attackAnimation;
    if (attackAnimation !== undefined) {
      this.playAnimation(attackAnimation);
    }
  }

  // Always face the middle of the last row rather than turning to track the player.
  // Uses the same angle maths as Unit.getPerceivedRotation, just with a fixed target.
  getPerceivedRotation() {
    return -Pathing.angle(
      this.location.x + this.size / 2,
      this.location.y - this.size / 2,
      rowTileX(Math.floor(ROW_LENGTH / 2)) + 0.5,
      ROW_Y - 0.5,
    );
  }

  // the tile at the centre of the boss, in location coordinates; where its projectiles start
  get centre(): Location {
    const half = Math.floor(this.size / 2);
    return { x: this.location.x + half, y: this.location.y - half };
  }

  // `offset` and `scale` are supplied by both the 2D viewport and the 3D cut-out renderer
  draw(tickPercent: number, context: OffscreenCanvasRenderingContext2D, offset?: Location, scale?: number) {
    if (!this.image || !this.image.complete || this.image.naturalWidth === 0) {
      return;
    }
    const tile = scale ?? Settings.tileSize;
    const origin = offset ?? this.location;
    const box = this.size * tile;
    const left = origin.x * tile;
    const top = (origin.y - this.size + 1) * tile;

    // fit the image inside the boss's footprint, keeping its proportions, sitting on the bottom edge
    const fit = Math.min(box / this.image.naturalWidth, box / this.image.naturalHeight);
    const width = this.image.naturalWidth * fit;
    const height = this.image.naturalHeight * fit;
    const x = left + (box - width) / 2;
    const y = top + (box - height);

    context.save();
    if (this.appearance.faceEast) {
      context.translate(x + width, y);
      context.scale(-1, 1);
      context.drawImage(this.image, 0, 0, width, height);
    } else {
      context.drawImage(this.image, x, y, width, height);
    }
    context.restore();
  }

  getPerceivedOffsets() {
    return this.appearance.model ? modelOffsets(this.appearance.model.fit) : [];
  }

  create3dModel(): Model {
    const model = this.appearance.model;
    if (model) {
      return GLTFModel.forRenderable(this, model.url, modelOptions(model.fit));
    }
    return CanvasSpriteModel.forRenderable(this);
  }
}
