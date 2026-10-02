import {
  damageMultiplier,
  pathLevelMultiplier,
  raidLevelDamageMultiplier,
  raidLevelMultiplier,
  scaleDamage,
  wardenDefence,
  wardenMaxHitpoints,
} from "../../../src/content/lastrow/js/LastRowScaling";

describe("raid level scaling", () => {
  test("adds 2% per 5 raid levels", () => {
    expect(raidLevelMultiplier(0)).toBe(1);
    expect(raidLevelMultiplier(100)).toBeCloseTo(1.4);
    expect(raidLevelMultiplier(500)).toBeCloseTo(3);
  });

  test("caps damage at +150%", () => {
    expect(raidLevelDamageMultiplier(300)).toBeCloseTo(2.2);
    expect(raidLevelDamageMultiplier(375)).toBeCloseTo(2.5);
    expect(raidLevelDamageMultiplier(500)).toBeCloseTo(2.5);
  });

  test("scales the warden's hitpoints and defence", () => {
    expect(wardenMaxHitpoints(0)).toBe(880);
    expect(wardenMaxHitpoints(300)).toBe(1936);
    expect(wardenMaxHitpoints(500)).toBe(2640);
    expect(wardenDefence(0)).toBe(180);
    expect(wardenDefence(500)).toBe(540);
  });
});

describe("path level scaling", () => {
  test("adds 8% for the first level then 5% per level", () => {
    expect(pathLevelMultiplier(0)).toBe(1);
    expect(pathLevelMultiplier(1)).toBeCloseTo(1.08);
    expect(pathLevelMultiplier(2)).toBeCloseTo(1.13);
    expect(pathLevelMultiplier(6)).toBeCloseTo(1.33);
    expect(pathLevelMultiplier(9)).toBeCloseTo(1.33);
  });
});

describe("damage relative to the sim's reference", () => {
  test("is unchanged at capped raid levels and path 0", () => {
    expect(damageMultiplier(400)).toBeCloseTo(1);
    expect(damageMultiplier(550)).toBeCloseTo(1);
    expect(scaleDamage(36, damageMultiplier(500))).toBe(36);
  });

  test("shrinks at low raid levels and grows with path level", () => {
    expect(damageMultiplier(0)).toBeCloseTo(0.4);
    expect(scaleDamage(36, damageMultiplier(0))).toBe(14);
    expect(damageMultiplier(500, 6)).toBeCloseTo(1.33);
  });
});
