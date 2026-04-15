-- Supabase SQL Editor Script for ZIFA Data Migration
-- Run this completely once in your brand new Supabase project.

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "teamA" TEXT NOT NULL,
  "teamB" TEXT NOT NULL,
  venue TEXT NOT NULL,
  time TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'League',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  team TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  field_fee REAL NOT NULL,
  admin_fee REAL NOT NULL,
  ref_fee REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fixtures (
  id TEXT PRIMARY KEY,
  week TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures DISABLE ROW LEVEL SECURITY;
