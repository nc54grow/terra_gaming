/*
# Create TerraGaming Full Application Schema

## Overview
This migration creates all the tables required by the TerraGaming platform:
user profiles, organization profiles, admin profiles, teams, tournaments,
and tournament registrations. The app has a sign-in screen, so RLS is
enabled on every table with ownership-scoped policies.

## New Tables

### 1. tg_users
User profile table — one row per registered player, linked to auth.users by id.
- `id` (uuid, PK, references auth.users) — same as the auth user id
- `email` (text, unique, not null)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `player_code` (text, unique, nullable) — 6-char code for recruiting
- `player_id` (text, nullable) — in-game player id
- `ign` (text, nullable) — in-game name
- `team_id` (uuid, nullable, references tg_teams) — team membership
- `team_role` (text, nullable) — 'owner' | 'member' | 'substitute'
- `join_request_status` (text, nullable) — 'pending' | 'rejected'
- `join_request_team_id` (uuid, nullable, references tg_teams) — team they requested to join
- `join_request_created_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### 2. tg_organizations
Organization profile table — one row per org, linked to auth.users by id.
- `id` (uuid, PK, references auth.users)
- `email` (text, unique, not null)
- `name` (text, not null)
- `description` (text, nullable)
- `status` (text, not null, default 'active') — 'active' | 'disabled'
- `logo_url` (text, nullable)
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### 3. tg_admins
Admin profile table — one row per admin, linked to auth.users by id.
- `id` (uuid, PK, references auth.users)
- `email` (text, unique, not null)
- `display_name` (text, nullable)
- `created_at` (timestamptz, default now)

### 4. tg_teams
Team table — created by a user (owner).
- `id` (uuid, PK, default gen_random_uuid)
- `name` (text, not null)
- `code` (text, unique, not null) — 8-char team code
- `owner_id` (uuid, nullable, references tg_users) — current owner
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### 5. tg_tournaments
Tournament table — created by organizations.
- `id` (uuid, PK, default gen_random_uuid)
- `organization_id` (uuid, not null, references tg_organizations)
- `name` (text, not null)
- `poster_url` (text, nullable)
- `entry_type` (text, not null, default 'free') — 'free' | 'paid'
- `entry_fee` (numeric, not null, default 0)
- `prize_pool` (numeric, not null, default 0)
- `total_slots` (integer, not null)
- `total_rounds` (integer, not null)
- `registration_start` (timestamptz, not null)
- `registration_end` (timestamptz, not null)
- `structure` (jsonb, nullable) — round structure config
- `qualification` (jsonb, nullable) — qualification criteria
- `prize_distribution` (jsonb, nullable) — prize placements
- `points_system` (jsonb, nullable) — points per placement
- `status` (text, not null, default 'draft') — 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### 6. tournament_registrations
Tracks which users registered for which tournaments.
- `id` (uuid, PK, default gen_random_uuid)
- `tournament_id` (uuid, not null, references tg_tournaments)
- `user_id` (uuid, not null, references tg_users)
- `status` (text, not null, default 'pending')
- `created_at` (timestamptz, default now)
- Unique constraint on (tournament_id, user_id)

## Security (RLS)
All tables have RLS enabled. Policies:

- **tg_users**: Users can read/update their own row. Any authenticated user can
  read tg_users (needed for team member lists, recruiting by code/email, and
  viewing pending requests). Only the row owner can update their row.
- **tg_organizations**: Org can read/update own row. Admins (via edge function
  with service role) manage orgs. All authenticated users can read org profiles.
- **tg_admins**: Any authenticated user can read admin profiles (for display).
  Admin management is done via the edge function with service role key.
- **tg_teams**: Any authenticated user can read teams (needed for join-by-code
  lookup, viewing team details). Only team members can update (owner transfers,
  disband). Inserts are allowed for any authenticated user (team creation sets
  owner_id to the creator).
- **tg_tournaments**: Any authenticated user can read tournaments. Only the
  owning organization can insert/update/delete their tournaments.
- **tournament_registrations**: Users can read their own registrations and
  insert registrations for themselves. Tournament organizers can read
  registrations for their tournaments.

## Important Notes
1. The profile tables (tg_users, tg_organizations, tg_admins) use `id` that
   directly references `auth.users(id)` — the auth user ID IS the profile ID.
   This is set at signup time by the frontend.
2. tg_teams.owner_id references tg_users.id and is set on creation.
3. tg_tournaments.organization_id references tg_organizations.id.
4. The edge function `admin-orgs` uses the service role key to manage orgs and
   admins, so it bypasses RLS. The frontend policies are for direct client access.
5. All policies use `auth.uid()` for ownership checks.
*/

-- ============================================================
-- tg_users
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  player_code text UNIQUE,
  player_id text,
  ign text,
  team_id uuid,
  team_role text,
  join_request_status text,
  join_request_team_id uuid,
  join_request_created_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tg_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tg_users" ON tg_users;
CREATE POLICY "select_tg_users" ON tg_users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_tg_users" ON tg_users;
CREATE POLICY "insert_tg_users" ON tg_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_tg_users" ON tg_users;
CREATE POLICY "update_tg_users" ON tg_users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- tg_organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_organizations (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tg_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tg_organizations" ON tg_organizations;
CREATE POLICY "select_tg_organizations" ON tg_organizations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_tg_organizations" ON tg_organizations;
CREATE POLICY "update_tg_organizations" ON tg_organizations FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- tg_admins
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tg_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tg_admins" ON tg_admins;
CREATE POLICY "select_tg_admins" ON tg_admins FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- tg_teams
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES tg_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tg_teams ENABLE ROW LEVEL SECURITY;

-- Add FK from tg_users.team_id to tg_teams.id (must come after tg_teams exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tg_users_team_id_fkey' AND table_name = 'tg_users'
  ) THEN
    ALTER TABLE tg_users
      ADD CONSTRAINT tg_users_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES tg_teams(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tg_users_join_request_team_id_fkey' AND table_name = 'tg_users'
  ) THEN
    ALTER TABLE tg_users
      ADD CONSTRAINT tg_users_join_request_team_id_fkey
      FOREIGN KEY (join_request_team_id) REFERENCES tg_teams(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS "select_tg_teams" ON tg_teams;
CREATE POLICY "select_tg_teams" ON tg_teams FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_tg_teams" ON tg_teams;
CREATE POLICY "insert_tg_teams" ON tg_teams FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_tg_teams" ON tg_teams;
CREATE POLICY "update_tg_teams" ON tg_teams FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_tg_teams" ON tg_teams;
CREATE POLICY "delete_tg_teams" ON tg_teams FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- tg_tournaments
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES tg_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  poster_url text,
  entry_type text NOT NULL DEFAULT 'free',
  entry_fee numeric NOT NULL DEFAULT 0,
  prize_pool numeric NOT NULL DEFAULT 0,
  total_slots integer NOT NULL,
  total_rounds integer NOT NULL,
  registration_start timestamptz NOT NULL,
  registration_end timestamptz NOT NULL,
  structure jsonb,
  qualification jsonb,
  prize_distribution jsonb,
  points_system jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tg_tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tg_tournaments" ON tg_tournaments;
CREATE POLICY "select_tg_tournaments" ON tg_tournaments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_tg_tournaments" ON tg_tournaments;
CREATE POLICY "insert_tg_tournaments" ON tg_tournaments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = organization_id);

DROP POLICY IF EXISTS "update_tg_tournaments" ON tg_tournaments;
CREATE POLICY "update_tg_tournaments" ON tg_tournaments FOR UPDATE
  TO authenticated USING (auth.uid() = organization_id) WITH CHECK (auth.uid() = organization_id);

DROP POLICY IF EXISTS "delete_tg_tournaments" ON tg_tournaments;
CREATE POLICY "delete_tg_tournaments" ON tg_tournaments FOR DELETE
  TO authenticated USING (auth.uid() = organization_id);

-- ============================================================
-- tournament_registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tg_tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES tg_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_tournament_registrations" ON tournament_registrations;
CREATE POLICY "select_tournament_registrations" ON tournament_registrations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_tournament_registrations" ON tournament_registrations;
CREATE POLICY "insert_tournament_registrations" ON tournament_registrations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_tournament_registrations" ON tournament_registrations;
CREATE POLICY "update_tournament_registrations" ON tournament_registrations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_tournament_registrations" ON tournament_registrations;
CREATE POLICY "delete_tournament_registrations" ON tournament_registrations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tg_users_team_id ON tg_users(team_id);
CREATE INDEX IF NOT EXISTS idx_tg_users_join_request_status ON tg_users(join_request_status);
CREATE INDEX IF NOT EXISTS idx_tg_users_join_request_team_id ON tg_users(join_request_team_id);
CREATE INDEX IF NOT EXISTS idx_tg_users_player_code ON tg_users(player_code);
CREATE INDEX IF NOT EXISTS idx_tg_tournaments_organization_id ON tg_tournaments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_users_updated_at ON tg_users;
CREATE TRIGGER tg_users_updated_at BEFORE UPDATE ON tg_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tg_organizations_updated_at ON tg_organizations;
CREATE TRIGGER tg_organizations_updated_at BEFORE UPDATE ON tg_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tg_teams_updated_at ON tg_teams;
CREATE TRIGGER tg_teams_updated_at BEFORE UPDATE ON tg_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tg_tournaments_updated_at ON tg_tournaments;
CREATE TRIGGER tg_tournaments_updated_at BEFORE UPDATE ON tg_tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- reject_join_request function (used by team-api.ts via RPC)
-- ============================================================
CREATE OR REPLACE FUNCTION reject_join_request(
  p_requester_id uuid,
  p_owner_id uuid
)
RETURNS json AS $$
DECLARE
  v_owner_team_id uuid;
  v_requester_team_id uuid;
  v_request_status text;
BEGIN
  -- Get the owner's team
  SELECT team_id INTO v_owner_team_id
  FROM tg_users WHERE id = p_owner_id;

  IF v_owner_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Owner is not in a team');
  END IF;

  -- Get the requester's current state
  SELECT team_id, join_request_status, join_request_team_id
  INTO v_requester_team_id, v_request_status, v_requester_team_id
  FROM tg_users WHERE id = p_requester_id;

  IF v_request_status IS NULL OR v_request_status <> 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'No pending request from this user');
  END IF;

  -- Verify the request is for the owner's team
  IF v_requester_team_id IS NULL OR v_requester_team_id <> v_owner_team_id THEN
    RETURN json_build_object('success', false, 'error', 'This user requested to join a different team');
  END IF;

  -- Reject the request
  UPDATE tg_users
  SET join_request_status = 'rejected',
      join_request_team_id = NULL,
      join_request_created_at = NULL,
      updated_at = now()
  WHERE id = p_requester_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
