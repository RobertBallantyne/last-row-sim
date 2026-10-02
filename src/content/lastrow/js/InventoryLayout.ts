"use strict";

// Saved inventory layouts: one item name (or null for an empty slot) per inventory slot.
// No engine imports so it can be unit tested in isolation.

export type InventoryLayout = (string | null)[];

interface Named {
  itemName: string;
}

// Places `items` into `size` slots following `layout`. Each layout slot takes the first remaining item with that
// name; items the layout doesn't account for (e.g. after the preset changed) fill the remaining empty slots in order.
export function arrangeByLayout<T extends Named>(items: T[], layout: InventoryLayout | null, size: number): (T | null)[] {
  const slots: (T | null)[] = Array(size).fill(null);
  const remaining = [...items];

  (layout ?? []).slice(0, size).forEach((name, slot) => {
    if (name === null) {
      return;
    }
    const index = remaining.findIndex((item) => item.itemName === name);
    if (index !== -1) {
      slots[slot] = remaining.splice(index, 1)[0];
    }
  });

  remaining.forEach((item) => {
    const empty = slots.indexOf(null);
    if (empty !== -1) {
      slots[empty] = item;
    }
  });
  return slots;
}

export function layoutOf(inventory: (Named | null)[]): InventoryLayout {
  return inventory.map((item) => (item ? item.itemName : null));
}
