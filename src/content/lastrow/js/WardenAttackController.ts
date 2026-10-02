"use strict";

import { CollisionType, EmptyModel, Entity, LineOfSightMask, Model, Player, Random, Region, Unit } from "osrs-sdk";
import { ROW_Y, rowIndexOf, rowTileX } from "./LastRowConstants";
import { BoulderStrike } from "./BoulderStrike";
import { LightningStrike } from "./LightningStrike";
import { ROW_TILES, SAFE, rollLightningCycle } from "./LightningPattern";
import { ArenaBoss } from "./ArenaBoss";
import { ZebakProjectile } from "./ZebakProjectile";
import { ZEBAK_ATTACK_INTERVAL, babaImpactTick, zebakTiming } from "./PhantomTimings";
import { ZebakStyle, rollZebakStyle } from "./ZebakPattern";
import { damageMultiplier } from "./LastRowScaling";

// Difficulty inputs for the arena attacks: raid level and the phantoms' path levels.
export interface ArenaDifficulty {
  raidLevel: number;
  zebakPathLevel: number;
  babaPathLevel: number;
}

// One independent attack pattern. Each keeps its own timer and spawns its own entities,
// so attacks can be added, tuned or toggled without affecting each other.
interface ArenaAttack {
  tick(player: Player): void;
}

// the GameMaker sim starts the first lightning cycle 2 ticks after the fight begins
const FIRST_LIGHTNING_DELAY = 2;
const LIGHTNING_CYCLE_TICKS = 6;
const BOULDER_INTERVAL_TICKS = 3;

class LightningAttack implements ArenaAttack {
  private ticksUntilNext = FIRST_LIGHTNING_DELAY;

  constructor(private region: Region, private source: Unit, private damageMultiplier: number) {}

  tick(player: Player) {
    if (--this.ticksUntilNext > 0) {
      return;
    }
    this.ticksUntilNext = LIGHTNING_CYCLE_TICKS;

    // if the player is somehow off the row, centre the guaranteed safe spots
    const playerTile = rowIndexOf(player.location.x, player.location.y);
    const tile = playerTile === -1 ? Math.floor(ROW_TILES / 2) : playerTile;
    const cycle = { playerHit: false };
    rollLightningCycle(tile, () => Random.get()).forEach((delay, index) => {
      if (delay !== SAFE) {
        this.region.addEntity(
          new LightningStrike(
            this.region,
            { x: rowTileX(index), y: ROW_Y },
            delay,
            this.source,
            cycle,
            this.damageMultiplier,
          ),
        );
      }
    });
  }
}

// Ba-Ba throws a boulder at the player's current tile every 3 ticks,
// starting 0-2 ticks after the first lightning cycle.
// Path level makes the boulders fall faster (not more often): see PhantomTimings.babaImpactTick.
class BabaBoulderAttack implements ArenaAttack {
  private ticksUntilNext = FIRST_LIGHTNING_DELAY + Math.floor(Random.get() * 3);

  constructor(
    private region: Region,
    private source: Unit,
    private baba: ArenaBoss,
    private pathLevel: number,
    private damageMultiplier: number,
  ) {}

  tick(player: Player) {
    if (--this.ticksUntilNext > 0) {
      return;
    }
    this.ticksUntilNext = BOULDER_INTERVAL_TICKS;
    this.baba.playAttackAnimation();
    this.region.addEntity(
      new BoulderStrike(
        this.region,
        { x: player.location.x, y: player.location.y },
        this.source,
        this.damageMultiplier,
        babaImpactTick(this.pathLevel),
      ),
    );
  }
}

// Zebak alternates magic pots and ranged rocks, aimed at the player wherever they move.
// He attacks every 4 ticks at any path level; path level makes his jug/rock break and fly faster
// (see PhantomTimings).
class ZebakAttack implements ArenaAttack {
  private ticksUntilNext = FIRST_LIGHTNING_DELAY;
  private previousStyle: ZebakStyle | null = null;

  constructor(
    private region: Region,
    private source: Unit,
    private zebak: ArenaBoss,
    private pathLevel: number,
    private damageMultiplier: number,
  ) {}

  tick(player: Player) {
    if (--this.ticksUntilNext > 0) {
      return;
    }
    this.ticksUntilNext = ZEBAK_ATTACK_INTERVAL;
    const style = rollZebakStyle(this.previousStyle, () => Random.get());
    this.previousStyle = style;
    this.zebak.playAttackAnimation();
    this.region.addEntity(
      new ZebakProjectile(
        this.region,
        this.zebak.centre,
        player,
        style,
        this.source,
        zebakTiming(this.pathLevel),
        this.damageMultiplier,
      ),
    );
  }
}

// Invisible entity that drives the Warden's arena attacks on the game tick.
// Entities tick before players move, matching OSRS's NPC-before-player processing order.
export class WardenAttackController extends Entity {
  private attacks: ArenaAttack[];

  // a phantom passed as null is switched off, so its attack isn't scheduled
  constructor(
    region: Region,
    private warden: Unit,
    zebak: ArenaBoss | null,
    baba: ArenaBoss | null,
    difficulty: ArenaDifficulty,
  ) {
    super(region, { x: 0, y: 0 });
    const { raidLevel, zebakPathLevel, babaPathLevel } = difficulty;
    this.attacks = [new LightningAttack(region, warden, damageMultiplier(raidLevel))];
    if (baba) {
      this.attacks.push(new BabaBoulderAttack(region, warden, baba, babaPathLevel, damageMultiplier(raidLevel, babaPathLevel)));
    }
    if (zebak) {
      this.attacks.push(
        new ZebakAttack(region, warden, zebak, zebakPathLevel, damageMultiplier(raidLevel, zebakPathLevel)),
      );
    }
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
    if (this.region.world.getReadyTimer > 0 || this.warden.dying >= 0) {
      return;
    }
    const player = this.region.players[0];
    if (!player || player.dying >= 0) {
      return;
    }
    this.attacks.forEach((attack) => attack.tick(player));
  }
}
