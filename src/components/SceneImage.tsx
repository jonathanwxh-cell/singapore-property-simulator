import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { LIFE_SCENE_FALLBACK } from '@/data/lifeVisuals';

export default function SceneImage({
  src,
  alt,
  className,
  fallbackSrc = LIFE_SCENE_FALLBACK,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const [error, setError] = useState(false);

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
      loading="lazy"
      decoding="async"
      className={className}
      onError={(event) => {
        const image = event.target as HTMLImageElement;
        if (!image.dataset.fallbackApplied && fallbackSrc && image.src !== fallbackSrc) {
          image.dataset.fallbackApplied = 'true';
          image.src = fallbackSrc;
          image.alt = 'Fallback life scene';
          return;
        }

        setError(true);
      }}
    />
  );
}
