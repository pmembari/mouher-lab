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
  const inputRef =
    useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          inputRef.current?.focus();
        }
      );

    function handleKeyDown(event) {
      if (
        event.key === "Escape"
      ) {
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
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label={
          t.search.title
        }
      >
        <form
          className="search-panel-form"
          onSubmit={onSubmit}
        >
          <span
            className="search-panel-icon"
            aria-hidden="true"
          >
            <SearchIcon />
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder={
              t.search.placeholder
            }
            onChange={(event) =>
              onQueryChange(
                event.target.value
              )
            }
            autoComplete="off"
            spellCheck="false"
            aria-label={
              t.search.open
            }
          />

          {query && (
            <button
              type="button"
              className="search-panel-clear"
              onClick={() =>
                onQueryChange("")
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="search-panel-submit"
            disabled={
              !query.trim()
            }
          >
            Search
          </button>

          <button
            type="button"
            className="search-panel-close"
            onClick={onClose}
            aria-label={
              t.search.close
            }
          >
            <CloseIcon />
          </button>
        </form>
      </div>
    </div>
  );
}