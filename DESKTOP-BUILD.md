# 🖥️ Hướng Dẫn Build Desktop App - Hearing Clinic Pro

Tài liệu này hướng dẫn cách build ứng dụng desktop **Hearing Clinic Pro** thành file `.exe` (Windows) và `.app` (macOS) sử dụng Tauri.

---

## 📋 Yêu Cầu Hệ Thống

### Windows
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/downloads/) hoặc [Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Node.js 18+ và npm

### macOS
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Xcode Command Line Tools: `xcode-select --install`
- Node.js 18+ và npm

### Linux (để build cho Linux)
- Rust
- Node.js 18+ và npm
- Các dependencies: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

---

## 🚀 Cài Đặt Lần Đầu

### 1. Cài đặt dependencies

```bash
# Từ thư mục root của project
cd webapp
npm install
```

### 2. Cài đặt Rust (nếu chưa có)

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Tải và chạy installer từ https://rustup.rs/
```

### 3. Verify cài đặt

```bash
rustc --version
cargo --version
```

### 4. Tạo App Icons (Quan trọng!)

Tauri cần icons để build. Có 2 cách:

**Cách 1: Tự động generate từ logo (Khuyến nghị)**

```bash
cd webapp
npx tauri icon ../logo.png
```

Lệnh này sẽ tự động tạo tất cả icons cần thiết từ file logo.

**Cách 2: Tạo thủ công**

Đặt các file sau vào `webapp/src-tauri/icons/`:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

**Lưu ý:** Nếu không có icons, build sẽ fail. Hãy tạo icons trước khi build!

---

## 🔨 Build Desktop App

### A. Build Không Ký (Nội Bộ / Testing)

**Chỉ cần 1 lệnh:**

```bash
cd webapp
npm run build:desktop
```

**Output:**
- **Windows**: `src-tauri/target/release/hearing-clinic-pro.exe`
- **macOS**: `src-tauri/target/release/bundle/macos/Hearing Clinic Pro.app`
- **Linux**: `src-tauri/target/release/bundle/appimage/hearing-clinic-pro_1.0.0_amd64.AppImage`

**Thời gian build:** Lần đầu có thể mất 10-20 phút (compile Rust). Các lần sau chỉ mất 1-3 phút.

---

### B. Build Có Ký (Code Signing) - Production

#### macOS Code Signing

**Yêu cầu:**
- Apple Developer Account (paid)
- App-specific password (tạo tại https://appleid.apple.com)

**Các bước:**

1. **Tạo App-Specific Password:**
   - Đăng nhập https://appleid.apple.com
   - Security → App-Specific Passwords
   - Tạo password mới, copy lại

2. **Lấy Team ID:**
   - Đăng nhập https://developer.apple.com/account
   - Membership → Team ID (dạng: `XXXXXXXXXX`)

3. **Set environment variables và build:**

```bash
cd webapp

# Set các biến môi trường
export APPLE_ID="your-email@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="XXXXXXXXXX"

# Build với code signing
npm run build:desktop
```

**Lưu ý:**
- Notarization sẽ tự động chạy sau khi build (có thể mất 5-10 phút)
- Nếu không có certificate, build vẫn thành công nhưng app sẽ không được ký

#### Windows Code Signing

**Yêu cầu:**
- Code signing certificate (`.pfx` file)
- Certificate password

**Các bước:**

1. **Chuẩn bị certificate:**
   - Đặt file `.pfx` vào thư mục `webapp/src-tauri/certs/` (tạo thư mục nếu chưa có)
   - Hoặc đặt ở bất kỳ đâu và dùng đường dẫn tuyệt đối

2. **Set environment variables và build:**

```bash
cd webapp

# Set các biến môi trường
export WIN_CSC_LINK="./certs/yourcert.pfx"  # hoặc đường dẫn tuyệt đối
export WIN_CSC_KEY_PASSWORD="your-certificate-password"

# Build với code signing
npm run build:desktop
```

**Lưu ý:**
- Nếu không set các biến này, build vẫn thành công nhưng app sẽ không được ký
- Certificate phải hợp lệ và chưa hết hạn

---

## 🔄 Cập Nhật Desktop App Sau Khi Sửa Web App

Mỗi khi cập nhật code web app, chỉ cần:

```bash
cd webapp
npm run build:desktop
```

**Quy trình tự động:**
1. Build web app → `dist/`
2. Tauri đóng gói `dist/` thành desktop app
3. Output file `.exe` hoặc `.app` mới

**Không cần:**
- ❌ Xóa cache
- ❌ Reinstall dependencies (trừ khi có thay đổi package.json)
- ❌ Rebuild Rust (Tauri tự động detect changes)

---

## 🛠️ Development Mode (Desktop)

Để chạy desktop app ở chế độ development (hot reload):

```bash
cd webapp
npm run dev:desktop
```

**Tính năng:**
- Hot reload web app
- DevTools tự động mở
- Console logs hiển thị đầy đủ

---

## 📦 Cấu Trúc Project

```
webapp/
├── src/                    # React source code
├── dist/                   # Build output (web app)
├── src-tauri/              # Tauri configuration
│   ├── src/
│   │   └── main.rs         # Rust entry point
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri config
│   ├── build.rs            # Build script
│   ├── icons/              # App icons
│   └── .env.example        # Code signing template
└── package.json            # Node.js dependencies & scripts
```

---

## ⚙️ Scripts Có Sẵn

Trong `webapp/package.json`:

| Script | Mô tả |
|--------|-------|
| `npm run build:web` | Chỉ build web app → `dist/` |
| `npm run build:desktop` | Build web app + đóng gói desktop app |
| `npm run dev:desktop` | Chạy desktop app ở chế độ development |

---

## 🎨 Tùy Chỉnh App

### Thay Đổi App Name / Identifier

Sửa file `webapp/src-tauri/tauri.conf.json`:

```json
{
  "package": {
    "productName": "Hearing Clinic Pro"  // Tên app
  },
  "tauri": {
    "bundle": {
      "identifier": "com.hearingclinicpro.app"  // Bundle identifier
    }
  }
}
```

### Thay Đổi Window Size

Sửa file `webapp/src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "windows": [{
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600
    }]
  }
}
```

### Thêm Icons

1. Tạo các file icon với kích thước:
   - `32x32.png`
   - `128x128.png`
   - `128x128@2x.png`
   - `icon.icns` (macOS)
   - `icon.ico` (Windows)

2. Đặt vào `webapp/src-tauri/icons/`

3. Tauri sẽ tự động sử dụng khi build

---

## 🐛 Troubleshooting

### Lỗi: "Rust not found"

**Giải pháp:**
```bash
# Verify Rust đã cài
rustc --version

# Nếu chưa có, cài Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Lỗi: "Failed to build" (Windows)

**Nguyên nhân:** Thiếu Visual C++ Build Tools

**Giải pháp:**
- Cài [Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Chọn "C++ build tools" workload

### Lỗi: "Code signing failed" (macOS)

**Nguyên nhân:** Thiếu hoặc sai thông tin certificate

**Giải pháp:**
- Kiểm tra `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID` đã set đúng
- Verify App-Specific Password còn hợp lệ
- Kiểm tra Team ID đúng format (10 ký tự)

**Lưu ý:** Nếu chỉ build nội bộ, không cần code signing. Build vẫn thành công.

### Lỗi: "Cannot find dist/"

**Nguyên nhân:** Web app chưa được build

**Giải pháp:**
```bash
cd webapp
npm run build:web  # Build web app trước
npm run build:desktop
```

### Build chậm lần đầu

**Bình thường!** Lần đầu build Rust dependencies mất 10-20 phút. Các lần sau chỉ 1-3 phút.

---

## 📝 Notes

- **Code signing là optional:** App vẫn chạy được nếu không ký, chỉ có cảnh báo khi mở lần đầu
- **Build tự động detect platform:** Chạy trên Windows → ra `.exe`, trên macOS → ra `.app`
- **Cross-compilation:** Có thể build cho platform khác nhưng cần setup phức tạp hơn (không khuyến nghị)

---

## 🔗 Tài Liệu Tham Khảo

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri Configuration](https://tauri.app/v1/api/config/)
- [Code Signing Guide](https://tauri.app/v1/guides/building/sidecar#code-signing)

---

## ✅ Checklist Build Production

- [ ] Đã test app chạy đúng trên target platform
- [ ] Đã set code signing (nếu cần)
- [ ] Đã verify app không có lỗi runtime
- [ ] Đã test trên máy khác (không có dev environment)
- [ ] Đã kiểm tra file output size hợp lý

---

**Happy Building! 🚀**

