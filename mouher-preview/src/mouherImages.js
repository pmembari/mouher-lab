export async function getMouherImages() {
  const response = await fetch(
    "/mouher-images.json"
  );

  if (!response.ok) {
    throw new Error(
      "Could not load Mouher images"
    );
  }

  return response.json();
}