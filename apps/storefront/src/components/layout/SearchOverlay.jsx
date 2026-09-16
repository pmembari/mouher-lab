import { CloseIcon, SearchIcon } from "../icons";

export default function SearchOverlay({
  open,
  t,
  query,
  onQueryChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t.search.title}
    >
      <div className="search-inner">
        <div className="search-header">
          <span className="search-title">
            {t.search.title}
          </span>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t.search.close}
          >
            <CloseIcon />
          </button>
        </div>

        <form
          className="search-form"
          onSubmit={onSubmit}
        >
          <SearchIcon />

          <input
            autoFocus
            type="search"
            placeholder={t.search.placeholder}
            value={query}
            onChange={(event) =>
              onQueryChange(event.target.value)
            }
            aria-label={t.search.open}
          />

          <button type="submit">
            {t.search.submit}
          </button>
        </form>
      </div>
    </div>
  );
}