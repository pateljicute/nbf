'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { uploadImage, validateImageDimensions, getOptimizedImageUrl } from '@/lib/cloudinary-utils';
import { cn } from '@/lib/utils';

// ── Canvas-based Image Compression ──────────────────────────────────────────
// No external library needed — pure browser Canvas API
async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Free memory

      let { width, height } = img;

      // Only downscale — never upscale small images
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback: return original if canvas not available
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback
            return;
          }
          // Keep original filename but mark as jpeg
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback: return original on error
    };

    img.src = objectUrl;
  });
}

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

export function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxFileSize = 5,
  disabled = false,
  className
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFiles = async (files: FileList) => {
    if (disabled) return;
    setError(null);

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const newUrls: string[] = [];

    // Step 1: Validate file types
    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, WebP allowed.`);
        return;
      }
      // 20MB raw limit before compression (compression will reduce it further)
      if (file.size > 20 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum 20MB per image.`);
        return;
      }
    }

    // Step 2: Compress all images first
    setIsCompressing(true);
    const compressedFiles: File[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const compressed = await compressImage(filesToUpload[i]);
        compressedFiles.push(compressed);
        console.log(`[Compress] ${filesToUpload[i].name}: ${(filesToUpload[i].size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
      } catch {
        compressedFiles.push(filesToUpload[i]); // Fallback to original
      }
    }
    setIsCompressing(false);

    // Step 3: Validate compressed size (should be under maxFileSize MB)
    for (const file of compressedFiles) {
      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`Image still too large after compression: ${file.name}. Try a smaller image.`);
        return;
      }
    }

    // Step 4: Upload compressed images
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i];

      try {
        const { valid } = await validateImageDimensions(file);
        if (!valid) {
          setError(`Image too small: ${filesToUpload[i].name}. Minimum 200x200px.`);
          continue;
        }

        const url = await uploadImage(file);
        newUrls.push(url);
        setUploadProgress(((i + 1) / compressedFiles.length) * 100);
      } catch (err: any) {
        setError(err.message || `Failed to upload ${filesToUpload[i].name}`);
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {images.length < maxImages && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary hover:bg-accent/5',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            accept={allowedTypes.join(',')}
            multiple
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP (max {maxFileSize}MB) • {images.length}/{maxImages} images
            </p>
          </div>
        </div>
      )}

      {(isCompressing || isUploading) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isCompressing ? 'Compressing images...' : 'Uploading...'}
            </span>
            {isUploading && <span>{Math.round(uploadProgress)}%</span>}
          </div>
          {isUploading && <Progress value={uploadProgress} className="h-2" />}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-video">
              <img
                src={getOptimizedImageUrl(url, 300, 200, 'fill')}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
