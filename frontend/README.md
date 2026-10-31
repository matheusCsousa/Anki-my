# Frontend

React, TypeScript, Vite, Tailwind CSS. Run `npm ci`, `npm run dev`, and `npm run build` from this directory. Vite proxies `/api` to localhost:8000 by default. Production assets are served by the Rust backend from the same origin.

Routes: `/` landing, `/login`, `/register`, `/app` collection, `/deck/new`, `/deck/shared`, `/deck/:id`, and `/deck/:id/study`. Unknown routes show a not-found page. Authentication expires when the backend returns 401; sign-out clears the local token.

See the root README and DEPLOYMENT.md for complete local and hosting instructions.
