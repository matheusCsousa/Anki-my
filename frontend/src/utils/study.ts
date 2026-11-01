import type { Card, ReviewResult } from "./models";

export function formatDelay(seconds: number): string {
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hr`;
  const days = Math.ceil(seconds / 86400);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function applyReview(cards: Card[], id: string, result: ReviewResult): Card[] {
  return cards.map((card) => card.id === id ? {
    ...card, due: false, due_at: result.due_at, interval_days: result.interval_days,
  } : card);
}

// Keep the visible card in place when a delayed card becomes due in the background.
export function mergeStudyCards(previous: Card[], fresh: Card[]): Card[] {
  const order = previous.filter((card) => card.due).map((card) => card.id);
  const rank = (card: Card) => {
    if (!card.due) return Number.MAX_SAFE_INTEGER;
    const index = order.indexOf(card.id);
    return index < 0 ? order.length : index;
  };
  return [...fresh].sort((a, b) => rank(a) - rank(b));
}
