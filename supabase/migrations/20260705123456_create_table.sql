/*
# TerraGaming Command Center Schema

## Overview
Creates three role-based tables mirroring the Firebase architecture: `tg_users`, `tg_organizations`, and `tg_admins`.
Each table uses the Supabase auth user ID as its primary key, so a single auth account maps to exactly one role record.

## New Tables

### tg_users
- `id` (uuid, PK, references auth.users) — the registered user's auth ID
- `email` (text, unique, not null) — denormalized for quick lookups
- `display_name` (text) — optional display name
- `avatar_url` (text) — optional avatar image URL
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### tg_organizations
- `id` (uuid, PK, references auth.users) — the org account's auth ID
- `email` (text, unique, not null) — org login email
- `name` (text, not null) — organization display name
- `description` (text) — optional org description
- `status` (text, default 'active') — 'active' | 'disabled'
- `logo_url` (text) — optional logo URL
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### tg_admins
- `id` (uuid, PK, references auth.users) — the admin's auth ID
- `email` (text, unique, not null) — admin login email
- `display_name` (text) — optional display name
- `created_at` (timestamptz, default now())

## Security (RLS)

All three tables have RLS enabled. Policies:
- **tg_users**: users can read/update only their own row; self-insert on signup.
- **tg_organizations**: orgs can read/update their own row; admins (via service role on server) manage CRUD. Self-insert blocked — orgs are admin-created only.
- **tg_admins**: admins can read all admin rows; self-insert blocked — first admin created manually, rest managed via admin dashboard.

## Important Notes
1. Organizations CANNOT self-register — no INSERT policy for `auth.uid() = id` on tg_organizations. Org records are created via the admin dashboard using the service role key (server-side).
2. The first admin must be created manually in Supabase Dashboard (auth.users + tg_admins row).
3. Role resolution: the app checks all three tables for the current user's auth.uid() and returns the canonical role.
*/

-- ============================================================
-- tg_users table
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tg_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tg_users" ON tg_users;
CREATE POLICY "select_own_tg_users" ON tg_users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_tg_users" ON tg_users;
CREATE POLICY "insert_own_tg_users" ON tg_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_tg_users" ON tg_users;
CREATE POLICY "update_own_tg_users" ON tg_users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- tg_organizations table
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_organizations (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tg_organizations ENABLE ROW LEVEL SECURITY;

-- Orgs can read their own row (so they can see their profile after login)
DROP POLICY IF EXISTS "select_own_tg_organizations" ON tg_organizations;
CREATE POLICY "select_own_tg_organizations" ON tg_organizations FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Orgs can update their own row (profile edits)
DROP POLICY IF EXISTS "update_own_tg_organizations" ON tg_organizations;
CREATE POLICY "update_own_tg_organizations" ON tg_organizations FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- NOTE: No INSERT or DELETE policies for authenticated users.
-- Organization CRUD is handled server-side via the service role key (admin dashboard).

-- ============================================================
-- tg_admins table
-- ============================================================
CREATE TABLE IF NOT EXISTS tg_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tg_admins ENABLE ROW LEVEL SECURITY;

-- Admins can read all admin rows (so they can see the admin list)
DROP POLICY IF EXISTS "select_tg_admins" ON tg_admins;
CREATE POLICY "select_tg_admins" ON tg_admins FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- NOTE: No INSERT/UPDATE/DELETE policies for authenticated users.
-- Admin management is handled server-side via the service role key.

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tg_users_email ON tg_users(email);
CREATE INDEX IF NOT EXISTS idx_tg_organizations_email ON tg_organizations(email);
CREATE INDEX IF NOT EXISTS idx_tg_organizations_status ON tg_organizations(status);
CREATE INDEX IF NOT EXISTS idx_tg_admins_email ON tg_admins(email);