"use strict";

// Layout of the Warden P3 "last row" arena, in region tile coordinates.
// Smaller y is further north (the same convention as the Inferno region).
//
// Mechanics references (tick timings, lightning RNG, Zebak/Ba-Ba sequences) come from the
// GameMaker Last Row Sim: https://gx.games/games/6f00u8/last-row-sim/

export const REGION_WIDTH = 23;
export const REGION_HEIGHT = 18;

// The 9 standable tiles of the last row run west -> east along ROW_Y.
export const ROW_LENGTH = 9;
export const ROW_X = 7;
export const ROW_Y = 13;

// The Warden stands right behind the row. Location is the south-west tile of the unit.
export const WARDEN_SIZE = 5;
export const WARDEN_X = ROW_X + 2;
export const WARDEN_Y = ROW_Y - 1;

// Zebak's phantom is west of the row, Ba-Ba's east, level with the row and stretching a little north.
// both phantoms are size 5 in the cache
export const SIDE_BOSS_SIZE = 5;
export const SIDE_BOSS_Y = ROW_Y;
export const ZEBAK_X = 1;
export const BABA_X = REGION_WIDTH - 1 - SIDE_BOSS_SIZE;

export function rowTileX(index: number) {
  return ROW_X + index;
}

export function rowIndexOf(x: number, y: number): number {
  if (y !== ROW_Y || x < ROW_X || x >= ROW_X + ROW_LENGTH) {
    return -1;
  }
  return x - ROW_X;
}
