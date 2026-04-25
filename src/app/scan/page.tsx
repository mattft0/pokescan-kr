'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { recognizeCardNumber, captureFrame } from '@/lib/ocr';
import { searchCards, getBestPrice } from '@/lib/pokemonApi';
import { addCardToCollection, isCardInCollection, getSettings } from '@/lib/storage';
import { PokemonCard, CollectionCard } from '@/lib/types';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';

type ScanState = 'camera' | 'processing' | 'results' | 'error';

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanState, setScanState] = useState<ScanState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [detectedNumber, setDetectedNumber] = useState<string | null>(null);
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        'Impossible d\'accéder à la caméra. Vérifiez les autorisations dans les paramètres de votre navigateur.'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (scanState === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanState, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    const imageData = captureFrame(videoRef.current);
    setCapturedImage(imageData);
    stopCamera();
    setScanState('processing');
    setOcrProgress(0);
    setOcrText('Analyse en cours...');

    try {
      const ocrResult = await recognizeCardNumber(imageData, (progress) => {
        setOcrProgress(progress);
      });

      setOcrText(
        ocrResult.cardNumber
          ? `Numéro détecté : ${ocrResult.cardNumber}`
          : 'Aucun numéro détecté — recherche manuelle'
      );
      setDetectedNumber(ocrResult.cardNumber);

      // Search API with detected number
      if (ocrResult.cardNumber) {
        setLoading(true);
        const numberOnly = ocrResult.cardNumber.split('/')[0].replace(/^0+/, '');
        const response = await searchCards({ number: numberOnly, pageSize: 12 });
        setResults(response.data);
        setLoading(false);
      }

      setScanState('results');
    } catch {
      setOcrText('Erreur lors de l\'analyse');
      setScanState('results');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResults([]);
    setDetectedNumber(null);
    setOcrText('');
    setScanState('camera');
  };

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
  };

  const settings = getSettings();

  return (
    <>
      <div className="page-content scanner-page">
        <div className="page-header" style={{ width: '100%', textAlign: 'center' }}>
          <h1 className="page-title">
            <span className="page-title-gradient">Scanner</span> une carte
          </h1>
          <p className="page-subtitle">Placez la carte dans le cadre et capturez</p>
        </div>

        {/* Camera View */}
        {scanState === 'camera' && (
          <>
            {cameraError ? (
              <div className="camera-container">
                <div className="camera-error">
                  <span className="camera-error-icon">📷</span>
                  <h3 className="camera-error-title">Caméra indisponible</h3>
                  <p className="camera-error-text">{cameraError}</p>
                  <button className="btn btn-primary" onClick={startCamera}>
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  id="camera-feed"
                />
                <div className="camera-overlay">
                  <div className="camera-guide">
                    <span className="camera-guide-corner tl"></span>
                    <span className="camera-guide-corner tr"></span>
                    <span className="camera-guide-corner bl"></span>
                    <span className="camera-guide-corner br"></span>
                  </div>
                  <div className="camera-hint">
                    📸 Cadrez votre carte Pokémon
                  </div>
                </div>
              </div>
            )}
            <button
              className="capture-btn"
              onClick={handleCapture}
              disabled={!cameraReady}
              id="capture-button"
              aria-label="Capturer la carte"
            />
          </>
        )}

        {/* Processing */}
        {scanState === 'processing' && (
          <>
            {capturedImage && (
              <div className="captured-preview">
                <img src={capturedImage} alt="Carte capturée" className="captured-image" />
              </div>
            )}
            <div className="ocr-progress">
              <p className="ocr-status">{ocrText}</p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.round(ocrProgress * 100)}%` }}
                />
              </div>
              <p className="ocr-status" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {Math.round(ocrProgress * 100)}%
              </p>
            </div>
          </>
        )}

        {/* Results */}
        {scanState === 'results' && (
          <>
            {capturedImage && (
              <div className="captured-preview">
                <img src={capturedImage} alt="Carte capturée" className="captured-image" />
              </div>
            )}

            <p className="ocr-status" style={{ textAlign: 'center', margin: '12px 0' }}>
              {ocrText}
            </p>

            <div className="captured-actions">
              <button className="btn btn-secondary" onClick={handleRetake}>
                🔄 Reprendre
              </button>
            </div>

            {loading && (
              <div className="loading-spinner">
                <div className="spinner" />
              </div>
            )}

            {results.length > 0 && (
              <div className="results-section">
                <h3 className="results-title">
                  {results.length} carte{results.length > 1 ? 's' : ''} trouvée{results.length > 1 ? 's' : ''}
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
                    <div key={card.id} className="result-card" id={`result-${card.id}`}>
                      <img
                        src={card.images.small}
                        alt={card.name}
                        className="result-card-image"
                        loading="lazy"
                      />
                      <div className="result-card-info">
                        <div className="result-card-name">{card.name}</div>
                        <div className="result-card-set">{card.set.name}</div>
                        <div className="result-card-number">#{card.number}/{card.set.printedTotal}</div>
                        {priceStr && (
                          <div className="result-card-price">{priceStr}</div>
                        )}
                      </div>
                      <div className="result-card-actions">
                        <button
                          className={`btn btn-sm ${inCollection ? 'btn-secondary' : 'btn-success'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCard(card);
                          }}
                          disabled={inCollection}
                        >
                          {inCollection ? '✓ Ajouté' : '+ Ajouter'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <span className="empty-state-icon">🔍</span>
                <h3 className="empty-state-title">Aucun résultat</h3>
                <p className="empty-state-text">
                  {detectedNumber
                    ? `Aucune carte trouvée pour le numéro ${detectedNumber}. Essayez la recherche manuelle.`
                    : 'Le numéro n\'a pas pu être lu. Essayez la recherche manuelle.'}
                </p>
                <a href="/search" className="btn btn-primary">
                  🔎 Recherche manuelle
                </a>
              </div>
            )}
          </>
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
