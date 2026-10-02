import { ROW_TILES, SAFE, rollFirstSetSize, rollLightningCycle } from "../../../src/content/lastrow/js/LightningPattern";

// deterministic RNG so failures are reproducible
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RUNS = 20000;

describe("rollFirstSetSize", () => {
  test("matches observed first-set frequencies", () => {
    const rng = mulberry32(1);
    const counts = { 5: 0, 6: 0, 7: 0, 8: 0 };
    for (let i = 0; i < RUNS; i++) {
      counts[rollFirstSetSize(rng)]++;
    }
    expect(counts[5] / RUNS).toBeCloseTo(0.4, 1);
    expect(counts[6] / RUNS).toBeCloseTo(0.374, 1);
    expect(counts[7] / RUNS).toBeCloseTo(0.173, 1);
    expect(counts[8] / RUNS).toBeCloseTo(0.053, 1);
  });
});

describe("rollLightningCycle", () => {
  test("assigns every tile a valid delay with 5-8 first-set strikes", () => {
    const rng = mulberry32(2);
    for (let i = 0; i < RUNS; i++) {
      const delays = rollLightningCycle(i % ROW_TILES, rng);
      expect(delays).toHaveLength(ROW_TILES);
      delays.forEach((d) => expect([SAFE, 0, 1, 2]).toContain(d));
      const firstSet = delays.filter((d) => d === 0).length;
      expect(firstSet).toBeGreaterThanOrEqual(5);
      expect(firstSet).toBeLessThanOrEqual(8);
    }
  });

  test("always spares a tile within 3 of the player from the first set", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < RUNS; i++) {
      const player = i % ROW_TILES;
      const delays = rollLightningCycle(player, rng);
      const nearest = Math.min(
        ...delays.map((d, tile) => (d === 0 ? Infinity : Math.abs(tile - player))),
      );
      expect(nearest).toBeLessThanOrEqual(3);
    }
  });

  test("when the player's own tile is spared, another spared tile is within 3", () => {
    const rng = mulberry32(4);
    let checked = 0;
    for (let i = 0; i < RUNS; i++) {
      const player = i % ROW_TILES;
      const delays = rollLightningCycle(player, rng);
      if (delays[player] === 0) {
        continue;
      }
      checked++;
      const other = delays.some((d, tile) => tile !== player && d !== 0 && Math.abs(tile - player) <= 3);
      expect(other).toBe(true);
    }
    expect(checked).toBeGreaterThan(0);
  });
});
