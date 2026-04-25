'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCardById, getBestPrice } from '@/lib/pokemonApi';
import {
  getCollection,
  addCardToCollection,
  removeCardFromCollection,
  updateCardInCollection,
  isCardInCollection,
  getSettings,
} from '@/lib/storage';
import { PokemonCard, CollectionCard } from '@/lib/types';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const loadCard = useCallback(async () => {
    setLoading(true);
    try {
      // Check collection first
      const collection = getCollection();
      const collectionItem = collection.find((c) => c.id === cardId);

      if (collectionItem) {
        setCard(collectionItem.apiData);
        setInCollection(true);
        setQuantity(collectionItem.quantity);
        setNotes(collectionItem.notes || '');
      } else {
        const apiCard = await getCardById(cardId);
        setCard(apiCard);
        setInCollection(false);
      }
    } catch (err) {
      console.error('Failed to load card:', err);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  const handleAdd = () => {
    if (!card) return;
    const collectionCard: CollectionCard = {
      id: card.id,
      apiData: card,
      quantity: 1,
      addedAt: new Date().toISOString(),
      notes: '',
    };
    addCardToCollection(collectionCard);
    setInCollection(true);
    setQuantity(1);
    setToastMsg(`${card.name} ajouté à la collection !`);
    setShowToast(true);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    updateCardInCollection(cardId, { quantity: newQty });
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    updateCardInCollection(cardId, { notes: newNotes });
  };

  const handleDelete = () => {
    removeCardFromCollection(cardId);
    setShowDeleteModal(false);
    setToastMsg('Carte retirée de la collection');
    setShowToast(true);
    setInCollection(false);
    setQuantity(1);
    setNotes('');
  };

  const settings = getSettings();

  if (loading) {
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

  if (!card) {
    return (
      <>
        <div className="page-content">
          <div className="empty-state">
            <span className="empty-state-icon">❌</span>
            <h3 className="empty-state-title">Carte introuvable</h3>
            <p className="empty-state-text">Cette carte n&apos;a pas été trouvée.</p>
            <button className="btn btn-primary" onClick={() => router.back()}>
              ← Retour
            </button>
          </div>
        </div>
        <Navigation />
      </>
    );
  }

  const { usd, eur } = getBestPrice(card);
  const krMultiplier = settings.koreanPriceMultiplier;

  return (
    <>
      <div className="page-content card-detail">
        <button className="back-btn" onClick={() => router.back()} id="back-button">
          ← Retour
        </button>

        {/* Card Image */}
        <div className="card-detail-hero">
          <div className="card-detail-image-wrapper">
            <img
              src={card.images.large}
              alt={card.name}
              className="card-detail-image"
              id="card-detail-image"
            />
          </div>
        </div>

        {/* Card Info */}
        <div className="card-detail-info">
          <h1 className="card-detail-name">{card.name}</h1>
          <div className="card-detail-set-info">
            {card.set.images?.symbol && (
              <img
                src={card.set.images.symbol}
                alt={card.set.name}
                className="card-detail-set-icon"
              />
            )}
            <span>{card.set.name} · #{card.number}/{card.set.printedTotal}</span>
          </div>
          <div className="card-detail-badges">
            {card.types?.map((type) => (
              <span key={type} className="badge badge-type">{type}</span>
            ))}
            {card.rarity && (
              <span className="badge badge-rarity">{card.rarity}</span>
            )}
            {card.hp && <span className="badge">HP {card.hp}</span>}
            {card.supertype && <span className="badge">{card.supertype}</span>}
          </div>
        </div>

        {/* Prices */}
        <div className="price-section">
          <h2 className="price-section-title">💰 Prix estimés</h2>
          <div className="price-grid">
            {usd !== null && (
              <>
                <div className="price-item">
                  <div className="price-item-label">TCGPlayer (US)</div>
                  <div className="price-item-value">${usd.toFixed(2)}</div>
                </div>
                <div className="price-item">
                  <div className="price-item-label">Estimé KR 🇰🇷</div>
                  <div className="price-item-value korean">
                    ~${(usd * krMultiplier).toFixed(2)}
                  </div>
                </div>
              </>
            )}
            {eur !== null && (
              <>
                <div className="price-item">
                  <div className="price-item-label">Cardmarket (EU)</div>
                  <div className="price-item-value">€{eur.toFixed(2)}</div>
                </div>
                <div className="price-item">
                  <div className="price-item-label">Estimé KR 🇰🇷</div>
                  <div className="price-item-value korean">
                    ~€{(eur * krMultiplier).toFixed(2)}
                  </div>
                </div>
              </>
            )}
            {usd === null && eur === null && (
              <div className="price-item" style={{ gridColumn: '1 / -1' }}>
                <div className="price-item-label">Prix</div>
                <div className="price-item-value" style={{ color: 'var(--text-muted)' }}>
                  Indisponible
                </div>
              </div>
            )}
          </div>
          <p className="price-note">
            Les prix coréens sont estimés à ~{Math.round(krMultiplier * 100)}% des prix anglais
          </p>

          {/* Link to price sources */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
            {card.tcgplayer?.url && (
              <a
                href={card.tcgplayer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-secondary"
              >
                TCGPlayer ↗
              </a>
            )}
            {card.cardmarket?.url && (
              <a
                href={card.cardmarket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-secondary"
              >
                Cardmarket ↗
              </a>
            )}
          </div>
        </div>

        {/* Collection Actions */}
        <div className="collection-actions">
          <h2 className="collection-actions-title">📦 Collection</h2>

          {!inCollection ? (
            <button className="btn btn-success" onClick={handleAdd} style={{ width: '100%' }}>
              + Ajouter à ma collection
            </button>
          ) : (
            <>
              <div className="quantity-controls">
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  exemplaire{quantity > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Notes
                </label>
                <textarea
                  className="notes-textarea"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="État, provenance, notes perso..."
                />
              </div>

              <div className="action-row" style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑 Retirer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Retirer de la collection ?</h3>
            <p className="modal-text">
              {card.name} sera retiré de votre collection. Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toastMsg}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
      <Navigation />
    </>
  );
}
