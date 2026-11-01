import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchDeck,
  fetchCards,
  reviewCard,
  errorMessage,
} from "../services/api";
import { formatDelay, applyReview, mergeStudyCards } from "../utils/study";
import type { Deck, Card, Grade } from "../utils/models";
export default function DeckStudyPage() {
  const { id = "" } = useParams();
  const [deck, setDeck] = useState<Deck | null>(null),
    [cards, setCards] = useState<Card[]>([]),
    [total, setTotal] = useState(0),
    [done, setDone] = useState(0),
    [flipped, setFlipped] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const activeDeck = useRef(id);
  activeDeck.current = id;
  const queue = cards.filter((card) => card.due);
  const currentCardId = queue[0]?.id;
  const nextDue = cards.reduce<number | null>((next, card) => card.due_at !== null && !card.due ? Math.min(next ?? Infinity, card.due_at) : next, null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setDone(0);
    setCards([]);
    setDeck(null);
    setFlipped(false);
    Promise.all([fetchDeck(id), fetchCards(id)])
      .then(([d, c]) => {
        if (active) {
          const due = c.filter((card) => card.due);
          setDeck(d);
          setCards(c);
          setTotal(due.length);
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
  }, [id, retry]);
  // The server decides what is due. Wake up for the next scheduled card,
  // poll while waiting, and refresh after returning to a backgrounded tab.
  useEffect(() => {
    if (loading || !deck || busy) return;
    let active = true;
    let refreshing = false;
    async function refresh() {
      if (refreshing || document.hidden) return;
      refreshing = true;
      try {
        const fresh = await fetchCards(id);
        if (active) {
          setCards((previous) => mergeStudyCards(previous, fresh));
          setTotal(done + fresh.filter((card) => card.due).length);
          setError("");
        }
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally { refreshing = false; }
    }
    const delay = nextDue === null ? 15000 : Math.min(15000, Math.max(1000, nextDue - Date.now() + 250));
    const wake = window.setInterval(() => void refresh(), delay);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      window.clearInterval(wake);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [id, loading, deck, queue.length, nextDue, busy, done]);
  useEffect(() => { setFlipped(false); }, [currentCardId]);
  async function answer(grade: Grade) {
    const current = queue[0];
    if (!current || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await reviewCard(id, current.id, grade);
      if (activeDeck.current !== id) return;
      setCards((previous) => applyReview(previous, current.id, result));
      setDone((d) => d + 1);
      setFlipped(false);
    } catch (e) {
      if (activeDeck.current === id) setError(errorMessage(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const card = queue[0];
  if (loading)
    return (
      <p className="empty-state" role="status">
        Getting your next breakthrough ready…
      </p>
    );
  if (!deck)
    return (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button className="button" onClick={() => setRetry((r) => r + 1)}>
          Try again
        </button>
      </div>
    );
  return (
    <section className="study-page">
      <Link className="back-link" to={`/deck/${id}`}>
        ← Back to {deck.name}
      </Link>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {!card ? (
        <div className="study-finished">
          <span className="finish-mark" aria-hidden="true">
            ✳
          </span>
          <h1>
            {total ? "A little wiser. Nicely done." : "You’re all caught up."}
          </h1>
          <p>
            {total
              ? `You saved ${done} ${done === 1 ? "review" : "reviews"}. Your progress is saved.`
              : "There are no cards due right now. Come back later, or add more to your deck."}
          </p>
          {nextDue !== null && (
            <p role="status">Next card due {new Date(nextDue).toLocaleString()}. Keep this page open; it will appear automatically when ready.</p>
          )}
          <Link className="button" to={`/deck/${id}`}>
            Back to deck →
          </Link>
        </div>
      ) : (
        <>
          <header className="study-heading">
            <p className="eyebrow">A MOMENT TO FOCUS</p>
            <h1>{deck.name}</h1>
            <p>
              {done} of {total} reviews saved
            </p>
            <progress value={done} max={total} aria-label="Study progress" />
          </header>
          <button
            className={`flashcard ${flipped ? "is-flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            disabled={busy}
            aria-label={`${flipped ? card.back : card.front}. ${flipped ? "Show question" : "Show answer"}`}
          >
            <span className="eyebrow">
              {flipped ? "THE ANSWER" : "THINK IT THROUGH"}
            </span>
            <span className="flashcard-content">
              {flipped ? card.back : card.front}
            </span>
            <span className="flip-hint">
              {flipped
                ? "Click to revisit the question"
                : "Click to reveal the answer"}{" "}
              ↻
            </span>
          </button>
          {flipped ? (
            <div className="review-actions">
              <p>How did that feel?</p>
              <div>
                {(["again", "hard", "good", "easy"] as const).map((grade) => (
                  <button
                    className={`grade grade-${grade}`}
                    key={grade}
                    disabled={busy}
                    onClick={() => void answer(grade)}
                  >
                    {grade[0].toUpperCase() + grade.slice(1)}
                    <small>
                      {formatDelay(card.review_delays[grade])}
                    </small>
                  </button>
                ))}
              </div>
              {busy && <p role="status">Saving your review…</p>}
            </div>
          ) : (
            <p className="study-caption">
              Take your time. Remembering is a practice.
            </p>
          )}
        </>
      )}
    </section>
  );
}
