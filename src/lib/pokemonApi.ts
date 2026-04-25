import { PokemonCard } from './types';

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

function buildSearchQuery(params: SearchParams): string {
  const parts: string[] = [];

  if (params.name) {
    parts.push(`name:"${params.name}*"`);
  }
  if (params.number) {
    parts.push(`number:${params.number}`);
  }
  if (params.setId) {
    parts.push(`set.id:${params.setId}`);
  }
  if (params.query) {
    // If query looks like a card number pattern (digits/digits)
    const numberMatch = params.query.match(/^(\d{1,4})\s*\/\s*\d{1,4}$/);
    if (numberMatch) {
      parts.push(`number:${numberMatch[1]}`);
    } else {
      parts.push(`name:"${params.query}*"`);
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
