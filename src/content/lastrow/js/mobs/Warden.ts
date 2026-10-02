"use strict";

import { GLTFModel, Location, MagicWeapon, Mob, Pathing, Region, UnitBonuses, UnitOptions } from "osrs-sdk";
import { ROW_LENGTH, ROW_Y, WARDEN_SIZE, rowTileX } from "../LastRowConstants";
import { wardenDefence, wardenMaxHitpoints } from "../LastRowScaling";
import { LastRowSettings } from "../LastRowSettings";
import { WARDEN_FIT, modelOffsets, modelOptions } from "../ModelFit";

// 2D sprite from the GameMaker Last Row Sim
import WardenImage from "../../assets/images/warden.png";
// Exported with osrscachereader: modelBuilder npc 11762 anim 9657 name warden
// (NPC_WARDENS_IDLE05 in RuneLite's gameval AnimationID; the enrage animations looked too violent compared to the game)
import WardenModel from "../../assets/models/warden.glb";

// Tumeken's Warden in its enraged (last row) state. It never moves and never attacks directly;
// the lightning, Zebak and Ba-Ba attacks are driven separately on a tick schedule.
// Stats from the OSRS wiki (phase 3), scaled by raid level.
export class Warden extends Mob {
  constructor(region: Region, location: Location, options: UnitOptions) {
    super(region, location, options);
    // Unit's constructor resets hitpoints to max after setStats, so apply the last-row starting HP here
    this.currentStats.hitpoint = Math.max(
      1,
      Math.floor((this.stats.hitpoint * LastRowSettings.startingHitpointsPercent) / 100),
    );
  }

  // the model only contains its idle (animation 0), and the Warden never moves
  get idlePoseId() {
    return 0;
  }

  get walkingPoseId() {
    return 0;
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

  mobName() {
    return "Warden";
  }

  get combatLevel() {
    return 0;
  }

  override get height() {
    return 6;
  }

  setStats() {
    this.weapons = {
      magic: new MagicWeapon(),
    };

    const raidLevel = LastRowSettings.raidLevel;
    this.stats = {
      attack: 150,
      strength: 150,
      defence: wardenDefence(raidLevel),
      range: 150,
      magic: 150,
      hitpoint: wardenMaxHitpoints(raidLevel),
    };

    this.currentStats = JSON.parse(JSON.stringify(this.stats));
  }

  get bonuses(): UnitBonuses {
    return {
      attack: {
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        range: 0,
      },
      defence: {
        stab: 40,
        slash: 40,
        crush: 20,
        magic: 20,
        range: 20,
      },
      other: {
        meleeStrength: 0,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      },
    };
  }

  get attackSpeed() {
    return 4;
  }

  get attackRange() {
    return 0;
  }

  get size() {
    return WARDEN_SIZE;
  }

  get color() {
    return "#C9A227";
  }

  canMove() {
    return false;
  }

  attackIfPossible() {
    // the Warden's damage comes from the arena attacks, not from the Warden itself
  }

  get image() {
    return WardenImage;
  }

  override create3dModel() {
    return GLTFModel.forRenderable(this, WardenModel, modelOptions(WARDEN_FIT));
  }

  getPerceivedOffsets() {
    return modelOffsets(WARDEN_FIT);
  }
}
