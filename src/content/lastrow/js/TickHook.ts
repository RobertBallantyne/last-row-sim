"use strict";

import { CollisionType, EmptyModel, Entity, LineOfSightMask, Model, Region } from "osrs-sdk";

// Invisible entity that runs a callback every game tick. Entities tick before players act,
// so this is the place for things that must happen before the player's own tick (e.g. instant specials).
export class TickHook extends Entity {
  constructor(region: Region, private onTick: () => void) {
    super(region, { x: 0, y: 0 });
  }

  get collisionType() {
    return CollisionType.NONE;
  }

  get lineOfSight() {
    return LineOfSightMask.NONE;
  }

  get color() {
    return "#000000";
  }

  draw() {
    // invisible
  }

  create3dModel(): Model {
    return new EmptyModel();
  }

  tick() {
    this.onTick();
  }
}
