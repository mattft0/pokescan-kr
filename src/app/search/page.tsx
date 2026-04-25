'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { searchCards, getBestPrice, searchSets } from '@/lib/pokemonApi';
import { addCardToCollection, isCardInCollection, getSettings } from '@/lib/storage';
import { PokemonCard, CollectionCard } from '@/lib/types';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sets, setSets] = useState<PokemonCard['set'][]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    searchSets()
      .then((res) => setSets(res.data))
      .catch((err) => console.error('Failed to load sets:', err));
  }, []);

  const performSearch = useCallback(async (searchQuery: string, searchSetId: string) => {
    if (!searchQuery.trim() && !searchSetId) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await searchCards({ query: searchQuery.trim(), setId: searchSetId, pageSize: 100 });
      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2 || selectedSet) {
      debounceRef.current = setTimeout(() => {
        performSearch(query, selectedSet);
      }, 500);
    } else {
      setResults([]);
      setSearched(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedSet, performSearch]);

  const handleAddCard = (card: PokemonCard) => {
    const collectionCard: CollectionCard = {
      id: card.id,
      apiData: card,
      quantity: 1,
      addedAt: new Date().toISOString(),
      notes: '',
    };
    addCardToCollection(collectionCard);
    setToastMsg(`${card.name} ajouté à la collection !`);
    setShowToast(true);
    // Force re-render to update buttons
    setResults((prev) => [...prev]);
  };

  const settings = getSettings();

  return (
    <>
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            <span className="page-title-gradient">Rechercher</span> une carte
          </h1>
          <p className="page-subtitle">Cherchez par nom de Pokémon ou numéro de carte</p>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Ex: Ectoplasma, Pikachu, 025/165..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="search-input"
              autoComplete="off"
              autoCapitalize="off"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => setQuery('')}
                id="search-clear"
              >
                ✕
              </button>
            )}
          </div>
          <div className="search-filters" style={{ marginTop: '12px', position: 'relative' }}>
            <select
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                cursor: 'pointer',
                appearance: 'none',
              }}
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              aria-label="Sélectionner une édition"
            >
              <option value="">Toutes les éditions</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id} style={{ color: 'black' }}>
                  {s.name} {s.ptcgoCode ? `(${s.ptcgoCode})` : ''} - {s.releaseDate?.substring(0, 4)}
                </option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px' }}>▼</span>
          </div>
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="results-section">
            <h3 className="results-title">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </h3>
            {results.map((card) => {
              const inCollection = isCardInCollection(card.id);
              const { usd, eur } = getBestPrice(card);
              let priceStr = '';
              if (usd !== null) {
                priceStr = `~$${(usd * settings.koreanPriceMultiplier).toFixed(2)}`;
              } else if (eur !== null) {
                priceStr = `~€${(eur * settings.koreanPriceMultiplier).toFixed(2)}`;
              }

              return (
                <a
                  key={card.id}
                  href={`/card/${card.id}`}
                  className="result-card"
                  id={`search-result-${card.id}`}
                >
                  <img
                    src={card.images.small}
                    alt={card.name}
                    className="result-card-image"
                    loading="lazy"
                  />
                  <div className="result-card-info">
                    <div className="result-card-name">{card.name}</div>
                    <div className="result-card-set">{card.set.name}</div>
                    <div className="result-card-number">
                      #{card.number}/{card.set.printedTotal} · {card.rarity || 'N/A'}
                    </div>
                    {priceStr && (
                      <div className="result-card-price">{priceStr}</div>
                    )}
                  </div>
                  <div className="result-card-actions">
                    <button
                      className={`btn btn-sm ${inCollection ? 'btn-secondary' : 'btn-success'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!inCollection) handleAddCard(card);
                      }}
                      disabled={inCollection}
                    >
                      {inCollection ? '✓' : '+'}
                    </button>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">😕</span>
            <h3 className="empty-state-title">Aucun résultat</h3>
            <p className="empty-state-text">
              Aucune carte trouvée pour &quot;{query}&quot;. Essayez un autre nom ou numéro.
            </p>
          </div>
        )}

        {!searched && !loading && (
          <div className="empty-state">
            <span className="empty-state-icon">🃏</span>
            <h3 className="empty-state-title">Trouvez vos cartes</h3>
            <p className="empty-state-text">
              Tapez le nom du Pokémon (français ou anglais) ou le numéro imprimé sur la carte (ex: 025/165).
            </p>
          </div>
        )}
      </div>

      <Toast
        message={toastMsg}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
      <Navigation />
    </>
  );
}
