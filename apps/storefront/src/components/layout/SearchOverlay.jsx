import {
  useEffect,
  useRef,
} from "react";

import {
  CloseIcon,
  SearchIcon,
} from "../icons";

export default function SearchOverlay({
  open,
  t,
  query,
  onQueryChange,
  onClose,
  onSubmit,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame =
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.cancelAnimationFrame(
        frame
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="search-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="search-dropdown"
        role="dialog"
        aria-modal="true"
        aria-label={
          t.search.title
        }
      >
        <div className="search-dropdown-inner">
          <div className="search-header">
            <div>
              <span className="search-eyebrow">
                MOUHER
              </span>

              <h2 className="search-title">
                {t.search.title}
              </h2>
            </div>

            <button
              type="button"
              className="search-close-button"
              onClick={onClose}
              aria-label={
                t.search.close
              }
            >
              <CloseIcon />
            </button>
          </div>

          <form
            className="search-form"
            onSubmit={onSubmit}
          >
            <div className="search-field">
              <span
                className="search-field-icon"
                aria-hidden="true"
              >
                <SearchIcon />
              </span>

              <input
                ref={inputRef}
                type="search"
                placeholder={
                  t.search.placeholder
                }
                value={query}
                onChange={(event) =>
                  onQueryChange(
                    event.target.value
                  )
                }
                aria-label={
                  t.search.open
                }
                autoComplete="off"
                spellCheck="false"
              />

              {query && (
                <button
                  type="button"
                  className="search-clear-button"
                  onClick={() =>
                    onQueryChange("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="submit"
              className="search-submit-button"
              disabled={
                !query.trim()
              }
            >
              <span>
                {t.search.submit}
              </span>

              <SearchIcon />
            </button>
          </form>

          <div className="search-suggestions">
            <span className="search-suggestions-label">
              Popular
            </span>

            <button
              type="button"
              onClick={() =>
                onQueryChange("shirts")
              }
            >
              Shirts
            </button>

            <button
              type="button"
              onClick={() =>
                onQueryChange("trousers")
              }
            >
              Trousers
            </button>

            <button
              type="button"
              onClick={() =>
                onQueryChange("coats")
              }
            >
              Coats
            </button>

            <button
              type="button"
              onClick={() =>
                onQueryChange("accessories")
              }
            >
              Accessories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}