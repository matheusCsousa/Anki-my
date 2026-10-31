import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchDeck,
  fetchCards,
  saveDeck,
  deleteDeck,
  saveCard,
  deleteCard,
  errorMessage,
} from "../services/api";
import type { Deck, Card } from "../utils/models";
export default function DeckPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null),
    [cards, setCards] = useState<Card[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(""),
    [shared, setShared] = useState(false),
    [editor, setEditor] = useState(false),
    [cardId, setCardId] = useState<string | undefined>(),
    [front, setFront] = useState(""),
    [back, setBack] = useState(""),
    [confirm, setConfirm] = useState("");
  const load = useCallback(async () => {
    const [d, c] = await Promise.all([fetchDeck(id), fetchCards(id)]);
    setDeck(d);
    setCards(c);
    setName(d.name);
    setShared(d.is_shared);
  }, [id]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setDeck(null);
    setError("");
    setEditing(false);
    setEditor(false);
    setConfirm("");
    Promise.all([fetchDeck(id), fetchCards(id)])
      .then(([d, c]) => {
        if (active) {
          setDeck(d);
          setCards(c);
          setName(d.name);
          setShared(d.is_shared);
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
  }, [id]);
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submitCard(e: FormEvent) {
    e.preventDefault();
    if (await mutate(() => saveCard(id, front, back, cardId))) {
      setEditor(false);
      setFront("");
      setBack("");
      setCardId(undefined);
    }
  }
  async function submitDeck(e: FormEvent) {
    e.preventDefault();
    if (await mutate(() => saveDeck(id, name, shared))) setEditing(false);
  }
  async function removeDeck() {
    setBusy(true);
    try {
      await deleteDeck(id);
      navigate("/app");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  if (loading)
    return (
      <p role="status" className="empty-state">
        Opening your deck…
      </p>
    );
  return (
    <>
      <Link className="back-link" to="/app">
        ← My decks
      </Link>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {deck && (
        <>
          <header className="page-heading">
            <p className="eyebrow">
              {deck.is_shared ? "SHARED KNOWLEDGE" : "YOUR PERSONAL COLLECTION"}
            </p>
            <h1>{deck.name}</h1>
            <p>
              {cards.length} {cards.length === 1 ? "card" : "cards"} ·{" "}
              {deck.due_count} ready for review
            </p>
          </header>
          <div className="deck-actions">
            {deck.due_count > 0 && (
              <Link className="button" to={`/deck/${id}/study`}>
                Start studying →
              </Link>
            )}
            {deck.is_owner && (
              <>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditor(true);
                    setCardId(undefined);
                    setFront("");
                    setBack("");
                  }}
                >
                  ＋ Add a card
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => setEditing(!editing)}
                >
                  Deck settings
                </button>
              </>
            )}
          </div>
          {editing && deck.is_owner && (
            <form className="editor-form" onSubmit={(e) => void submitDeck(e)}>
              <h2>Deck settings</h2>
              <label htmlFor="rename">Deck name</label>
              <input
                id="rename"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                />
                Share with the community
              </label>
              <small>
                Sharing makes every card in this deck visible to other signed-in
                users.
              </small>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  Save changes
                </button>
                <button
                  className="text-button danger"
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm("deck")}
                >
                  Delete deck
                </button>
              </div>
            </form>
          )}
          {editor && deck.is_owner && (
            <form className="editor-form" onSubmit={(e) => void submitCard(e)}>
              <h2>{cardId ? "Edit card" : "A new little idea."}</h2>
              <label htmlFor="card-front">Front · question or prompt</label>
              <textarea
                id="card-front"
                required
                maxLength={10000}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
              />
              <label htmlFor="card-back">Back · answer or explanation</label>
              <textarea
                id="card-back"
                required
                maxLength={10000}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
              />
              <div className="form-actions">
                <button
                  className="button"
                  disabled={busy || !front.trim() || !back.trim()}
                >
                  {busy ? "Saving…" : "Save card"}
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => setEditor(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {confirm && (
            <section className="delete-confirm" aria-label="Confirm deletion">
              <h2>
                {confirm === "deck"
                  ? "Delete this entire deck?"
                  : "Delete this card?"}
              </h2>
              <p>
                This permanently removes{" "}
                {confirm === "deck"
                  ? "the deck, its cards, and their review progress"
                  : "the card and its review progress"}
                . This cannot be undone.
              </p>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={() =>
                  void (confirm === "deck"
                    ? removeDeck()
                    : mutate(() => deleteCard(id, confirm)).then((ok) => {
                        if (ok) setConfirm("");
                      }))
                }
              >
                Yes, delete
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setConfirm("")}
              >
                Keep it
              </button>
            </section>
          )}
          <div className="section-toolbar">
            <h2>Inside this deck</h2>
            <span className="muted">
              {deck.is_owner
                ? "Only you can edit these cards"
                : "Read-only community deck"}
            </span>
          </div>
          <div className="card-list">
            {cards.map((card, index) => (
              <article key={card.id} className="card-row">
                <span className="card-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="eyebrow">FRONT</span>
                  <p>{card.front}</p>
                </div>
                <div>
                  <span className="eyebrow">BACK</span>
                  <p>{card.back}</p>
                </div>
                {deck.is_owner && (
                  <div className="row-actions">
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => {
                        setCardId(card.id);
                        setFront(card.front);
                        setBack(card.back);
                        setEditor(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => setConfirm(card.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!cards.length && (
              <div className="empty-state">
                <h3>A blank canvas for what you learn.</h3>
                <p>
                  {deck.is_owner
                    ? "Add your first card using the button above."
                    : "The owner hasn’t added any cards yet."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
