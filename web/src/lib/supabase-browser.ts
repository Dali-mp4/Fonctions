"use client";
import { createBrowserClient } from "@supabase/ssr";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const authConfigured = Boolean(url && key);
export function browserSupabase() {
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
