import { CLOUDINARY_CONFIG } from './cloudinary-utils';

type LoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

const buildTransformedUrl = (base: string, width: number, quality: number) => {
  const q = Number.isFinite(quality) ? quality : 75;

  if (base.includes('/upload/')) {
    const [head, tail] = base.split('/upload/');
    return `${head}/upload/f_auto,q_${q},w_${width}/${tail}`;
  }

  return `${base}`;
};

export default function cloudinaryLoader({ src, width, quality }: LoaderProps) {
  if (!src) return '';

  const trimmedSrc = src.replace(/^\/+/, '');
  const cloudName = CLOUDINARY_CONFIG.cloudName;

  // Full Cloudinary URL
  if (src.startsWith('http')) {
    return buildTransformedUrl(src, width, quality ?? 75);
  }

  // Public ID or path (no leading domain)
  const base = `https://res.cloudinary.com/${cloudName}/image/upload/${trimmedSrc}`;
  return buildTransformedUrl(base, width, quality ?? 75);
}
