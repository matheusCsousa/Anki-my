# Backend

The Rust/Rocket API is mounted at `/api`. PostgreSQL migrations run at startup. See the root README for setup and DEPLOYMENT.md for hosting.

Authenticated requests use `Authorization: Bearer <token>`. Private decks are visible only to their owner; shared decks can be studied by signed-in users. Only an owner may mutate decks or cards.

| Method | Endpoint                            | Behavior                                |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/api/health`                       | Database readiness                      |
| POST   | `/api/register`                     | Create account; returns JWT             |
| POST   | `/api/login`                        | Sign in; returns JWT                    |
| GET    | `/api/deck`                         | Own decks and actual card/due counts    |
| GET    | `/api/deck/shared`                  | Shared decks (up to 200)                |
| POST   | `/api/deck/new`                     | Create `{name, is_shared}`              |
| GET    | `/api/deck/:id`                     | Load accessible deck                    |
| PUT    | `/api/deck/:id`                     | Rename/change sharing                   |
| DELETE | `/api/deck/:id`                     | Delete owned deck, cards, and reviews   |
| GET    | `/api/deck/:id/card`                | Accessible cards with per-user due flag |
| POST   | `/api/deck/:id/card`                | Create `{front, back}`                  |
| PUT    | `/api/deck/:id/card/:cardId`        | Edit owned card                         |
| DELETE | `/api/deck/:id/card/:cardId`        | Delete owned card                       |
| POST   | `/api/deck/:id/card/:cardId/review` | Save `{grade}`                          |

Registration: username 3–40 ASCII letters/digits/underscore/hyphen; password 8–72 UTF-8 bytes. Deck names: 1–100 characters. Card sides: 1–10,000 characters. JSON requests are capped at 64 KiB.

Review grades: `again` schedules one minute ahead; `hard` schedules at least one day; `good` at least three; `easy` at least seven. Existing intervals grow by the factors in `utils::next_interval`, capped at 365 days. The frontend repeats Again cards in the current session. Scheduling uses PostgreSQL timestamps, and reviews are stored per user/card.

All configuration comes from environment variables: `DATABASE_URL`, `JWT_SECRET` (32+ bytes), optionally `PORT`, `ROCKET_SECRET_KEY`, `FRONTEND_DIST`, and `ALLOWED_ORIGINS`. CORS is enabled only when an explicit allowlist is supplied.
