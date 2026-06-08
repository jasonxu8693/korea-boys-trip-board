# Korea Boys Trip Board

This repo hosts the Korea boys trip planning board on GitHub Pages.

## Files

- `index.html` is the board
- `.nojekyll` tells GitHub Pages to serve the static HTML directly
- `apps-script/Code.gs` is the optional Google Sheets sync backend

## GitHub Pages setup

1. Create a new GitHub repository, for example `korea-boys-trip-board`
2. Upload `index.html` and `.nojekyll` to the repository root
3. Go to Settings → Pages
4. Set Source to `Deploy from a branch`
5. Choose `main` and `/root`
6. Wait a few minutes, then open the published GitHub Pages URL

## Google Sheets sync setup

GitHub Pages can host the board, but it cannot save votes by itself. To save live votes, use the Google Apps Script file in `apps-script/Code.gs`.

1. Create a new Google Sheet called `Korea Boys Trip Board Sync`
2. Go to Extensions → Apps Script
3. Paste the contents of `apps-script/Code.gs`
4. Run `setup` once and authorise it
5. Click Deploy → New deployment → Web app
6. Set `Execute as` to `Me`
7. Set `Who has access` to `Anyone`
8. Copy the Web App URL ending in `/exec`
9. Open `index.html`, find `const REMOTE_API_URL = "";`, and paste the URL between the quotes
10. Upload the updated `index.html` back to GitHub

After that, everyone should use the GitHub Pages URL, not the raw HTML file.

## Important limitations

This is a lightweight group trip sync, not a full application backend. It saves the whole board state to one Google Sheet row. It is fine for a seven person trip, but if two people click at exactly the same time, the latest save may win.
