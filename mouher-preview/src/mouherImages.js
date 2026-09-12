export async function getMouherImages() {
  const response = await fetch(
    `${import.meta.env.BASE_URL}mouher-images.json`
  );

  if (!response.ok) {
    throw new Error("Could not load Mouher images");
  }

  return response.json();
}