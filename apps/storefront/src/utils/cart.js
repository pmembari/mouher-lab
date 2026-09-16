export function sumCartItems(items) {
  return items.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function sumCartSubtotal(items) {
  return items.reduce(
    (total, item) =>
      total +
      (Number(item.product.priceAmount) || 0) *
      item.quantity,
    0
  );
}

export function upsertCartItem(items, product) {
  const existing = items.find(
    (item) => item.product.id === product.id
  );

  if (existing) {
    return items.map((item) =>
      item.product.id === product.id
        ? {
          ...item,
          quantity: item.quantity + 1,
        }
        : item
    );
  }

  return [
    ...items,
    {
      product,
      quantity: 1,
    },
  ];
}

export function updateCartItemQuantity(
  items,
  productId,
  delta
) {
  return items.flatMap((item) => {
    if (item.product.id !== productId) {
      return [item];
    }

    const quantity = item.quantity + delta;

    return quantity > 0
      ? [{ ...item, quantity }]
      : [];
  });
}