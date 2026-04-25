import { PokemonCard } from './types';
import pokemonNamesMapData from './pokemonNames.json';

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
  const lower = name.toLowerCase().trim();
  // Exact match
  if (pokemonNamesMap[lower]) {
    return pokemonNamesMap[lower];
  }
  
  // Partial match: if the search term partially matches a French name, use the English equivalent
  if (lower.length >= 3) {
    for (const [fr, en] of Object.entries(pokemonNamesMap)) {
      if (fr.includes(lower)) {
        return en;
      }
    }
  }
  return name;
}

function buildSearchQuery(params: SearchParams): string {
  const parts: string[] = [];

  if (params.name) {
    const enName = translateName(params.name);
    parts.push(`name:"${enName}*"`);
  }
  if (params.number) {
    parts.push(`number:${params.number}`);
  }
  if (params.setId) {
    parts.push(`set.id:${params.setId}`);
  }
  if (params.query) {
    // If query looks like a card number pattern (digits/digits)
    const numberMatch = params.query.match(/^(\d{1,4})\s*\/\s*(\d{1,4})$/);
    if (numberMatch) {
      const num = numberMatch[1].replace(/^0+/, '') || '0';
      // We only search by number. We do NOT use printedTotal because Korean/Japanese set totals 
      // do not match English TCG set totals, and OCR can make mistakes reading the total.
      parts.push(`number:${num}`);
    } else {
      const enName = translateName(params.query);
      parts.push(`name:"${enName}*"`);
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
