"use strict";

import { Unit } from "osrs-sdk";

// A boss health bar overlaid on the top centre of the game view, showing HP and %HP.
// Sits just below the XP counter so it doesn't cover it.
// It's plain HTML so it sits above both the 2D and 3D views.
export class BossHealthBar {
  private root: HTMLDivElement;
  private fill: HTMLDivElement;
  private label: HTMLDivElement;

  constructor(private name: string) {
    this.root = document.createElement("div");
    Object.assign(this.root.style, {
      position: "fixed",
      top: "36px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "260px",
      height: "26px",
      background: "#8b0000",
      border: "1px solid #000",
      boxShadow: "0 0 0 1px #5a4a2f",
      zIndex: "10",
      pointerEvents: "none",
      fontFamily: "OSRS",
    });

    this.fill = document.createElement("div");
    Object.assign(this.fill.style, { height: "100%", width: "100%", background: "#0d9b00" });

    this.label = document.createElement("div");
    Object.assign(this.label.style, {
      position: "absolute",
      inset: "0",
      color: "#fff",
      fontSize: "16px",
      lineHeight: "26px",
      textAlign: "center",
      textShadow: "1px 1px 0 #000",
      whiteSpace: "nowrap",
    });

    this.root.append(this.fill, this.label);
    document.body.appendChild(this.root);
  }

  // centre over the game canvas rather than the window, which also includes the sidebar
  private centreOverGameView() {
    const canvas = document.getElementById("world");
    if (canvas) {
      const { left, width } = canvas.getBoundingClientRect();
      this.root.style.left = `${left + width / 2}px`;
    }
  }

  update(boss: Unit | null) {
    const max = boss ? boss.stats.hitpoint : 0;
    const current = boss ? Math.max(0, boss.currentStats.hitpoint) : 0;
    const percent = max > 0 ? (current / max) * 100 : 0;
    this.fill.style.width = `${percent}%`;
    this.centreOverGameView();
    this.label.innerText = `${current} / ${max} (${percent.toFixed(1)}%)`;
  }
}
