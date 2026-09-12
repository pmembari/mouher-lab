const IMAGE_BASE = `${import.meta.env.BASE_URL}mouher-images/`;

function resolveImageUrl(image) {
  if (!image) return "";

  const src =
    typeof image === "string"
      ? image
      : image.src || image.url || "";

  if (!src) return "";

  // Already an external URL
  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  // Local Mouher image
  const filename = src.split("/").pop();

  return `${IMAGE_BASE}${filename}`;
}

export async function getMouherImages() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}mouher-images.json`
  );

  if (!response.ok) {
    throw new Error("Could not load Mouher images");
  }

  const images = await response.json();

  return images.map(resolveImageUrl);
}