-- Compatible with the original TEXT-id schema; existing decks and cards are retained.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), is_shared BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY, front TEXT NOT NULL, back TEXT NOT NULL, deck_id TEXT NOT NULL REFERENCES decks(id)
);
CREATE INDEX IF NOT EXISTS decks_user_idx ON decks(user_id);
CREATE INDEX IF NOT EXISTS cards_deck_idx ON cards(deck_id);
CREATE UNIQUE INDEX IF NOT EXISTS decks_owner_name_idx ON decks(user_id, name);
CREATE TABLE IF NOT EXISTS card_reviews (
    user_id TEXT NOT NULL REFERENCES users(id),
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    interval_days INTEGER NOT NULL DEFAULT 0 CHECK(interval_days BETWEEN 0 AND 365),
    due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY(user_id, card_id)
);
CREATE INDEX IF NOT EXISTS reviews_due_idx ON card_reviews(user_id, due_at);
