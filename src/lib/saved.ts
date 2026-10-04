import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "haven.saved.v1";

/** Device-local wishlist. Kept simple: the comps show a Saved tab, not sync. */
export async function loadSavedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function persistSavedIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the wishlist still works for this session.
  }
}
