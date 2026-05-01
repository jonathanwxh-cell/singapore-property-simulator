import { useState } from 'react';
import { ImageOff } from 'lucide-react';

const imageFallbacks: Record<string, string> = {
  '/district-hdb.jpg': '/property-interior-2.jpg',
  '/district-orchard.jpg': '/property-interior-1.jpg',
  '/district-marina.jpg': '/district-sentosa.jpg',
  '/property-shophouse.jpg': '/property-interior-1.jpg',
};

export default function PropertyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  const fallbackSrc = imageFallbacks[src] || '/property-interior-1.jpg';

  if (error) {
    return (
      <div className={`${className} bg-void-navy flex items-center justify-center`}>
        <ImageOff size={20} className="text-text-dim" />
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
