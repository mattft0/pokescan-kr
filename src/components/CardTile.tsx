'use client';

import { PokemonCard } from '@/lib/types';
import { getBestPrice } from '@/lib/pokemonApi';
import { getSettings } from '@/lib/storage';
import Link from 'next/link';

interface CardTileProps {
  card: PokemonCard;
  quantity?: number;
  showQuantity?: boolean;
  onClick?: () => void;
}

export default function CardTile({ card, quantity, showQuantity = false, onClick }: CardTileProps) {
  const { usd, eur } = getBestPrice(card);
  const settings = getSettings();
  const multiplier = settings.koreanPriceMultiplier;

  let displayPrice = '';
  if (usd !== null) {
    const krPrice = (usd * multiplier).toFixed(2);
    displayPrice = `~$${krPrice}`;
  } else if (eur !== null) {
    const krPrice = (eur * multiplier).toFixed(2);
    displayPrice = `~€${krPrice}`;
  }

  const content = (
    <>
      <img
        src={card.images.small}
        alt={card.name}
        className="card-tile-image"
        loading="lazy"
      />
      {showQuantity && quantity && quantity > 1 && (
        <span className="card-tile-qty">×{quantity}</span>
      )}
      <div className="card-tile-overlay">
        <div className="card-tile-name">{card.name}</div>
        <div className="card-tile-meta">
          <span className="card-tile-set">{card.set.name}</span>
          {displayPrice && (
            <span className="card-tile-price">{displayPrice}</span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div className="card-tile" onClick={onClick} id={`card-tile-${card.id}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={`/card/${card.id}`} className="card-tile" id={`card-tile-${card.id}`}>
      {content}
    </Link>
  );
}
