// SDK list() accepts headers, not request options. Bound the wait separately.
export async function withCatalogTimeout(request, milliseconds = 30000) {
  let timer;
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Catalog request timed out.")), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
