import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when both env vars are present. The rest of the app checks
// this before rendering anything that needs the database, so a missing
// .env.local shows a clear setup message instead of a blank white page
// (createClient() throws synchronously on a missing/invalid URL, which
// would otherwise crash the app before React ever mounts).
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured ? createClient(url, anonKey) : null
