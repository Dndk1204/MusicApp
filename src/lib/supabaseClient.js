import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Kiểm tra lỗi biến môi trường ngay lập tức
if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL hoặc ANON_KEY bị thiếu! Kiểm tra Environment Variables trên Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Để mặc định (LocalStorage), Supabase sẽ tự xử lý tốt nhất
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Đảm bảo cấu hình Realtime được kích hoạt
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})