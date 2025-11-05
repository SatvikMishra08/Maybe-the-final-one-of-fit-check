/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { WardrobeItem } from "../types";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const triggerHapticFeedback = (pattern: VibratePattern | 'double' = 50) => {
  if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
    const vibratePattern = pattern === 'double' ? [50, 50, 50] : pattern;
    try {
      window.navigator.vibrate(vibratePattern);
    } catch (e) {
      // Vibration may be disabled by user settings
      console.log("Haptic feedback failed.", e);
    }
  }
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const lowerCaseMessage = error.message.toLowerCase();
    // Network errors or specific transient server errors (e.g., 503)
    if (
      lowerCaseMessage.includes('failed to fetch') || 
      lowerCaseMessage.includes('network request failed') ||
      lowerCaseMessage.includes('503') ||
      lowerCaseMessage.includes('timeout')
    ) {
      return true;
    }
  }
  return false;
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = (attempt: number) => Math.pow(2, attempt) * 200 // Exponential backoff
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error; // Don't retry if the user cancelled
      }
      attempt++;
      if (attempt >= retries || !isRetryableError(error)) {
        throw error; // Not a retryable error or max retries reached
      }
      console.warn(`Attempt ${attempt} failed with retryable error. Retrying in ${delay(attempt)}ms...`);
      await new Promise(res => setTimeout(res, delay(attempt)));
    }
  }
};


export function getFriendlyErrorMessage(error: unknown, context: string): string {
    let rawMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (error) {
        rawMessage = String(error);
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
        return `The operation was cancelled.`;
    }
    if (error instanceof DOMException && error.name === 'TimeoutError') {
        return `The request timed out. This could be due to a slow network or high server load. Please try again.`;
    }

    const lowerCaseMessage = rawMessage.toLowerCase();

    // Network errors
    if (lowerCaseMessage.includes('failed to fetch') || lowerCaseMessage.includes('network request failed')) {
        return `A network error occurred. Please check your internet connection and try again.`;
    }

    // Timeout
    if (lowerCaseMessage.includes('timeout')) {
        return `The request timed out. This could be due to a slow network or high server load. The "Retry" button might help.`;
    }

    // Safety/Policy blocks from Gemini API
    if (lowerCaseMessage.includes('request was blocked') || lowerCaseMessage.includes('safety policy')) {
        return `The request was blocked due to the content safety policy. This can happen with images that are unclear or resemble restricted content. Please try a different image or prompt.`;
    }

    if (lowerCaseMessage.includes('generation stopped unexpectedly') && lowerCaseMessage.includes('safety settings')) {
        return `The image could not be generated, which can be due to safety filters. Please try a different image or prompt.`;
    }
    
    // Unsupported file type
    if (lowerCaseMessage.includes("unsupported mime type")) {
         // Attempt to extract the specific MIME type for a more helpful message
        const mimeMatch = rawMessage.match(/Unsupported MIME type: (\S+)/);
        if (mimeMatch && mimeMatch[1]) {
            return `File type '${mimeMatch[1]}' is not supported. Please use a format like PNG, JPEG, or WEBP.`;
        }
        return `Unsupported file format. Please upload an image format like PNG, JPEG, or WEBP.`;
    }
    
    // Generic Gemini error about not returning an image
    if (lowerCaseMessage.includes('ai model did not return an image')) {
        return `The AI model didn't return an image. This can happen if the request is too complex or the garment is difficult to place on the model. Please try a different item.`;
    }
    
    // Don't show context for AbortError as it's not a real error.
    if (context && !(error instanceof DOMException && error.name === 'AbortError')) {
      return `${context}. ${rawMessage}`;
    }

    return rawMessage;
}

/**
 * Parses a height string (e.g., "5ft 10in", "178cm") into inches.
 */
export const parseHeight = (heightStr: string): number | null => {
    if (!heightStr) return null;
  
    const cmMatch = heightStr.match(/(\d+(\.\d+)?)\s*cm/);
    if (cmMatch) {
      return parseFloat(cmMatch[1]) / 2.54;
    }
  
    const ftInMatch = heightStr.match(/(\d+)\s*f[t']?\s*(\d+)?\s*i?n?"?/);
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1], 10) || 0;
      const inches = parseInt(ftInMatch[2], 10) || 0;
      return feet * 12 + inches;
    }
  
    const justInchesMatch = heightStr.match(/(\d+(\.\d+)?)\s*i?n?"?/);
    if (justInchesMatch) {
      return parseFloat(justInchesMatch[1]);
    }

    const numeric = parseFloat(heightStr);
    if (!isNaN(numeric)) {
        // Guess if it's cm or inches based on typical human heights
        return numeric > 100 ? numeric / 2.54 : numeric;
    }
  
    return null;
};

/**
 * Recommends a size based on model height.
 * This is a simplified heuristic and can be replaced with a more complex model.
 */
export const getRecommendedSize = (modelHeightInches: number, item: WardrobeItem): string | undefined => {
    if (!item.measurements || item.measurements.length === 0) {
      return undefined;
    }
  
    // Simple logic: associate height ranges with sizes.
    // T-shirts and sweaters often have different fits.
    const isTop = item.name.toLowerCase().includes('tee') || item.name.toLowerCase().includes('sweat');
  
    if (isTop) {
      if (modelHeightInches < 68) return 'S'; // < 5'8"
      if (modelHeightInches >= 68 && modelHeightInches <= 72) return 'M'; // 5'8" - 6'0"
      if (modelHeightInches > 72) return 'L'; // > 6'0"
    }
  
    // Default to medium if no specific logic matches
    const hasMedium = item.measurements.some(m => m.sizeLabel === 'M');
    return hasMedium ? 'M' : item.measurements[0].sizeLabel;
};

// --- Audio Decoding for TTS ---
export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                resolve((reader.result as string).split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as data URL."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};