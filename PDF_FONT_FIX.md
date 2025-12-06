# PDF Font Fix - Vietnamese Support

## 1. Thư viện PDF đang dùng

**Playwright** (HTML → PDF)

- **File chính**: `backend/src/routes/pdfExport.js`
- **Flow**: React Component → HTML (renderToHtml.tsx) → Playwright → PDF
- **Không dùng**: @react-pdf/renderer, jsPDF, pdf-lib

## 2. Font đã chọn

**Noto Sans** từ Google Fonts CDN

- **Regular (400)**: Cho body text, labels, values
- **Bold (700)**: Cho headings, titles, emphasized text
- **Hỗ trợ đầy đủ**: Tất cả ký tự tiếng Việt (ă, â, đ, ê, ô, ơ, ư, và các dấu)

## 3. Cách đăng ký font

### 3.1. Font Loader Utility (`webapp/src/utils/fontLoader.ts`)

Tạo utility để generate @font-face CSS:

```typescript
generateNotoSansFontFace() // Sử dụng Google Fonts CDN
```

### 3.2. Embed vào HTML (`webapp/src/utils/renderToHtml.tsx`)

Font được embed vào HTML trước khi gửi đến Playwright:

```typescript
const notoSansFontFace = generateNotoSansFontFace()
// Embed vào <style> tag trong HTML
```

### 3.3. CSS Styles (`webapp/src/styles/print.css`)

- Import Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');`
- Set font-family: `font-family: 'Noto Sans', ...`
- Dùng `font-weight: 700` cho bold (không fake bold)

## 4. Áp dụng font cho tất cả text

### 4.1. Heading chính (Tiêu đề lớn)
- **Class**: `.report-title`
- **Font**: Noto Sans Bold (700)
- **Size**: 20pt

### 4.2. Sub heading / Label phần
- **Class**: `.section-title`, `.clinic-name`
- **Font**: Noto Sans Bold (700)
- **Size**: 14pt

### 4.3. Nội dung bảng / Text thường
- **Class**: `.info-value`, `.data-table td`
- **Font**: Noto Sans Regular (400)
- **Size**: 8-10pt

### 4.4. Labels trong bảng
- **Class**: `.info-label`, `.data-table th`, `.ear-label`
- **Font**: Noto Sans Bold (700) hoặc Semi-bold (600)
- **Size**: 8pt

## 5. Sửa lỗi chữ bị đậm quá / giật

### 5.1. Thay `font-weight: bold` → `font-weight: 700`
- Dùng font bold thật, không fake bold
- Tất cả các chỗ dùng `font-weight: bold` đã được thay thành `700`

### 5.2. Không có transform/scale gây méo
- Đã kiểm tra, không có transform gây méo chữ
- Font rendering được tối ưu với `text-rendering: optimizeLegibility`

### 5.3. Playwright font loading
- Đợi `networkidle` để font từ Google Fonts load xong
- Thêm wait time 3000ms + 1000ms để đảm bảo font render
- Verify font đã load bằng cách check computed style

## 6. Đảm bảo UTF-8

- ✅ HTML có `<meta charset="UTF-8">`
- ✅ CSS có `@charset "UTF-8";`
- ✅ HTML có `lang="${language}"` attribute
- ✅ Không convert text sang ANSI
- ✅ Playwright context có `locale: 'vi-VN'`

## 7. Files đã chỉnh sửa

### Backend
1. **`backend/src/routes/pdfExport.js`**
   - Thêm locale vi-VN
   - Đợi font load với `networkidle`
   - Force font rendering với Noto Sans
   - Verify font đã load

### Frontend
2. **`webapp/src/utils/fontLoader.ts`** (NEW)
   - Utility để generate @font-face CSS
   - Hỗ trợ Google Fonts CDN và base64

3. **`webapp/src/utils/renderToHtml.tsx`**
   - Import và sử dụng fontLoader
   - Embed Noto Sans font face vào HTML
   - Set font-family với Noto Sans là primary

4. **`webapp/src/styles/print.css`**
   - Import Google Fonts
   - Thay tất cả font-family để Noto Sans là primary
   - Thay `font-weight: bold` → `font-weight: 700`
   - Thêm `font-family: 'Noto Sans'` cho các heading/bold elements

5. **`webapp/src/components/PrintableHearingReport.tsx`**
   - Đã có sẵn, không cần sửa (dùng CSS từ print.css)

## 8. Kết quả

Sau khi sửa, PDF sẽ hiển thị:

✅ **"Đánh giá Mất thính lực"** - Rõ ràng, đúng dấu, không vỡ font
✅ **"Thông tin Bệnh nhân"** - Bold đẹp, không giật
✅ **"Khả năng nghe bình thường"** - Đúng dấu
✅ **"Mất thính lực nhẹ/vừa/nặng/sâu"** - Tất cả ký tự tiếng Việt hiển thị đúng

## 9. Test

Để test, generate một PDF report và kiểm tra:
1. Tất cả text tiếng Việt hiển thị đúng dấu
2. Bold text không bị giật hoặc đậm quá
3. Font mượt mà, không có pixelation
4. Kích thước font phù hợp (heading lớn, body nhỏ)

## 10. Lưu ý

- Font được load từ Google Fonts CDN (không cần file local)
- Nếu muốn dùng font local, cần convert TTF sang base64 và update `fontLoader.ts`
- Playwright cần internet để load font từ Google Fonts
- Nếu backend chạy offline, cần embed font vào HTML dưới dạng base64
