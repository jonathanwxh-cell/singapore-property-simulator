import { ImageOff } from 'lucide-react';
import { useState } from 'react';

const imageFallbacks: Record<string, string> = {
  '/district-hdb.jpg': '/property-interior-2.jpg',
  '/district-orchard.jpg': '/property-interior-1.jpg',
  '/district-marina.jpg': '/district-sentosa.jpg',
  '/property-shophouse.jpg': '/property-interior-1.jpg',
};

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIconSize?: number;
}

export default function PropertyImage({ src, alt, className, fallbackIconSize = 32 }: PropertyImageProps) {
  const [error, setError] = useState(false);
  const fallbackSrc = imageFallbacks[src] || '/property-interior-1.jpg';

  if (error) {
    return (
      <div className={`${className} bg-void-navy flex items-center justify-center`}>
        <ImageOff size={fallbackIconSize} className="text-text-dim" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src !== fallbackSrc && fallbackSrc) {
          img.src = fallbackSrc;
        } else {
          setError(true);
        }
      }}
    />
  );
}
