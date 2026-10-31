import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { newDeck, errorMessage } from "../services/api";
export default function NewDeckPage() {
  const [name, setName] = useState(""),
    [shared, setShared] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const deck = await newDeck(name.trim(), shared);
      navigate(`/deck/${deck.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/app">
        ← My decks
      </Link>
      <header className="page-heading">
        <p className="eyebrow">START WITH A LITTLE CURIOSITY</p>
        <h1>A home for your next idea.</h1>
        <p>Name your deck. The learning starts with one card.</p>
      </header>
      <form onSubmit={(e) => void submit(e)} className="editor-form">
        <label htmlFor="deck-name">Deck name</label>
        <input
          id="deck-name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Everyday Spanish"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          Share this deck with the community
        </label>
        <small>
          Shared cards are visible to signed-in users. Only you can edit them.
        </small>
        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}
        <button className="button" disabled={busy || !name.trim()}>
          {busy ? "Creating…" : "Create deck →"}
        </button>
      </form>
    </>
  );
}
