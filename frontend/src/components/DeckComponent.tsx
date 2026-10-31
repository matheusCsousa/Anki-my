import { Link } from "react-router-dom";
import type { Deck } from "../utils/models";
export default function DeckComponent({ deck }: { deck: Deck }) {
  return (
    <Link className="deck-tile" to={`/deck/${deck.id}`}>
      <div className="deck-tile-top">
        <span className="deck-icon" aria-hidden="true">
          ▤
        </span>
        <span className="tag">{deck.is_shared ? "Shared" : "Private"}</span>
      </div>
      <h2>{deck.name}</h2>
      <p>
        {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
      </p>
      <div className="deck-tile-bottom">
        <span>
          <i className="due-dot" />
          {deck.due_count} due to review
        </span>
        <span aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}
