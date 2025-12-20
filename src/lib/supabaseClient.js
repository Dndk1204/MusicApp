import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 1. Kiểm tra biến môi trường (Giữ từ Code 1)
if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL hoặc ANON_KEY bị thiếu! Kiểm tra Environment Variables.");
}

// 2. Khởi tạo Supabase Client (Sử dụng sessionStorage như Code 2)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Dùng sessionStorage để tự động logout khi đóng tab/trình duyệt
    storage: typeof window !== 'undefined' ? window.sessionStorage : null, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// 3. Gán vào window để debug nếu cần (Giữ từ Code 1)
if (typeof window !== 'undefined') {
    window.supabase = supabase;
}