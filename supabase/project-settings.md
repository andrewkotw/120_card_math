# Supabase Project Settings

Use this note to remember the v2 online-progress setup.

## Project

- Project ID: `wxivlrityyvoihisckna`
- Project URL: `https://wxivlrityyvoihisckna.supabase.co`
- Region: `ap-southeast-1` / Southeast Asia (Singapore)

## Frontend Key

This key is safe to use in browser code because it is a publishable key and the database uses Row Level Security.

```js
const SUPABASE_URL = "https://wxivlrityyvoihisckna.supabase.co";
const SUPABASE_KEY = "sb_publishable_T0td0td1Hu9KS8MKMjkZpQ_K8gu0PjW";
```

Never put these in frontend code:

- `sb_secret_...`
- `service_role`
- database password
- direct database connection string

## Local Development URL

Use port `8020` for local testing.

```bash
python -m http.server 8020
```

Open:

```text
http://localhost:8020
```

Also acceptable:

```text
http://127.0.0.1:8020
```

## Supabase Auth URL Configuration

In Supabase:

**Authentication > URL Configuration**

Site URL:

```text
http://localhost:8020
```

Redirect URLs:

```text
http://localhost:8020
http://localhost:8020/
http://127.0.0.1:8020
http://127.0.0.1:8020/
```

If the app is deployed later, add the production URL here too.

## Auth Provider

In Supabase:

**Authentication > Providers > Email**

Recommended current setup:

- Email provider: enabled
- Confirm email: disabled for classroom/local testing

If email confirmation is enabled later, users must verify email before login is fully usable.

## Database

Schema file:

```text
supabase/schema.sql
```

Run it in:

**Supabase Dashboard > SQL Editor**

It creates:

- `public.profiles`
- `public.progress`
- Row Level Security policies
- delete permission for a signed-in user to reset their own progress
- automatic profile creation trigger
- `updated_at` triggers
- `public.get_leaderboard(set_id, limit)`
- `public.get_global_leaderboard(limit)`
- `public.get_player_profile(user_id, limit)`

## Expected Tables

`profiles`

- `id`
- `display_name`
- `created_at`
- `updated_at`

`progress`

- `user_id`
- `set_id`
- `target`
- `status`
- `score`
- `expression`
- `token_length`
- `best_length`
- `symbols`
- `cards`
- `attempts`
- `hint_level`
- `revealed`
- `created_at`
- `updated_at`

`progress` uses this primary key:

```text
user_id + set_id + target
```

That means each user has one saved row per puzzle target.

## Leaderboard Function

Function:

```sql
public.get_leaderboard(p_set_id text, p_limit integer default 20)
```

Frontend will call it with the current set ID, for example:

```js
supabase.rpc("get_leaderboard", {
  p_set_id: "easy-001",
  p_limit: 20,
});
```

Global leaderboard across every set:

```js
supabase.rpc("get_global_leaderboard", {
  p_limit: 20,
});
```

Clicked-player summary for the middle profile modal:

```js
supabase.rpc("get_player_profile", {
  p_user_id: userId,
  p_limit: 30,
});
```

## Next Coding Step

Frontend integration uses:

- Supabase browser SDK loaded from jsDelivr.
- `SUPABASE_URL` and `SUPABASE_KEY` in `game.js`.
- register/login/logout UI in the drawer.
- localStorage-first progress with Supabase sync after login.
- `get_leaderboard` for the drawer leaderboard.
- `get_player_profile` for the clicked-player profile modal.
