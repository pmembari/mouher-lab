import {
  isMedusaConfigured,
} from "./config";

import {
  medusaRequest,
} from "./medusa";

export async function addProductToCart(
  product,
  config
) {
  if (
    !isMedusaConfigured(
      config
    )
  ) {
    throw new Error(
      "Medusa backend URL and publishable key are required."
    );
  }

  if (
    !product?.variantId
  ) {
    throw new Error(
      "This product does not have a purchasable variant."
    );
  }

  let cartId =
    getStoredCartId();

  if (!cartId) {
    const body =
      config.regionId
        ? {
          region_id:
            config.regionId,
        }
        : {};

    const { cart } =
      await medusaRequest(
        "/store/carts",
        {
          method: "POST",
          body,
          config,
        }
      );

    cartId =
      cart?.id;

    if (!cartId) {
      throw new Error(
        "Medusa did not return a cart id."
      );
    }

    setStoredCartId(
      cartId
    );
  }

  const { cart } =
    await medusaRequest(
      `/store/carts/${cartId}/line-items`,
      {
        method: "POST",

        body: {
          variant_id:
            product.variantId,

          quantity: 1,
        },

        config,
      }
    );

  return cart;
}

export function getStoredCartId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  return (
    window.localStorage.getItem(
      "mouher_medusa_cart_id"
    ) ||
    ""
  );
}

export function setStoredCartId(
  cartId
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    "mouher_medusa_cart_id",
    cartId
  );
}