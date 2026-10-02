"use strict";

// Pure lightning RNG for the last row, ported from the GameMaker Last Row Sim (obj_boss Create/Alarm_1).
// No engine imports so it can be unit tested in isolation.
//
// A cycle assigns each of the 9 row tiles a delay:
//   0, 1, 2 = struck in the 1st/2nd/3rd set of the cycle
//   SAFE (-1) = not struck this cycle
//
// Observed in game (see the sim's notes):
//   - size of the first set: 5 ~40%, 6 ~37.4%, 7 ~17.3%, 8 ~5.3%
//   - the nearest tile not hit by the first set is 0/1/2/3 tiles from the player ~16/48/24/12% of the time
//   - when the player's own tile is spared, another spared tile is guaranteed within 3

export const ROW_TILES = 9;
export const SAFE = -1;

export type Rng = () => number;

export function rollFirstSetSize(rng: Rng): number {
  const roll = rng();
  if (roll >= 0.947) {
    return 8;
  } else if (roll >= 0.774) {
    return 7;
  } else if (roll >= 0.4) {
    return 6;
  }
  return 5;
}

// GameMaker's random_range(a, b)
function randomRange(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Pick the tile `distance` away from the player, randomly left or right unless the row edge forces a side.
function tileAtDistance(playerTile: number, distance: number, rng: Rng): number {
  if (distance === 0) {
    return playerTile;
  }
  const left = playerTile - distance;
  const right = playerTile + distance;
  if (left < 0) {
    return right;
  }
  if (right >= ROW_TILES) {
    return left;
  }
  return rng() <= 0.5 ? left : right;
}

// Returns the 1-2 tile indexes that must be spared by the first set.
export function rollSparedTiles(playerTile: number, firstSetSize: number, rng: Rng): number[] {
  // with 8 strikes in the first set only one tile can be spared, so it can't be the player's own tile
  // (otherwise the second guaranteed tile would be impossible)
  const cantBeZero = firstSetSize === ROW_TILES - 1;
  const roll = cantBeZero ? randomRange(rng, 0.17, 1) : rng();

  if (roll <= 0.16) {
    const secondRoll = rng();
    const secondDistance = secondRoll <= 0.4 ? 1 : secondRoll <= 0.8 ? 2 : 3;
    return [playerTile, tileAtDistance(playerTile, secondDistance, rng)].sort((a, b) => a - b);
  }
  const distance = roll <= 0.64 ? 1 : roll <= 0.88 ? 2 : 3;
  return [tileAtDistance(playerTile, distance, rng)];
}

export function rollLightningCycle(playerTile: number, rng: Rng): number[] {
  const firstSetSize = rollFirstSetSize(rng);

  const secondSetSize = Math.round(randomRange(rng, 0, ROW_TILES - firstSetSize));
  const thirdSetSize = Math.round(randomRange(rng, 0, ROW_TILES - firstSetSize - secondSetSize));
  const safeCount = ROW_TILES - firstSetSize - secondSetSize - thirdSetSize;

  const notFirstSet: number[] = [
    ...Array(secondSetSize).fill(1),
    ...Array(thirdSetSize).fill(2),
    ...Array(safeCount).fill(SAFE),
  ];

  const sparedTiles = rollSparedTiles(playerTile, firstSetSize, rng);

  // reserve a not-first-set delay for each spared tile, then scatter everything else
  const shuffledLater = shuffle(notFirstSet, rng);
  const sparedDelays = shuffledLater.splice(0, sparedTiles.length);
  const remaining = shuffle([...Array(firstSetSize).fill(0), ...shuffledLater], rng);

  const delays: number[] = [];
  let next = 0;
  for (let tile = 0; tile < ROW_TILES; tile++) {
    const sparedIndex = sparedTiles.indexOf(tile);
    delays.push(sparedIndex !== -1 ? sparedDelays[sparedIndex] : remaining[next++]);
  }
  return delays;
}
