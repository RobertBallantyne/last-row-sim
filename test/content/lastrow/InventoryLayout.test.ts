import { arrangeByLayout, layoutOf } from "../../../src/content/lastrow/js/InventoryLayout";

const item = (itemName: string) => ({ itemName });

describe("arrangeByLayout", () => {
  test("keeps the preset order when there's no saved layout", () => {
    const items = [item("A"), item("B")];
    expect(arrangeByLayout(items, null, 4)).toEqual([items[0], items[1], null, null]);
  });

  test("places items in their saved slots, including duplicates and gaps", () => {
    const items = [item("Keris"), item("Brew"), item("Brew"), item("Restore")];
    const arranged = arrangeByLayout(items, [null, "Brew", "Restore", "Brew", "Keris"], 6);
    expect(layoutOf(arranged)).toEqual([null, "Brew", "Restore", "Brew", "Keris", null]);
  });

  test("puts items the layout doesn't mention into the first empty slots", () => {
    const items = [item("Keris"), item("Salts"), item("Restore")];
    const arranged = arrangeByLayout(items, [null, null, "Restore", "Ambrosia"], 4);
    expect(layoutOf(arranged)).toEqual(["Keris", "Salts", "Restore", null]);
  });

  test("never loses or duplicates items", () => {
    const items = [item("A"), item("A"), item("B")];
    const arranged = arrangeByLayout(items, ["A", "A", "A", "B", "B"], 5);
    expect(arranged.filter(Boolean)).toHaveLength(3);
    expect(new Set(arranged.filter(Boolean)).size).toBe(3);
  });
});
