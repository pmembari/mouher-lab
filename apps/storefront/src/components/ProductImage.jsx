import { useEffect, useMemo, useState } from "react";

const RESPONSIVE_WIDTHS = [360, 540, 720, 960, 1280];
const ARVAN_HOST_SUFFIX = ".arvanstorage.ir";
const PRODUCT_CARD_SIZES =
  "(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 36px), (max-width: 1500px) calc(25vw - 42px), 340px";

export function ProductImage({
  image,
  alt,
  className,
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
}) {
  const sources = Array.isArray(image)
    ? image.filter(Boolean)
    : [image].filter(Boolean);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [responsiveDisabled, setResponsiveDisabled] =
    useState(false);

  const src = sources[sourceIndex] || "";

  const srcSet = useMemo(() => {
    if (!src || responsiveDisabled) {
      return "";
    }

    return buildResponsiveSrcSet(src);
  }, [src, responsiveDisabled]);

  const resolvedSizes =
    sizes ||
    (hasClassName(className, "product-image")
      ? PRODUCT_CARD_SIZES
      : "100vw");

  useEffect(() => {
    setSourceIndex(0);
    setResponsiveDisabled(false);
  }, [sources.join("|")]);

  if (!src) {
    return (
      <div
        className={`${className} product-image-empty`}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => {
        if (srcSet && !responsiveDisabled) {
          setResponsiveDisabled(true);
          return;
        }

        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => current + 1);
          setResponsiveDisabled(false);
        }
      }}
    />
  );
}

function buildResponsiveSrcSet(src) {
  if (!supportsArvanImageResize(src)) {
    return "";
  }

  return RESPONSIVE_WIDTHS.map(
    (width) => `${withImageWidth(src, width)} ${width}w`
  ).join(", ");
}

function supportsArvanImageResize(src) {
  try {
    const url = new URL(src);

    if (!url.hostname.endsWith(ARVAN_HOST_SUFFIX)) {
      return false;
    }

    return !hasSignedQuery(url);
  } catch {
    return false;
  }
}

function withImageWidth(src, width) {
  const url = new URL(src);

  url.searchParams.set("width", String(width));

  return url.toString();
}

function hasSignedQuery(url) {
  const signedParams = [
    "X-Amz-Algorithm",
    "X-Amz-Credential",
    "X-Amz-Signature",
    "Signature",
  ];

  return signedParams.some((param) =>
    url.searchParams.has(param)
  );
}

function hasClassName(className, value) {
  return String(className || "")
    .split(/\s+/)
    .includes(value);
}
