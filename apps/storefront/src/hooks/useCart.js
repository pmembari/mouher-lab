import { useCallback, useMemo, useState } from "react";

import {
  addProductToCart,
  isMedusaConfigured,
  medusaConfig,
} from "../lib/catalog";

import {
  sumCartItems,
  upsertCartItem,
  updateCartItemQuantity,
} from "../utils/cart";

import { trackEvent } from "../lib/analytics";

export function useCart({
  cartLabels,
  checkoutLabels,
  onOpenCart,
  onProductAdded,
}) {
  const [cartItems, setCartItems] = useState([]);
  const [cartMessage, setCartMessage] = useState("");

  const [
    addingProductId,
    setAddingProductId,
  ] = useState("");

  const cartCount = useMemo(
    () => sumCartItems(cartItems),
    [cartItems]
  );

  const addToCart = useCallback(
    async (product) => {
      if (!product) {
        return;
      }

      trackEvent("add_to_cart", {
        product_id: product.id,
        product_name: product.name,
        price: product.priceAmount,
        source: product.source,
      });

      setAddingProductId(product.id);
      setCartMessage("");

      onOpenCart?.();

      try {
        if (
          product.source === "medusa" &&
          isMedusaConfigured(medusaConfig)
        ) {
          await addProductToCart(
            product,
            medusaConfig
          );

          setCartMessage(
            cartLabels.medusaAdded
          );
        } else {
          setCartMessage(
            cartLabels.previewAdded
          );
        }

        setCartItems((current) =>
          upsertCartItem(
            current,
            product
          )
        );

        onProductAdded?.(product);
      } catch (error) {
        console.error(
          "Add to cart failed:",
          error
        );

        setCartMessage(
          cartLabels.unavailable
        );
      } finally {
        setAddingProductId("");
      }
    },
    [
      cartLabels.medusaAdded,
      cartLabels.previewAdded,
      cartLabels.unavailable,
      onOpenCart,
      onProductAdded,
    ]
  );

  const increaseCartItem = useCallback(
    (productId) => {
      setCartMessage("");

      setCartItems((current) =>
        updateCartItemQuantity(
          current,
          productId,
          1
        )
      );
    },
    []
  );

  const decreaseCartItem = useCallback(
    (productId) => {
      setCartMessage("");

      setCartItems((current) =>
        updateCartItemQuantity(
          current,
          productId,
          -1
        )
      );
    },
    []
  );

  const removeCartItem = useCallback(
    (productId) => {
      setCartMessage("");

      setCartItems((current) =>
        current.filter(
          (item) =>
            item.product.id !==
            productId
        )
      );
    },
    []
  );

  const beginCheckout = useCallback(() => {
    const value = cartItems.reduce(
      (total, item) =>
        total +
        (Number(
          item.product.priceAmount
        ) || 0) *
        item.quantity,
      0
    );

    trackEvent("begin_checkout", {
      value,
      currency: "EUR",
    });

    setCartMessage(
      checkoutLabels.description
    );
  }, [
    cartItems,
    checkoutLabels.description,
  ]);

  return {
    cartItems,
    cartMessage,
    cartCount,
    addingProductId,

    addToCart,
    increaseCartItem,
    decreaseCartItem,
    removeCartItem,
    beginCheckout,
  };
}