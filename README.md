# 120 Card Math

A static HTML/CSS/JavaScript math card puzzle game for targets `1` to `120`.

Students use 6 poker-card values and math symbols to build expressions that equal the current target.

## Version 2.0 Features

- Supabase email/password login.
- Guest mode still works with local progress.
- Signed-in users sync progress across devices.
- Progress merge keeps the best result:
  - higher score wins
  - then better status
  - then shorter token length
- Online leaderboard drawer on the right side.
- Click a leaderboard player to see their public score profile and completed sets.
- Leaderboard tabs:
  - current set score
  - global score across every set
- Top account pill opens the login/logout modal.
- Score is shown in the top center.

## Game Rules

- A card always counts as one token, including `10`.
- A symbol or parenthesis counts as one token.
- Example: `K - 9` and `10 - 6` both have token length `3`.
- Reusing math symbols is allowed.
- Example: `K + J + A` is valid.

## Scoring

Each target keeps the player's best score.

- shortest token length: `+100`
- one token longer: `+90`
- two tokens longer: `+80`
- continues down by 10 points per extra token
- minimum score is `0`

Replaying the same target cannot lower an existing score.

## Supabase Setup

The Supabase database setup lives in:

```text
supabase/schema.sql
```

Run it in:

```text
Supabase Dashboard > SQL Editor
```

The schema creates:

- `profiles`
- `progress`
- Row Level Security policies
- account profile trigger
- progress `updated_at` triggers
- `get_leaderboard(set_id, limit)`
- `get_global_leaderboard(limit)`
- `get_player_profile(user_id, limit)`

Project notes are stored in:

```text
supabase/project-settings.md
```

The frontend uses the Supabase publishable key in `game.js`.
Do not put secret keys, service role keys, database passwords, or direct connection strings in browser code.

## Local Development

Use a static file server on port `8020`, because Supabase Auth is configured for this local URL.

Recommended URL:

```text
http://localhost:8020
```

Allowed local URLs in Supabase Auth settings:

```text
http://localhost:8020
http://localhost:8020/
http://127.0.0.1:8020
http://127.0.0.1:8020/
```

Any static server is fine. For example:

```bash
python -m http.server 8020
```

If Python is not installed, use VS Code Live Server or another static server and keep the port set to `8020`.

## Files

- `index.html`: app layout and drawers/modals
- `style.css`: visual design and responsive layout
- `game.js`: game state, solver, scoring, Supabase sync, auth, leaderboard, player profile modal
- `first 100`: built-in puzzle sets
- `supabase/schema.sql`: database schema and leaderboard functions
- `supabase/project-settings.md`: project URL, public key, local ports, setup notes

## Deployment

This app can still be hosted as static files.

If deployed to GitHub Pages or another public host, add the production URL to:

```text
Supabase Dashboard > Authentication > URL Configuration
```

Then include it in the redirect URL allow list.
