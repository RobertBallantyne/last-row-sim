import { babaImpactTick, zebakAttackInterval, zebakTiming } from "../../../src/content/lastrow/js/PhantomTimings";

describe("zebakAttackInterval", () => {
  test("starts at 4 ticks and speeds up a tick every two path levels, capping at path 4", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(zebakAttackInterval)).toEqual([4, 4, 3, 3, 2, 2, 2]);
  });
});

describe("zebakTiming", () => {
  test("path 0-3 breaks on tick 4 and flies 3 ticks (as measured in game at path 0 and 2)", () => {
    [0, 1, 2, 3].forEach((level) => expect(zebakTiming(level)).toEqual({ launchTick: 4, flightTicks: 3 }));
  });

  test("path 4+ breaks a tick sooner and flies 2 ticks", () => {
    [4, 5, 6].forEach((level) => expect(zebakTiming(level)).toEqual({ launchTick: 3, flightTicks: 2 }));
  });
});

describe("babaImpactTick", () => {
  test("changes every two path levels", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(babaImpactTick)).toEqual([6, 6, 4, 4, 2, 2, 2]);
  });

  test("always leaves at least a tick to step off the targeted tile", () => {
    [0, 1, 2, 3, 4, 5, 6].forEach((level) => expect(babaImpactTick(level)).toBeGreaterThanOrEqual(2));
  });
});
