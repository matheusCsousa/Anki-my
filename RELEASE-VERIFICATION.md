# Release verification and remaining limits

This file records the scope of the checks, rather than promising that all possible attacks or hosting failures have been ruled out.

## Dependency review

- Frontend: compatible lockfile updates applied; `npm audit --omit=dev` returned zero vulnerabilities during this release preparation.
- Development tooling: the full npm audit still reports moderate minimatch-related advisories through ESLint. Those tools are not shipped in the static browser bundle or production runtime container.
- Rust: the original lockfile contained advisories affecting authentication and server dependencies. The lockfile was refreshed, jsonwebtoken was upgraded to 10.x, and the unmaintained dotenv dependency was replaced with dotenvy.
- The refreshed Rust OSV scan reports RSA/crypto-bigint advisories in optional asymmetric-cryptography code pulled in by jsonwebtoken's RustCrypto provider. This application signs and validates only HS256 tokens using a server-held secret. It does not construct RSA keys, accept JWKs, or enable RSA/ECDSA token algorithms. These advisories remain visible in the dependency inventory; reassess them before introducing any asymmetric-token or key-import feature.

## Runtime behavior covered by tests

Database-backed tests cover registration, duplicate usernames, invalid credentials, unauthorized requests, private-deck access, shared read access, owner-only mutation, independent per-user reviews, and cleanup when a deck is removed. Unit tests cover interval scheduling, input validation, authentication attempt limits, JWT signatures, expiry, and algorithm rejection.

The automatic tests use disposable PostgreSQL databases. The local verification runtime and database are under ignored `.tooling/`; they are excluded from Git and Docker builds.

## Hosting checks still required

The Dockerfile and Render Blueprint are prepared. Confirm a successful Linux/container CI run and complete the smoke checklist in DEPLOYMENT.md on the actual public HTTPS URL after configuring Render and Neon. A local frontend build or local database test does not verify the hosted deployment.

See DEPLOYMENT.md for free-tier limits, backups, session behavior, and features that are not included in the first release.

## Results from local verification

- Production frontend build: passed.
- Rust/PostgreSQL tests: 7 passed, 0 failed after the dependency upgrades.
- Integrated server readiness and SPA route: HTTP 200.
- Browser: registered a disposable local account, created a private deck, added and edited a card, refreshed the deck URL, reviewed the card, then refreshed the study page and confirmed no card was due. Mobile landing-page overflow and form password-mismatch feedback were also checked.
- Container build and actual hosted deployment: pending a Linux CI run and hosting-account configuration; Docker is not installed in this Windows environment.
