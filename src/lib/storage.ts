import { CollectionCard, AppSettings } from './types';

const COLLECTION_KEY = 'pokescan_collection';
const SETTINGS_KEY = 'pokescan_settings';

const DEFAULT_SETTINGS: AppSettings = {
  koreanPriceMultiplier: 0.5,
  currency: 'USD',
};

// Collection operations
export function getCollection(): CollectionCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(COLLECTION_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCollection(collection: CollectionCard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
}

export function addCardToCollection(card: CollectionCard): CollectionCard[] {
  const collection = getCollection();
  const existing = collection.find((c) => c.id === card.id);
  if (existing) {
    existing.quantity += card.quantity;
  } else {
    collection.push(card);
  }
  saveCollection(collection);
  return collection;
}

export function removeCardFromCollection(cardId: string): CollectionCard[] {
  const collection = getCollection().filter((c) => c.id !== cardId);
  saveCollection(collection);
  return collection;
}

export function updateCardInCollection(
  cardId: string,
  updates: Partial<CollectionCard>
): CollectionCard[] {
  const collection = getCollection();
  const index = collection.findIndex((c) => c.id === cardId);
  if (index !== -1) {
    collection[index] = { ...collection[index], ...updates };
    saveCollection(collection);
  }
  return collection;
}

export function isCardInCollection(cardId: string): boolean {
  return getCollection().some((c) => c.id === cardId);
}

export function getCollectionStats() {
  const collection = getCollection();
  const totalCards = collection.reduce((sum, c) => sum + c.quantity, 0);
  const uniqueCards = collection.length;
  const sets = new Set(collection.map((c) => c.apiData.set.name));

  let totalValueUSD = 0;
  let totalValueEUR = 0;

  collection.forEach((c) => {
    const qty = c.quantity;
    if (c.customPrice) {
      totalValueUSD += c.customPrice * qty;
    } else {
      const tcg = c.apiData.tcgplayer?.prices;
      if (tcg) {
        const price =
          tcg.holofoil?.market ||
          tcg.normal?.market ||
          tcg.reverseHolofoil?.market ||
          0;
        totalValueUSD += price * qty;
      }
      const cm = c.apiData.cardmarket?.prices;
      if (cm) {
        totalValueEUR += (cm.trendPrice || cm.averageSellPrice || 0) * qty;
      }
    }
  });

  return {
    totalCards,
    uniqueCards,
    totalSets: sets.size,
    totalValueUSD,
    totalValueEUR,
  };
}

// Settings operations
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
