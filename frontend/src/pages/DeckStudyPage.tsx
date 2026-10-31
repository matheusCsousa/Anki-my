import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchDeck,
  fetchCards,
  reviewCard,
  errorMessage,
} from "../services/api";
import type { Deck, Card, Grade } from "../utils/models";
export default function DeckStudyPage() {
  const { id = "" } = useParams();
  const [deck, setDeck] = useState<Deck | null>(null),
    [queue, setQueue] = useState<Card[]>([]),
    [total, setTotal] = useState(0),
    [done, setDone] = useState(0),
    [flipped, setFlipped] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setDone(0);
    setFlipped(false);
    Promise.all([fetchDeck(id), fetchCards(id)])
      .then(([d, c]) => {
        if (active) {
          const due = c.filter((card) => card.due);
          setDeck(d);
          setQueue(due);
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
  async function answer(grade: Grade) {
    if (!queue[0] || busy) return;
    setBusy(true);
    setError("");
    try {
      await reviewCard(id, queue[0].id, grade);
      setQueue((q) => (grade === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
      if (grade !== "again") setDone((d) => d + 1);
      setFlipped(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
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
              ? `You completed ${done} ${done === 1 ? "card" : "cards"}. Your progress is saved.`
              : "There are no cards due right now. Come back later, or add more to your deck."}
          </p>
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
              {done} of {total} cards completed
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
                      {grade === "again"
                        ? "Repeat this session"
                        : grade === "hard"
                          ? "A little sooner"
                          : grade === "good"
                            ? "A little later"
                            : "More time away"}
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
