import { useEffect, useState } from "react";
import { fetchSharedDecks, errorMessage } from "../services/api";
import type { Deck } from "../utils/models";
import DeckComponent from "../components/DeckComponent";
export default function SharedPage() {
  const [decks, setDecks] = useState<Deck[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetchSharedDecks()
      .then((d) => {
        if (active) {
          setDecks(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const filtered = decks.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">LEARN SOMETHING TOGETHER</p>
        <h1>A little shared knowledge.</h1>
        <p>Explore community decks. Your review progress stays your own.</p>
      </header>
      <div className="section-toolbar">
        <h2>Discover decks</h2>
        <label>
          <span className="sr-only">Search shared decks</span>
          <input
            type="search"
            placeholder="Find something to learn…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <p role="status">Loading community decks…</p>
      ) : error ? (
        <div className="error-box" role="alert">
          {error}
          <button
            onClick={() => {
              setLoading(true);
              setRetry((r) => r + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {filtered.map((d) => (
            <DeckComponent deck={d} key={d.id} />
          ))}
          {!filtered.length && (
            <div className="empty-state">
              <h3>No shared decks found.</h3>
              <p>Try another search, or share a deck from your collection.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
