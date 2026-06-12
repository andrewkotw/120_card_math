# Supabase Setup

This folder contains the database setup for the v2 online progress feature.

## 1. Run the schema

Open your Supabase project dashboard:

1. Go to **SQL Editor**.
2. Create a new query.
3. Paste everything from `schema.sql`.
4. Click **Run**.

The schema creates:

- `profiles`: public display names for signed-in users.
- `progress`: one saved progress row per user, set, and target.
- Row Level Security policies so users can only edit their own progress.
- A delete policy so users can reset their own progress.
- `get_leaderboard(set_id, limit)`: a safe public leaderboard function.
- `get_global_leaderboard(limit)`: a safe public leaderboard function across all sets.
- `get_player_profile(user_id, limit)`: a safe public player summary for the profile modal.
- Triggers for `updated_at` and automatic profile creation after signup.

## 2. Enable auth

In Supabase:

1. Go to **Authentication > Providers**.
2. Enable **Email**.
3. For classroom use, decide whether to require email confirmation.

For the simplest classroom flow, disable email confirmation during testing.

## 3. Save these project values for the next step

From **Project Settings > API**, copy:

- Project URL
- anon public key

Do not use the service role key in the browser.

## 4. Next frontend step

The app will need:

- Supabase client setup.
- Register/login/logout UI.
- Sync local `progressBySet` to Supabase after login.
- Load online progress after login.
- Render leaderboard from `get_leaderboard`.
- Render clicked-player summaries from `get_player_profile`.
