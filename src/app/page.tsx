'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCollection, getCollectionStats, getSettings } from '@/lib/storage';
import { CollectionCard } from '@/lib/types';
import CardTile from '@/components/CardTile';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function HomePage() {
  const [collection, setCollection] = useState<CollectionCard[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollection(getCollection());
  }, []);

  // Refresh collection when page becomes visible (coming back from other pages)
  useEffect(() => {
    const handleFocus = () => {
      setCollection(getCollection());
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) handleFocus();
    });
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const stats = useMemo(() => {
    if (!mounted) return { totalCards: 0, uniqueCards: 0, totalSets: 0, totalValueUSD: 0, totalValueEUR: 0 };
    return getCollectionStats();
  }, [collection, mounted]);

  const settings = getSettings();

  const sortedCollection = useMemo(() => {
    const sorted = [...collection];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.apiData.name.localeCompare(b.apiData.name));
        break;
      case 'price': {
        const getPrice = (c: CollectionCard) => {
          if (c.customPrice) return c.customPrice;
          const tcg = c.apiData.tcgplayer?.prices;
          if (tcg) {
            return (
              tcg.holofoil?.market ||
              tcg.normal?.market ||
              tcg.reverseHolofoil?.market ||
              0
            );
          }
          return 0;
        };
        sorted.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      }
      case 'date':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
        break;
    }
    return sorted;
  }, [collection, sortBy]);

  const totalEstimatedValue =
    stats.totalValueUSD > 0
      ? `$${(stats.totalValueUSD * settings.koreanPriceMultiplier).toFixed(2)}`
      : stats.totalValueEUR > 0
        ? `€${(stats.totalValueEUR * settings.koreanPriceMultiplier).toFixed(2)}`
        : '$0.00';

  if (!mounted) {
    return (
      <>
        <div className="page-content">
          <div className="loading-spinner" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            Ma <span className="page-title-gradient">Collection</span>
          </h1>
          <p className="page-subtitle">Cartes Pokémon coréennes 🇰🇷</p>
        </div>

        {/* Stats */}
        {collection.length > 0 && (
          <>
            <div className="stats-bar">
              <div className="stat-card">
                <div className="stat-value">{stats.totalCards}</div>
                <div className="stat-label">Cartes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.uniqueCards}</div>
                <div className="stat-label">Uniques</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalSets}</div>
                <div className="stat-label">Sets</div>
              </div>
            </div>

            {/* Value banner */}
            <div className="value-banner">
              <div className="value-banner-label">Valeur estimée (KR) 🇰🇷</div>
              <div className="value-banner-amount">{totalEstimatedValue}</div>
              <div className="value-banner-sub">
                ~{Math.round(settings.koreanPriceMultiplier * 100)}% du marché anglais
              </div>
            </div>

            {/* Sort options */}
            <div className="filter-tabs">
              <button
                className={`filter-tab ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => setSortBy('date')}
              >
                📅 Récent
              </button>
              <button
                className={`filter-tab ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => setSortBy('name')}
              >
                🔤 Nom
              </button>
              <button
                className={`filter-tab ${sortBy === 'price' ? 'active' : ''}`}
                onClick={() => setSortBy('price')}
              >
                💰 Prix
              </button>
            </div>

            {/* Card Grid */}
            <div className="card-grid">
              {sortedCollection.map((item) => (
                <CardTile
                  key={item.id}
                  card={item.apiData}
                  quantity={item.quantity}
                  showQuantity={true}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {collection.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🎴</span>
            <h3 className="empty-state-title">Votre collection est vide</h3>
            <p className="empty-state-text">
              Scannez vos cartes Pokémon coréennes ou cherchez-les manuellement pour commencer votre collection.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/scan" className="btn btn-primary">
                📸 Scanner une carte
              </Link>
              <Link href="/search" className="btn btn-secondary">
                🔍 Rechercher
              </Link>
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </>
  );
}
