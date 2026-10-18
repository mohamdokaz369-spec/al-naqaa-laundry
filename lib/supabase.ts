"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client backed by @supabase/ssr. Unlike the previous plain
// @supabase/supabase-js client, this stores the auth session in cookies
// (not just localStorage), which is what lets middleware.ts and
// lib/supabase-server.ts read the same session on the server to enforce
// route protection and RLS-backed data access. Still safe to use the
// anon key here — authorization is enforced by Postgres RLS policies
// (see supabase/migrations), not by anything in this file.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
