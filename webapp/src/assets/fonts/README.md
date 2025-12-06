# Font Files for PDF Generation

## Noto Sans Fonts

This directory should contain Noto Sans font files for Vietnamese language support in PDF generation.

### Required Font Files

1. **NotoSans-Regular.ttf** - Regular weight (400)
2. **NotoSans-Bold.ttf** - Bold weight (700)

### How to Download

You can download Noto Sans fonts from:

1. **Google Fonts** (Recommended):
   - Visit: https://fonts.google.com/noto/specimen/Noto+Sans
   - Click "Download family"
   - Extract the TTF files

2. **Direct Download**:
   - Regular: https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf
   - Bold: https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf

### Current Implementation

Currently, the PDF generation uses Google Fonts CDN for Noto Sans, which ensures fonts are always available without requiring local files.

If you want to use local font files instead:

1. Place the TTF files in this directory
2. Update `webapp/src/utils/fontLoader.ts` to use `generateNotoSansFontFaceBase64()` with base64-encoded fonts
3. Convert TTF files to base64 at build time

### Font Features

- **Full Vietnamese Unicode Support**: Supports all Vietnamese diacritics (ă, â, đ, ê, ô, ơ, ư, etc.)
- **Regular (400)**: For body text, labels, values
- **Bold (700)**: For headings, titles, emphasized text
