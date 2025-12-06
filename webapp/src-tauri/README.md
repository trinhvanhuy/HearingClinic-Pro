# Tauri Configuration

Thư mục này chứa cấu hình Tauri cho desktop app.

## Cấu trúc

- `src/main.rs` - Rust entry point
- `Cargo.toml` - Rust dependencies
- `tauri.conf.json` - Tauri configuration
- `build.rs` - Build script
- `icons/` - App icons

## Tạo Icons

Nếu chưa có icons, bạn có thể:

1. **Tự động generate từ 1 ảnh:**
   ```bash
   cd webapp
   npx tauri icon path/to/your-logo.png
   ```
   Lệnh này sẽ tự động tạo tất cả các kích thước cần thiết.

2. **Hoặc tạo thủ công:**
   - `32x32.png`
   - `128x128.png`
   - `128x128@2x.png`
   - `icon.icns` (macOS)
   - `icon.ico` (Windows)

## Code Signing

Xem file `.env.example` để biết cách setup code signing (optional).

## Build

Xem `DESKTOP-BUILD.md` ở root project để biết hướng dẫn build đầy đủ.

