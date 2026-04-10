# Frontend — Anki-My

Single-page application built with React 19, TypeScript, and Vite. Communicates with the Rocket backend via REST API.

## Tech

- React 19 + TypeScript
- Vite 7
- TailwindCSS 4
- React Router v7

## Environment Variables

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:8000
```

For production, set this to your deployed backend URL.

## Run

```bash
npm install
npm run dev       # development — http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Pages & Routes

| Route | Page | Auth required |
|---|---|---|
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/` | DashboardPage (deck list) | Yes |
| `/deck/new` | NewDeckPage | Yes |
| `/deck/:id` | DeckPage (cards list) | Yes |
| `/deck/:id/study` | DeckStudyPage (flashcard flip) | Yes |
| `/deck/shared` | SharedPage (public decks) | Yes |

Protected routes redirect to `/login` if no token is found in `localStorage`.

## Project Structure

```
src/
├── App.tsx                          # Route definitions
├── main.tsx                         # React entry point
├── pages/                           # One file per route
├── components/
│   ├── DeckComponent.tsx            # Deck card UI
│   ├── SidebarComponent.tsx         # Navigation sidebar
│   └── ProtectedRouteComponent.tsx  # Auth guard
├── services/
│   └── api.ts                       # All fetch calls to the backend
└── utils/
    └── models.ts                    # Deck and Card classes
```

## API Integration

All requests go through `src/services/api.ts`. The base URL comes from `VITE_API_URL`. JWT token is stored in `localStorage` under the key `token` and sent as `Authorization: Bearer <token>` on authenticated requests.
