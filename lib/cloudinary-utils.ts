// Cloudinary configuration for property images
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'nbfhomes_demo',
  // Note: API secret should NEVER be in frontend code
  // Use unsigned upload presets instead
};

// File upload utility functions
export const uploadImage = async (file: File, folder: string = 'nbfhomes/properties'): Promise<string> => {
  if (!file) throw new Error('No file provided for upload');

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  // Validate upload preset
  if (CLOUDINARY_CONFIG.uploadPreset === 'nbfhomes_demo') {
    console.warn('Using default Cloudinary upload preset. This may fail if the preset does not exist in your Cloudinary account.');
    console.warn('Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.');
  }

  // Log config for debugging (excluding secret)
  console.log('Cloudinary Config:', {
    cloudName: CLOUDINARY_CONFIG.cloudName,
    uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);
  formData.append('resource_type', 'image');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Cloudinary response:', text);
      throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      console.error('Cloudinary upload failed. Status:', response.status, 'Response:', data);
      if (data.error?.message) {
        throw new Error(data.error.message);
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return data.secure_url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Generate optimized image URLs with aggressive compression settings
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'scale' | 'crop' | 'pad' | 'lfill' | 'fill_pad' | 'ignore_aspect_ratio',
  quality: 'auto' | 'low' | 'eco' | 'good' | 'best' = 'auto'
): string => {
  if (!url || url === 'undefined' || url === 'null') return '';

  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transformations = [];

      // Add transformations in the correct order (resize, then quality/format)
      if (width || height) {
        if (crop) {
          transformations.push(`c_${crop},${width ? `w_${width},` : ''}${height ? `h_${height}` : ''}`.replace(/,$/, ''));
        } else {
          // Default to fit crop if dimensions provided without specific crop
          transformations.push(`c_fill,w_${width || 'auto'},h_${height || 'auto'}`);
        }
      }

      // Add quality and format optimizations - most important for bandwidth
      if (quality === 'low') {
        transformations.push('q_40,f_webp');  // Very low quality, smallest size
      } else if (quality === 'eco') {
        transformations.push('q_60,f_webp');  // Low-medium quality
      } else if (quality === 'good') {
        transformations.push('q_80,f_webp');  // Good quality
      } else if (quality === 'best') {
        transformations.push('q_90,f_webp');  // High quality
      } else {
        transformations.push('q_auto,f_auto'); // Automatic optimization (default)
      }

      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
  }

  // If not a cloudinary URL, return original
  return url;
};

// Get responsive image sizes for different screen densities
export const getResponsiveImageUrls = (url: string, baseWidth: number): { small: string; medium: string; large: string; original: string } => {
  return {
    small: getOptimizedImageUrl(url, baseWidth * 0.25, undefined, 'fill', 'eco'),  // 25% size, low quality
    medium: getOptimizedImageUrl(url, baseWidth * 0.5, undefined, 'fill', 'good'), // 50% size, medium quality
    large: getOptimizedImageUrl(url, baseWidth, undefined, 'fill', 'auto'),        // 100% size, auto quality
    original: url // Unoptimized original as fallback
  };
};

// Validate image dimensions
export const validateImageDimensions = (file: File): Promise<{ width: number; height: number; valid: boolean }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = width / height;

      // Validate aspect ratio (between 1:2 and 2:1, which covers most standard ratios)
      const valid = aspectRatio >= 0.5 && aspectRatio <= 2 && width >= 400 && height >= 300;

      URL.revokeObjectURL(img.src); // Clean up
      resolve({ width, height, valid });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Could not validate image dimensions'));
    };
  });
};