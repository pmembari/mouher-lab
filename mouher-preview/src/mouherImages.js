const IMAGE_BASE = `${import.meta.env.BASE_URL}mouher-images/`;

function resolveImageUrls(image) {
  if (!image) return [];

  const src =
    typeof image === "string"
      ? image
      : image.src || image.url || "";

  const originalUrl =
    typeof image === "object"
      ? image.originalUrl || ""
      : "";

  if (!src && !originalUrl) return [];

  // If the source is already an external URL, use it directly.
  if (/^https?:\/\//i.test(src)) {
    return [src, originalUrl].filter(
      (url, index, urls) =>
        url && urls.indexOf(url) === index
    );
  }

  const filename = src.split("/").pop();

  return [
    // 1. GitHub Pages
    `${IMAGE_BASE}${filename}`,

    // 2. Local development
    `/mouher-images/${filename}`,

    // 3. Original Mouher source
    originalUrl,
  ].filter(
    (url, index, urls) =>
      url && urls.indexOf(url) === index
  );
}

export async function getMouherImages() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}mouher-images.json`
  );

  if (!response.ok) {
    throw new Error("Could not load Mouher images");
  }

  const images = await response.json();

  return images.map((image) => ({
    ...image,
    urls: resolveImageUrls(image),
  }));
}