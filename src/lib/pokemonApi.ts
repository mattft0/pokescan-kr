import { PokemonCard } from './types';
import pokemonNamesMapData from './pokemonNames.json';
import { getEnglishSetIdFromAsianCode } from './asianSetsMap';

const pokemonNamesMap = pokemonNamesMapData as Record<string, string>;

const API_BASE = 'https://api.pokemontcg.io/v2';

interface SearchParams {
  query?: string;
  name?: string;
  number?: string;
  setId?: string;
  page?: number;
  pageSize?: number;
}

interface ApiResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

function translateName(name: string): string {
  let lower = name.toLowerCase().trim();
  // Exact match
  if (pokemonNamesMap[lower]) {
    return pokemonNamesMap[lower];
  }

  // Partial match: if the search term contains a French name (e.g. "mega dracaufeu ex")
  // Replace the French name with the English equivalent.
  for (const [fr, en] of Object.entries(pokemonNamesMap)) {
    if (fr.length >= 3 && lower.includes(fr)) {
      lower = lower.replace(fr, en.toLowerCase());
      break;
    }
  }

  // Handle Mega evolutions (Pokemon TCG uses 'M ' instead of 'Mega ')
  lower = lower.replace(/\bm[ée]ga\s+/gi, 'm ');

  return lower;
}

function buildSearchQuery(params: SearchParams): string {
  const parts: string[] = [];

  if (params.name) {
    const enName = translateName(params.name);
    const nameParts = enName.split(/\s+/).filter(Boolean);
    nameParts.forEach(p => {
      parts.push(`name:*${p}*`);
    });
  }
  if (params.number) {
    parts.push(`number:${params.number}`);
  }
  if (params.setId) {
    parts.push(`set.id:${params.setId}`);
  }
  if (params.query) {
    let rawQuery = params.query.trim();
    
    // Check if there is an Asian set code in the query
    const words = rawQuery.split(/\s+/);
    let asianSetId: string | null = null;
    const remainingWords: string[] = [];
    
    for (const word of words) {
      const mappedId = getEnglishSetIdFromAsianCode(word);
      if (mappedId && !asianSetId) { // Take the first matched set code
        asianSetId = mappedId;
      } else {
        remainingWords.push(word);
      }
    }
    
    if (asianSetId && !params.setId) {
      parts.push(`set.id:${asianSetId}`);
    }
    
    rawQuery = remainingWords.join(' ');

    // If query looks like a card number pattern (digits/digits)
    const numberMatch = rawQuery.match(/^(\d{1,4})\s*\/\s*(\d{1,4})$/);
    if (numberMatch) {
      const num = numberMatch[1].replace(/^0+/, '') || '0';
      // We only search by number. We do NOT use printedTotal because Korean/Japanese set totals 
      // do not match English TCG set totals, and OCR can make mistakes reading the total.
      parts.push(`number:${num}`);
    } else if (rawQuery) {
      const enName = translateName(rawQuery);
      const nameParts = enName.split(/\s+/).filter(Boolean);
      nameParts.forEach(p => {
        parts.push(`name:*${p}*`);
      });
    }
  }

  return parts.join(' ');
}

export async function searchCards(params: SearchParams): Promise<ApiResponse> {
  const q = buildSearchQuery(params);
  const urlParams = new URLSearchParams();

  if (q) urlParams.set('q', q);
  urlParams.set('page', String(params.page || 1));
  urlParams.set('pageSize', String(params.pageSize || 20));
  urlParams.set('orderBy', '-set.releaseDate');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use API key from env if available
  const apiKey = process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const res = await fetch(`${API_BASE}/cards?${urlParams.toString()}`, {
    headers,
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getCardById(id: string): Promise<PokemonCard> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const res = await fetch(`${API_BASE}/cards/${id}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.data;
}

export async function searchSets(): Promise<{ data: PokemonCard['set'][] }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const res = await fetch(`${API_BASE}/sets?orderBy=-releaseDate&pageSize=250`, {
    headers,
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function getBestPrice(card: PokemonCard): {
  usd: number | null;
  eur: number | null;
  source: string;
} {
  let usd: number | null = null;
  let eur: number | null = null;
  let source = '';

  if (card.tcgplayer?.prices) {
    const p = card.tcgplayer.prices;
    usd =
      p.holofoil?.market ||
      p.normal?.market ||
      p.reverseHolofoil?.market ||
      p.holofoil?.mid ||
      p.normal?.mid ||
      null;
    source = 'TCGPlayer';
  }

  if (card.cardmarket?.prices) {
    eur =
      card.cardmarket.prices.trendPrice ||
      card.cardmarket.prices.averageSellPrice ||
      null;
    if (!source) source = 'Cardmarket';
  }

  return { usd, eur, source };
}
