// lib/supabaseClient.ts
// -------------------------------------------
// Universal Supabase client (Browser & Server)
// -------------------------------------------
import { createClient } from "@supabase/supabase-js"

// Choose key based on runtime (server vs browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// On the server we prefer the Service Role key if it exists.
// In the browser we MUST fall back to the anon key only.
const supabaseKey =
  typeof window === "undefined"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },      // stateless
  global: { fetch },                    // use Next.js/Edge fetch
})