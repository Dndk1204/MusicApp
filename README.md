# 🎵 MusicDB - Modern Music Streaming Platform

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## 📖 Giới thiệu (Introduction)

**MusicDB** là một nền tảng nghe nhạc trực tuyến hiện đại, được phát triển nhằm cung cấp trải nghiệm âm nhạc mượt mà trên đa thiết bị. Dự án tích hợp kho nhạc khổng lồ từ **Jamendo API**, hệ thống quản lý nội dung chặt chẽ với **Supabase**, và đặc biệt là hệ thống xử lý âm thanh chuyên sâu (Audio Engine) sử dụng **Howler.js**.

Dự án được thực hiện trong kỳ thực tập tại **Công ty TNHH Công Nghệ và Truyền Thông Widosoft**.

🔗 **Live Demo:** http://musicvoid.vercel.app/

---

## 🚀 Tính năng chính (Key Features)

### 🎧 Trải nghiệm người dùng (End-User)
- **Nghe nhạc trực tuyến:** Phát nhạc chất lượng cao, xử lý bộ đệm (Caching) thông minh giúp giảm độ trễ.
- **Trình phát nhạc (Smart Player):** Các chức năng điều khiển đầy đủ: Play, Pause, Seek, Shuffle, Loop.
- **Xử lý âm thanh (Audio Equalizer):** - Tùy chỉnh 3 dải tần số: **Bass**, **Mid**, **High** theo thời gian thực.
  - Tích hợp trực tiếp vào luồng âm thanh của Howler.js để thay đổi chất âm.
- **Tìm kiếm & Bộ lọc (Advanced Search):** Tìm kiếm bài hát/nghệ sĩ kết hợp bộ lọc theo thể loại, ngày đăng.
- **Playlist cá nhân:** Tạo danh sách phát, thêm/xóa bài hát yêu thích.
- **Tương tác:** Follow nghệ sĩ, thả tim bài hát.
- **Giao diện Responsive:** Tối ưu hóa hiển thị cho cả Desktop, Tablet và Mobile.

### 🛡️ Quản trị hệ thống (Admin Dashboard)
- **Đồng bộ dữ liệu (Data Sync):** Tự động đồng bộ bài hát từ Jamendo API về Supabase.
- **Upload nhạc:** Tải bài hát mới lên hệ thống (lưu trữ tại Supabase Storage).
- **Quy trình duyệt nhạc (Content Moderation):**
  - Xem danh sách nhạc chờ duyệt (Pending).
  - Nghe thử và quyết định: **Duyệt (Approve)** hoặc **Từ chối (Reject)**.
  - Chỉ nhạc đã duyệt mới hiển thị cho người dùng (Public).
- **Quản lý người dùng:** Phân quyền, khóa/mở khóa tài khoản.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend Framework** | Next.js 13+ (App Router) |
| **Language** | JavaScript |
| **Styling** | Tailwind CSS (Responsive Design) |
| **Backend & Database** | Supabase (Auth, Storage, Realtime) |
| **Audio Core** | **Howler.js** (Audio Sprite, Caching, Cross-browser Support) |
| **Audio Processing** | **Web Audio API** (Custom BiquadFilterNode integration) |
| **API Integration** | Jamendo API v3.0 |
| **Deployment** | Vercel (CI/CD) |

---

## 📸 Hình ảnh minh họa (Screenshots)

### 1. Giao diện Trang chủ & Responsive
*Hệ thống tự động tối ưu hiển thị cho mọi thiết bị.*

| 🖥️ Desktop View | 📱 Mobile View |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/dc3d1c0d-a242-4e3a-9454-9a21aedaaa8a" width="100%"> | <img src="https://github.com/user-attachments/assets/92b528ee-8cc3-4a71-bebe-90a494a8402b" width="100%"> |

### 2. Bộ xử lý âm thanh (Equalizer)
*Tùy chỉnh âm thanh 3 dải tần với hiệu ứng trực quan.*
![Equalizer](link-anh-equalizer-cua-ban.png)

### 3. Giao diện Admin & Duyệt nhạc
*Hệ thống phân quyền và menu quản trị viên.*
![Admin Dashboard](link-anh-admin-menu.png)

---

## ⚙️ Cài đặt và Chạy dự án (Installation)

Để chạy dự án này trên máy cá nhân (Localhost), hãy làm theo các bước sau:

### Bước 1: Clone dự án
```bash
git clone [https://github.com/username-cua-ban/ten-du-an.git](https://github.com/username-cua-ban/ten-du-an.git)
cd ten-du-an
