import { useCallback, useEffect, useState } from "react";

export function useStorefrontShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const openCart = useCallback(() => {
    setCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  const openQuickView = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const closeTransientUi = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSelectedProduct(null);
  }, []);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setSelectedProduct(null);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeAll();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAll]);

  useEffect(() => {
    const shouldLock =
      menuOpen ||
      searchOpen ||
      cartOpen ||
      Boolean(selectedProduct);

    document.body.style.overflow = shouldLock
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    menuOpen,
    searchOpen,
    cartOpen,
    selectedProduct,
  ]);

  return {
    menuOpen,
    openMenu,
    closeMenu,

    searchOpen,
    openSearch,
    closeSearch,

    cartOpen,
    openCart,
    closeCart,

    selectedProduct,
    openQuickView,
    closeQuickView,

    closeTransientUi,
    closeAll,
  };
}