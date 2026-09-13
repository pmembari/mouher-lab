import { useEffect, useState } from "react";

export function ProductImage({ image, alt, className }) {
  const sources = Array.isArray(image) ? image.filter(Boolean) : [image].filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex] || "";

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join("|")]);

  if (!src) {
    return <div className={`${className} product-image-empty`} aria-label={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => current + 1);
        }
      }}
    />
  );
}
