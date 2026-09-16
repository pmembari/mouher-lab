import AnalyticsConsent from "./AnalyticsConsent";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

import CartDrawer from "../storefront/CartDrawer";
import QuickView from "../storefront/QuickView";

export default function StorefrontOverlays({
  t,
  language,
  isFarsi,
  analytics,
  shell,
  cart,
  query,
  onQueryChange,
  onSearchSubmit,
}) {
  return (
    <>
      <AnalyticsConsent
        visible={analytics.consent === "unknown"}
        isFarsi={isFarsi}
        onDecline={analytics.decline}
        onAccept={analytics.accept}
      />

      <CartDrawer
        open={shell.cartOpen}
        items={cart.cartItems}
        labels={t.cart}
        checkoutLabels={t.checkout}
        language={language}
        onClose={shell.closeCart}
        onCheckout={cart.beginCheckout}
        onIncrease={cart.increaseCartItem}
        onDecrease={cart.decreaseCartItem}
        onRemove={cart.removeCartItem}
      />

      <QuickView
        product={shell.selectedProduct}
        language={language}
        labels={t.cart}
        productLabels={t.products}
        onAdd={cart.addToCart}
        onClose={shell.closeQuickView}
        isAdding={
          cart.addingProductId === shell.selectedProduct?.id
        }
      />

      <MobileMenu
        open={shell.menuOpen}
        t={t}
        isFarsi={isFarsi}
        onClose={shell.closeMenu}
      />

      <SearchOverlay
        open={shell.searchOpen}
        t={t}
        query={query}
        onQueryChange={onQueryChange}
        onClose={shell.closeSearch}
        onSubmit={onSearchSubmit}
      />
    </>
  );
}
