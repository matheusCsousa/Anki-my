import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDecks, errorMessage } from "../services/api";
import type { Deck } from "../utils/models";
import DeckComponent from "../components/DeckComponent";
export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetchDecks()
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
  const due = decks.reduce((n, d) => n + d.due_count, 0),
    count = decks.reduce((n, d) => n + d.card_count, 0);
  return (
    <>
      <div className="workspace-top">
        <span>Personal workspace</span>
        <Link className="button" to="/deck/new">
          ＋ New deck
        </Link>
      </div>
      <header className="page-heading">
        <p className="eyebrow">MAKE ROOM FOR WHAT YOU KNOW</p>
        <h1>Your next little breakthrough.</h1>
        <p>Pick a deck. Find your focus. Keep things moving.</p>
      </header>
      <section className="overview" aria-label="Your study overview">
        <div>
          <span className="stat-symbol blue">▤</span>
          <p>
            Your collection<strong>{decks.length} decks</strong>
          </p>
        </div>
        <div>
          <span className="stat-symbol pink">✳</span>
          <p>
            Ready for practice<strong>{due} cards due</strong>
          </p>
        </div>
        <div>
          <span className="stat-symbol purple">◇</span>
          <p>
            Ideas worth keeping<strong>{count} cards</strong>
          </p>
        </div>
      </section>
      <div className="section-toolbar">
        <h2>
          My decks <span>{decks.length}</span>
        </h2>
        <label className="search-label">
          <span className="sr-only">Search your decks</span>
          <input
            type="search"
            placeholder="Search your decks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <p role="status" className="empty-state">
          Loading your decks…
        </p>
      ) : error ? (
        <div role="alert" className="error-box">
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
              <h3>
                {decks.length
                  ? "No matching decks"
                  : "Your first deck starts here."}
              </h3>
              <p>
                {decks.length
                  ? "Try another search."
                  : "Collect a few ideas and turn them into flashcards."}
              </p>
              {!decks.length && (
                <Link to="/deck/new" className="button">
                  Create your first deck
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
