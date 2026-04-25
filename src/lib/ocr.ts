import Tesseract from 'tesseract.js';

export interface OcrResult {
  fullText: string;
  cardNumber: string | null;
  confidence: number;
}

/**
 * Preprocess image: crop bottom portion and increase contrast
 * Card numbers are typically printed at the bottom of Pokémon cards
 */
function preprocessImage(canvas: HTMLCanvasElement, image: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Crop bottom 25% of the image where card number usually is
  const sourceY = Math.floor(image.height * 0.75);
  const sourceHeight = Math.floor(image.height * 0.25);

  canvas.width = image.width;
  canvas.height = sourceHeight;

  ctx.drawImage(image, 0, sourceY, image.width, sourceHeight, 0, 0, image.width, sourceHeight);

  // Convert to grayscale and increase contrast
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    // Increase contrast
    const contrast = 1.5;
    const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Extract card number from OCR text
 * Korean cards use the same format: XXX/YYY
 */
function extractCardNumber(text: string): string | null {
  // Match patterns like: 025/165, 25/165, 1/100, etc.
  const patterns = [
    /(\d{1,4})\s*\/\s*(\d{1,4})/,     // Standard: 025/165
    /(\d{1,4})\s*[/\\|]\s*(\d{1,4})/, // With OCR artifacts
    /#?\s*(\d{1,4})\s*\/\s*(\d{1,4})/  // With # prefix
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }
  return null;
}

/**
 * Run OCR on an image and extract the card number
 */
export async function recognizeCardNumber(
  imageSource: string | HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    // If imageSource is a string (data URL), create an image element to preprocess
    let source: string | HTMLCanvasElement = imageSource;

    if (typeof imageSource === 'string') {
      const img = new Image();
      img.src = imageSource;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });

      const preprocessCanvas = document.createElement('canvas');
      preprocessImage(preprocessCanvas, img);
      source = preprocessCanvas;
    }

    const result = await worker.recognize(source);
    await worker.terminate();

    const text = result.data.text;
    const cardNumber = extractCardNumber(text);

    return {
      fullText: text.trim(),
      cardNumber,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      fullText: '',
      cardNumber: null,
      confidence: 0,
    };
  }
}

/**
 * Capture a frame from a video element
 */
export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0);
  }
  return canvas.toDataURL('image/jpeg', 0.9);
}
