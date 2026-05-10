/**
 * Image optimization utilities using the Canvas API
 * Provides client-side image compression, WebP conversion, and thumbnail generation
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface ThumbnailOptions {
  size: number;
  quality?: number;
}

/**
 * Load an image file into an HTMLImageElement
 * @param file - The image file to load
 * @returns Promise resolving to the loaded image element
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 * @param width - Original width
 * @param height - Original height
 * @param maxWidth - Maximum width allowed
 * @param maxHeight - Maximum height allowed
 * @returns Object with new dimensions
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height);

  if (ratio >= 1) {
    return { width, height };
  }

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Compress an image using Canvas API
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default: 1920)
 * @param quality - JPEG quality from 0 to 1 (default: 0.8)
 * @returns Promise resolving to the compressed image Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  // Validate input
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file provided');
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxWidth);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use better image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Convert an image to WebP format
 * @param file - The image file to convert
 * @param maxWidth - Maximum width (default: 1920)
 * @param quality - WebP quality from 0 to 1 (default: 0.8)
 * @returns Promise resolving to the WebP image Blob
 */
export async function convertToWebP(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  // Validate input
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file provided');
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxWidth);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert image to WebP'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Generate a thumbnail with maximum dimension while maintaining aspect ratio
 * @param file - The image file to create thumbnail from
 * @param size - Maximum dimension (width and height)
 * @param quality - WebP quality from 0 to 1 (default: 0.8)
 * @returns Promise resolving to the thumbnail Blob
 */
export async function generateThumbnail(
  file: File,
  size: number = 200,
  quality: number = 0.8
): Promise<Blob> {
  // Validate input
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file provided');
  }

  if (size <= 0 || size > 2000) {
    throw new Error('Thumbnail size must be between 1 and 2000');
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, size, size);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Compress an image with extended options
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to the optimized image Blob
 */
export async function optimizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file provided');
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to optimize image'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Get image dimensions from a file
 * @param file - The image file
 * @returns Promise resolving to width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  return { width: img.width, height: img.height };
}