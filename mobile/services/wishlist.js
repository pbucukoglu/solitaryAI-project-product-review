import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wishlist_product_ids_v1';

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v));
    }
    return [];
  } catch {
    return [];
  }
};

export const wishlistService = {
  getIds: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return safeParse(raw);
  },

  setIds: async (ids) => {
    const unique = Array.from(new Set((ids || []).map((v) => Number(v)).filter((v) => Number.isFinite(v))));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    return unique;
  },

  isFavorite: async (productId) => {
    const ids = await wishlistService.getIds();
    return ids.includes(Number(productId));
  },

  toggle: async (productId) => {
    const id = Number(productId);
    const ids = await wishlistService.getIds();
    const set = new Set(ids);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    const next = Array.from(set);
    await wishlistService.setIds(next);
    return next;
  },
};
