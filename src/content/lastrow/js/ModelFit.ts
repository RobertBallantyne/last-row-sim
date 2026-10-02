"use strict";

import { GLTFModelOptions, Location3 } from "osrs-sdk";

// How to place a model exported by osrscachereader so it matches the game.
//   - npcScale: the NPC definition's width/height scale (128 = 100%). The exporter doesn't apply it.
//   - bounds: the raw model's bounding box in model units (128 = 1 tile), measured from the exported file.
// The exported models aren't always centred on their origin and can dip below it, so we shift them to sit
// centred on the NPC's footprint with their lowest point on the floor.
export interface ModelFit {
  npcScale: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  // extra multiplier, matched by eye against in-game screenshots, for when the cache scale alone looks wrong
  visualScale?: number;
  // keep the model's own origin height instead of lifting its lowest point onto the floor
  // (for models that are meant to rise out of the ground)
  keepOriginHeight?: boolean;
  // move the model this many tiles towards the direction it faces, within its footprint
  forwardShift?: number;
}

const MODEL_UNITS_PER_TILE = 128;

function tilesPerModelUnit(fit: ModelFit) {
  return (fit.npcScale / 128 / MODEL_UNITS_PER_TILE) * (fit.visualScale ?? 1);
}

export function modelOptions(fit: ModelFit): GLTFModelOptions {
  return { scale: tilesPerModelUnit(fit) };
}

// Offsets for Renderable.getPerceivedOffsets(): x/y are horizontal, z is up, all in tiles.
export function modelOffsets(fit: ModelFit): Location3[] {
  const scale = tilesPerModelUnit(fit);
  const [minX, minY, minZ] = fit.bounds.min;
  const [maxX, , maxZ] = fit.bounds.max;
  return [
    {
      x: -((minX + maxX) / 2) * scale,
      y: -((minZ + maxZ) / 2) * scale + (fit.forwardShift ?? 0),
      z: fit.keepOriginHeight ? 0 : -minY * scale,
    },
  ];
}

// Measured from the exported .gltf files (POSITION accessor min/max); scales from the cache NPC definitions.
export const WARDEN_FIT: ModelFit = {
  npcScale: 300,
  bounds: { min: [-163, -71, -128], max: [138, 299, 128] },
  // in game the Warden stands about 4x the player's height; the cache scale alone gives about 2.4x
  visualScale: 1.6,
  // in game it rises straight out of the floor behind the last row
  keepOriginHeight: true,
  // its footprint can't overlap the row, so pull the model forward to stand right behind it
  forwardShift: 1.5,
};
export const ZEBAK_PHANTOM_FIT: ModelFit = {
  npcScale: 80,
  bounds: { min: [-314, 0, -44], max: [314, 722, 1049] },
};
export const BABA_PHANTOM_FIT: ModelFit = {
  npcScale: 130,
  bounds: { min: [-122, -61, -332], max: [122, 384, 202] },
};
