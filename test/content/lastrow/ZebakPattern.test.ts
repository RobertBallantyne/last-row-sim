import { REPEAT_STYLE_CHANCE, ZebakStyle, rollZebakDamage, rollZebakStyle } from "../../../src/content/lastrow/js/ZebakPattern";

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

describe("rollZebakStyle", () => {
  test("first attack is a coin flip", () => {
    const rng = mulberry32(1);
    let range = 0;
    for (let i = 0; i < RUNS; i++) {
      if (rollZebakStyle(null, rng) === "range") {
        range++;
      }
    }
    expect(range / RUNS).toBeCloseTo(0.5, 1);
  });

  test("repeats the previous style about two thirds of the time", () => {
    const rng = mulberry32(2);
    let previous: ZebakStyle = "magic";
    let repeats = 0;
    for (let i = 0; i < RUNS; i++) {
      const next = rollZebakStyle(previous, rng);
      if (next === previous) {
        repeats++;
      }
      previous = next;
    }
    expect(repeats / RUNS).toBeCloseTo(REPEAT_STYLE_CHANCE, 1);
  });
});

describe("rollZebakDamage", () => {
  test("stays within 16-40 with the observed weighting", () => {
    const rng = mulberry32(3);
    const buckets = { low: 0, mid: 0, exact36: 0, high: 0 };
    for (let i = 0; i < RUNS; i++) {
      const damage = rollZebakDamage(rng);
      expect(damage).toBeGreaterThanOrEqual(16);
      expect(damage).toBeLessThanOrEqual(40);
      if (damage <= 29) buckets.low++;
      else if (damage <= 35) buckets.mid++;
      else if (damage === 36) buckets.exact36++;
      else buckets.high++;
    }
    expect(buckets.low / RUNS).toBeCloseTo(0.4, 1);
    expect(buckets.mid / RUNS).toBeCloseTo(0.3, 1);
    expect(buckets.exact36 / RUNS).toBeCloseTo(0.25, 1);
    expect(buckets.high / RUNS).toBeCloseTo(0.05, 1);
  });
});
