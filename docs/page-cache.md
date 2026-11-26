# Account page caching

Account pages reuse successful reads until the user updates data, explicitly
refreshes, or changes accounts. There are no page-data polling timers, focus
refetches, reconnect refetches, or automatic failed-request retries.

## What is cached

- The current profile response is shared in memory for this document. Opening or
  reloading Account validates `/auth/me` once before enabling private cached reads.
- Saved-account display lists, security summaries, trusted-device metadata,
  passkey metadata, and activity are cached in memory and IndexedDB
  (`chefu-account-pages-v1`), separated by the server-validated UID and app context.
- Sections derived from the profile (overview, personal information, contact,
  notifications, privacy) reuse that profile without fetching on section changes.
- First visits to uncached data still require a server request. Opening another
  tab validates its identity, then can reuse the same UID's persisted page data.

A browser Refresh deliberately clears persisted page reads and loads fresh data.
The Security refresh controls explicitly reload their requested resource. If
IndexedDB is unavailable, the application falls back to memory caching.

## Updates and account changes

Authenticated mutations fence reads before and after the request, including failed
requests that may have partially changed the server. Cached data is invalidated;
the next visit or the action's own reload obtains fresh results. A profile PATCH
uses its verified response directly, avoiding a follow-up profile GET. Changes to
connected-app access also update the visible profile state.

Sign-in, account switching, sign-out, deletion, and denied-session responses discard
private memory and persistent data. BroadcastChannel (with a storage-event fallback)
notifies other tabs. Account pages in other tabs reload after session changes so
the rendered account matches the browser's cookies. Data changes drop other tabs'
memory reads for their next visit. Generation tokens and transactional storage
versions prevent late requests from recreating invalidated entries.

## Reads that stay fresh

Cached page data describes the UI; it never authorizes an operation. Session reuse,
sign-in/account selection, WebAuthn challenges, reauthentication, device approval,
verification, and app redirect-policy checks still contact the server when needed.
Login's saved-account chooser remains fresh; its authenticated Account-page display
list is cached. Trusted-browser checks run on initial load or email input changes,
with their existing coalescing/budget, and no longer refetch on window focus.

Passwords, tokens, recovery codes, authenticator setup secrets/QR data, WebAuthn
challenges, and form drafts are excluded from persistence. Mutations always reach
the server; secret-bearing mutation responses are never persisted.

## Verification

`npm run test:cache`, `npm run test:trusted-browser`, and `npm run build`.
The existing SSO suite continues to cover fresh session-reuse decisions and strict
redirect validation. Browser checks cover section navigation, update invalidation,
new-tab persistence, browser refresh, and account switching with real IndexedDB.
