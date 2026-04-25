export interface PokemonCardSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface PokemonCardPrice {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number;
}

export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  set: PokemonCardSet;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: {
      normal?: PokemonCardPrice;
      holofoil?: PokemonCardPrice;
      reverseHolofoil?: PokemonCardPrice;
      '1stEditionHolofoil'?: PokemonCardPrice;
      '1stEditionNormal'?: PokemonCardPrice;
    };
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice?: number;
      trendPrice?: number;
      lowPrice?: number;
      suggestedPrice?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
    };
  };
}

export interface CollectionCard {
  id: string;
  apiData: PokemonCard;
  quantity: number;
  addedAt: string;
  notes: string;
  customPrice?: number;
}

export interface AppSettings {
  koreanPriceMultiplier: number;
  currency: 'USD' | 'EUR';
}

export interface SearchFilters {
  query: string;
  set?: string;
  rarity?: string;
  type?: string;
  sortBy: 'name' | 'price' | 'date' | 'number';
  sortOrder: 'asc' | 'desc';
}
