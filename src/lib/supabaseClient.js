import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Dùng sessionStorage để tự động logout khi đóng tab/trình duyệt
    storage: typeof window !== 'undefined' ? window.sessionStorage : null, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})