export const SLOT_COUNT = 3;
export const SLOT_KEY_PREFIX = "digital-life-simulator-save-slot-";
export const ACTIVE_SLOT_KEY = "digital-life-simulator-active-slot";
export const ACTIVE_ARCHETYPE_KEY = "digital-life-simulator-active-archetype";

export function getActiveSlotIndex(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (!raw) return null;
    const idx = Number(raw);
    if (!Number.isFinite(idx)) return null;
    if (idx < 0 || idx >= SLOT_COUNT) return null;
    return idx;
  } catch {
    return null;
  }
}

export function getSlotStorageKey(slotIndex: number): string {
  return `${SLOT_KEY_PREFIX}${slotIndex}`;
}

export function getActiveSlotStorageKey(): string | null {
  const idx = getActiveSlotIndex();
  if (idx === null) return null;
  return getSlotStorageKey(idx);
}

export function getSlotStorageKeys(): string[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => getSlotStorageKey(i));
}

export function setActiveSlotIndex(slotIndex: number) {
  localStorage.setItem(ACTIVE_SLOT_KEY, String(slotIndex));
}

export function setActiveArchetype(archetypeId: string) {
  localStorage.setItem(ACTIVE_ARCHETYPE_KEY, archetypeId);
}

