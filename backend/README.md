# Backend — Anki-My

REST API built with Rust and [Rocket](https://rocket.rs/). Handles authentication, deck and card management, and serves data to the frontend.

## Tech

- Rust (edition 2024)
- Rocket 0.5 + rocket_cors
- SQLx + PostgreSQL
- JWT (jsonwebtoken) + bcrypt
- UUID v4 for all IDs

## Environment Variables

Create a `.env` file in `/backend`:

```env
DATABASE_URL=postgres://user:password@localhost/ankimy
JWT_SECRET=your_secret_here
ROCKET_SECRET_KEY=your_rocket_key_here
```

## Run

```bash
cargo run
```

Runs on port `8000` by default (`Rocket.toml`).

## API Endpoints

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/login` | No | Returns JWT token |
| POST | `/register` | No | Creates user, returns JWT token |

**Request body (both):**
```json
{ "username": "string", "password": "string" }
```

**Response:**
```json
{ "token": "eyJ..." }
```

### Decks

All deck routes require `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| GET | `/deck` | List decks owned by the authenticated user |
| POST | `/deck/new` | Create a new deck |
| GET | `/deck/shared` | List all public shared decks |
| GET | `/deck/:id/card` | List all cards in a deck |

**POST `/deck/new` body:**
```json
{ "name": "string" }
```

Returns `409 Conflict` if deck name already exists.

## Project Structure

```
src/
├── main.rs         # Route handlers, CORS config, Rocket setup
├── models/mod.rs   # Structs: User, Deck, Card, AuthUser, Claims
├── db.rs           # PostgreSQL connection pool (SQLx)
└── utils/mod.rs    # JWT generate/verify helpers
```

## Database Schema (expected)

```sql
CREATE TABLE users (
    id       TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE decks (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    user_id   TEXT REFERENCES users(id),
    is_shared BOOLEAN DEFAULT false
);

CREATE TABLE cards (
    id      TEXT PRIMARY KEY,
    front   TEXT NOT NULL,
    back    TEXT NOT NULL,
    deck_id TEXT REFERENCES decks(id)
);
```
