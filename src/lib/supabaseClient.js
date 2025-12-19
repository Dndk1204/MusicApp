import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const customStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem(key)
    }
    return null
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key)
    }
  },
}
// Kiểm tra lỗi biến môi trường ngay lập tức
if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL hoặc ANON_KEY bị thiếu! Kiểm tra Environment Variables trên Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Dùng sessionStorage để tự động logout khi đóng tab/trình duyệt
    storage: typeof window !== 'undefined' ? window.sessionStorage : null, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})