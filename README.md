# Korea Boys Trip Board

Live board: https://jasonxu8693.github.io/korea-boys-trip-board/

`index.html` is the canonical single-page app with inline CSS/JavaScript. `images/` contains the existing image assets. There is no build step. GitHub Pages serves `main` at the repository root; `.nojekyll` disables Jekyll processing. The old `korea-idol-quest-board.html` redirects to the current board.

## Current sync

The board uses Supabase REST, not the historical Google Apps Script backend. `apps-script/` is archived reference and must not be deployed as a second writer.

Writes use a three-way merge against the last read base, then a conditional PATCH matching `updated_at`. A zero-row response means another writer won the race: read again and retry. Same-field conflicts require a user choice. Pending changes and their base are saved in a local outbox and retried on reconnect. Per-device identity and personal packing stay local.

All crew members should reload after this update. Old open tabs still contain the old unconditional writer; client-side improvements cannot constrain those clients. A timestamp-updating database trigger is required for conditional writes.

## Access-control limitation

Choosing a name is attribution, not authentication. The existing public Supabase configuration is unchanged. Do not put door codes, ticket references, passport details, credentials or private insurance information on this public board. Proper protection requires authenticated membership policies and an atomic write endpoint enforced in the backend; this cannot be implemented securely using a public key alone.

## Content updates

Existing saved plans receive the idempotent `koreaReviewV11` migration. Timetable edits match the old day/title/time so a traveller's custom retiming is preserved. Default food options merge by stable id while retaining votes. Never clear the live board to make defaults appear.

The trip overview lists unresolved logistics. Shortlist evidence is distinct from availability and booking confirmation. The downloadable text pack is a dated local snapshot, not an offline cached version of the interactive site.

## Validation

Run `node tests/regression.cjs` (no packages required). It uses synthetic state and mocked network responses; it never writes to the live backend. It covers merge conflicts, failed saves, missed polling updates, migrations, URL/time validation and offline export content.

Before deployment, inspect all four sections at 375, 768 and 1440 px, check the published version, and retain the group's existing state. Desktop browser emulation is not certification of every iOS/Android browser.
