"use strict";
import {
  CardinalDirection,
  ControlPanelController,
  GLTFModel,
  InvisibleMovementBlocker,
  ItemName,
  Player,
  Region,
  Settings,
  Trainer,
} from "osrs-sdk";

import { LastRowLoadout, SUPPLY_PRESETS, SupplyPreset } from "./LastRowLoadout";
import { KerisPartisanOfTheSun } from "./items/KerisPartisanOfTheSun";
import { LightbearerRegenTimer } from "./items/Lightbearer";
import { TickHook } from "./TickHook";
import { layoutOf } from "./InventoryLayout";
import { BossHealthBar } from "./BossHealthBar";
import { Warden } from "./mobs/Warden";
import { WardenAttackController } from "./WardenAttackController";
import { ArenaBoss } from "./ArenaBoss";
import { BABA_PHANTOM_FIT, ZEBAK_PHANTOM_FIT } from "./ModelFit";
import { LastRowSettings, PHANTOM_OFF } from "./LastRowSettings";
import { MAX_PATH_LEVEL, MAX_RAID_LEVEL, wardenDefence, wardenMaxHitpoints } from "./LastRowScaling";
import {
  BABA_X,
  REGION_HEIGHT,
  SIDE_BOSS_SIZE,
  SIDE_BOSS_Y,
  ZEBAK_X,
  REGION_WIDTH,
  ROW_LENGTH,
  ROW_X,
  ROW_Y,
  WARDEN_X,
  WARDEN_Y,
  rowTileX,
} from "./LastRowConstants";

import SidebarContent from "../sidebar.html";
import ZebakImage from "../assets/images/zebak_phantom.png";
import BabaImage from "../assets/images/baba_phantom.png";
// Exported with osrscachereader (animation 0 = idle, 1 = attack; names from RuneLite's gameval AnimationID):
//   modelBuilder npc 11774 anim 9618,9624,9626 name zebak_phantom
//     (NPC_ZEBAK01_IDLE, NPC_ZEBAK01_ATTACK_RANGED, NPC_ZEBAK01_ATTACK_RANGED_ENRAGED)
//   modelBuilder npc 11775 anim 9741,9744,9745,9749 name baba_phantom
//     (NPC_MANDRILL_IDLE, NPC_MANDRILL_ATTACK_RANGED_01, _RANGED_02, NPC_MANDRILL_ATTACK_SPECIAL_RANGED01)
import ZebakModel from "../assets/models/zebak_phantom.glb";
import BabaModel from "../assets/models/baba_phantom.glb";
import LightningBoltModel from "../assets/models/lightning_strike.glb";
import JugModel from "../assets/models/zebak_jug.glb";
import RockModel from "../assets/models/zebak_rock.glb";
import BoulderRockModel from "../assets/models/baba_ranged.glb";

const EFFECT_MODELS = [LightningBoltModel, JugModel, RockModel, BoulderRockModel];

export class LastRowRegion extends Region {
  // initialiseRegion runs again on every reset, but the sidebar DOM persists, so bind its listeners once
  private sidebarBound = false;
  // created on first use: every region is constructed on every page, but only this page should show the bar
  private bossBar: BossHealthBar | null = null;
  private warden: Warden | null = null;

  get initialFacing() {
    return CardinalDirection.NORTH;
  }

  getName() {
    return "Last Row";
  }

  get width(): number {
    return REGION_WIDTH;
  }

  get height(): number {
    return REGION_HEIGHT;
  }

  private bindSidebar() {
    if (this.sidebarBound) {
      return;
    }
    this.sidebarBound = true;
    LastRowSettings.readFromStorage();

    const use3dViewCheckbox = document.getElementById("use3dView") as HTMLInputElement;
    use3dViewCheckbox.checked = Settings.use3dView;
    use3dViewCheckbox.addEventListener("change", () => {
      Settings.use3dView = use3dViewCheckbox.checked;
      Settings.persistToStorage();
      window.location.reload();
    });

    // apply a changed setting by saving it and restarting the fight
    const applyAndRestart = () => {
      LastRowSettings.persistToStorage();
      Trainer.reset();
    };

    this.bindNumberInput("lastrow_raidLevel", 0, MAX_RAID_LEVEL, LastRowSettings.raidLevel, (value) => {
      LastRowSettings.raidLevel = value;
      applyAndRestart();
    });
    this.bindNumberInput(
      "lastrow_startingHitpointsPercent",
      1,
      100,
      LastRowSettings.startingHitpointsPercent,
      (value) => {
        LastRowSettings.startingHitpointsPercent = value;
        applyAndRestart();
      },
    );
    this.bindSelect("lastrow_zebakPathLevel", LastRowSettings.zebakPathLevel, (value) => {
      LastRowSettings.zebakPathLevel = value;
      applyAndRestart();
    });
    this.bindSelect("lastrow_babaPathLevel", LastRowSettings.babaPathLevel, (value) => {
      LastRowSettings.babaPathLevel = value;
      applyAndRestart();
    });

    const suppliesSelect = document.getElementById("lastrow_supplies") as HTMLSelectElement;
    Object.entries(SUPPLY_PRESETS).forEach(([value, label]) => suppliesSelect.add(new Option(label, value)));
    suppliesSelect.value = LastRowSettings.supplies;
    suppliesSelect.addEventListener("change", () => {
      LastRowSettings.supplies = suppliesSelect.value as SupplyPreset;
      applyAndRestart();
    });

    const lightbearerCheckbox = document.getElementById("lastrow_lightbearer") as HTMLInputElement;
    lightbearerCheckbox.checked = LastRowSettings.lightbearer;
    lightbearerCheckbox.addEventListener("change", () => {
      LastRowSettings.lightbearer = lightbearerCheckbox.checked;
      applyAndRestart();
    });

    // Inventory layouts: drag items where you want them, then save; every restart uses that layout.
    const layoutStatus = document.getElementById("lastrow_layoutStatus");
    const presetName = () => SUPPLY_PRESETS[LastRowSettings.supplies];
    document.getElementById("lastrow_saveLayout").addEventListener("click", () => {
      const player = this.players[0];
      if (!player) {
        return;
      }
      LastRowSettings.saveInventoryLayout(LastRowSettings.supplies, this.currentLayout(player));
      layoutStatus.innerText = `Layout saved for "${presetName()}".`;
    });
    document.getElementById("lastrow_resetLayout").addEventListener("click", () => {
      LastRowSettings.saveInventoryLayout(LastRowSettings.supplies, null);
      layoutStatus.innerText = `Layout reset for "${presetName()}".`;
      Trainer.reset();
    });
  }

  // The player's inventory as a layout. If they've swapped to the keris, the bow sitting in the inventory
  // marks where the keris lives at the start of a fight.
  private currentLayout(player: Player) {
    const layout = layoutOf(player.inventory);
    const equipped = player.equipment.weapon;
    if (equipped instanceof KerisPartisanOfTheSun) {
      return layout.map((name) => (name === ItemName.BOWFA ? equipped.itemName : name));
    }
    return layout;
  }

  private bindNumberInput(id: string, min: number, max: number, initial: number, onChange: (value: number) => void) {
    const input = document.getElementById(id) as HTMLInputElement;
    input.value = String(initial);
    // stop the game treating typing as hotkeys
    input.addEventListener("focus", () => (ControlPanelController.controller.isUsingExternalUI = true));
    input.addEventListener("focusout", () => (ControlPanelController.controller.isUsingExternalUI = false));
    input.addEventListener("change", () => {
      const parsed = parseInt(input.value, 10);
      const value = isNaN(parsed) ? initial : Math.min(max, Math.max(min, parsed));
      input.value = String(value);
      initial = value;
      onChange(value);
    });
  }

  private bindSelect(id: string, initial: number, onChange: (value: number) => void) {
    const select = document.getElementById(id) as HTMLSelectElement;
    select.value = String(Math.min(MAX_PATH_LEVEL, initial));
    select.addEventListener("change", () => onChange(parseInt(select.value, 10)));
  }

  private updateSummary() {
    const summary = document.getElementById("lastrow_summary");
    const raidLevel = LastRowSettings.raidLevel;
    summary.innerText = `Warden: ${wardenMaxHitpoints(raidLevel)} max HP, ${wardenDefence(raidLevel)} Defence`;
  }

  initialiseRegion() {
    this.bindSidebar();
    this.updateSummary();

    const player = new Player(this, { x: rowTileX(Math.floor(ROW_LENGTH / 2)), y: ROW_Y });
    this.addPlayer(player);

    const loadout = new LastRowLoadout(
      LastRowSettings.supplies,
      LastRowSettings.loadInventoryLayout(LastRowSettings.supplies),
      LastRowSettings.lightbearer,
    );
    loadout.setStats(player);
    player.setUnitOptions(loadout.getLoadout());
    // special attack regen that knows about the Lightbearer
    player.regenTimer = new LightbearerRegenTimer(player);

    // the keris special heals without attacking, so fire it as soon as it's toggled on
    this.addEntity(new TickHook(this, () => KerisPartisanOfTheSun.tryInstantSpecial(player)));

    // Fence the player into the single row of standable tiles.
    for (let x = ROW_X - 1; x <= ROW_X + ROW_LENGTH; x++) {
      this.addEntity(new InvisibleMovementBlocker(this, { x, y: ROW_Y - 1 }));
      this.addEntity(new InvisibleMovementBlocker(this, { x, y: ROW_Y + 1 }));
    }
    this.addEntity(new InvisibleMovementBlocker(this, { x: ROW_X - 1, y: ROW_Y }));
    this.addEntity(new InvisibleMovementBlocker(this, { x: ROW_X + ROW_LENGTH, y: ROW_Y }));

    const warden = new Warden(this, { x: WARDEN_X, y: WARDEN_Y }, { aggro: player });
    this.addMob(warden);
    this.warden = warden;
    this.bossBar ??= new BossHealthBar("Tumeken's Warden");
    this.bossBar.update(warden);
    // a phantom set to "Off" in the sidebar isn't added at all, so neither it nor its attacks appear
    let zebak: ArenaBoss | null = null;
    if (LastRowSettings.zebakPathLevel !== PHANTOM_OFF) {
      zebak = new ArenaBoss(
        this,
        { x: ZEBAK_X, y: SIDE_BOSS_Y },
        {
          name: "Zebak's Phantom",
          image: ZebakImage,
          faceEast: true,
          model: { url: ZebakModel, fit: ZEBAK_PHANTOM_FIT, attackAnimation: 1 },
        },
        SIDE_BOSS_SIZE,
      );
      this.addEntity(zebak);
    }
    let baba: ArenaBoss | null = null;
    if (LastRowSettings.babaPathLevel !== PHANTOM_OFF) {
      baba = new ArenaBoss(
        this,
        { x: BABA_X, y: SIDE_BOSS_Y },
        {
          name: "Ba-Ba's Phantom",
          image: BabaImage,
          faceEast: false,
          model: { url: BabaModel, fit: BABA_PHANTOM_FIT, attackAnimation: 1 },
        },
        SIDE_BOSS_SIZE,
      );
      this.addEntity(baba);
    }
    this.addEntity(
      new WardenAttackController(this, warden, zebak, baba, {
        raidLevel: LastRowSettings.raidLevel,
        zebakPathLevel: LastRowSettings.zebakPathLevel,
        babaPathLevel: LastRowSettings.babaPathLevel,
      }),
    );

    player.perceivedLocation = player.location;
    player.destinationLocation = player.location;

    return { player };
  }

  drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number) {
    context.fillStyle = "#0b0b0b";
    context.fillRect(0, 0, REGION_WIDTH * scale, REGION_HEIGHT * scale);

    // the last remaining row of floor
    for (let i = 0; i < ROW_LENGTH; i++) {
      context.fillStyle = i % 2 === 0 ? "#8a7a5c" : "#7d6f53";
      context.fillRect(rowTileX(i) * scale, ROW_Y * scale, scale, scale);
    }
  }

  postTick() {
    super.postTick();
    this.bossBar?.update(this.warden);
  }

  drawDefaultFloor() {
    return true;
  }

  // attack effects are spawned mid-fight, so load their models during the loading screen
  async preload() {
    await super.preload();
    await Promise.all(EFFECT_MODELS.map((model) => GLTFModel.preload(model)));
  }

  getSidebarContent() {
    return SidebarContent;
  }
}
