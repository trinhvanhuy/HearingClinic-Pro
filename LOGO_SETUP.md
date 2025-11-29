# Logo Setup Instructions

## File Locations

Place the two logo files in the following locations:

### For Web App:
```
webapp/public/assets/
  ├── logo-light.png  (Full logo with text on light background)
  └── logo-icon.png   (Icon only on dark background)
```

### For Mobile App:
```
mobile/assets/
  ├── logo-light.png  (Full logo with text on light background)
  └── logo-icon.png   (Icon only on dark background)
```

## Logo Specifications

### logo-light.png
- **Description**: Full logo with "HEARING CLINIC PRO" text
- **Background**: Light/off-white
- **Content**: Red medical cross with white ear outline + dark gray text
- **Recommended size**: 400x120px or higher (2x for retina)
- **Format**: PNG with transparency

### logo-icon.png
- **Description**: Icon only (red cross with black ear outline)
- **Background**: Black
- **Content**: Red medical cross with black ear outline
- **Recommended size**: 512x512px (square, for app icons)
- **Format**: PNG with transparency

## Usage

The logos are automatically used in:

### Web App:
- Login page header
- Sidebar menu header
- Browser favicon (logo-icon.png)

### Mobile App:
- Login screen
- App icon (can be configured in app.json)
- Splash screen (can be configured in app.json)

## After Adding Files

1. **Web App**: Files in `webapp/public/assets/` are automatically available at `/assets/logo-light.png` and `/assets/logo-icon.png`

2. **Mobile App**: Files in `mobile/assets/` are automatically bundled by Expo

3. **Restart dev servers** after adding the files:
   ```bash
   # Web app
   cd webapp && npm run dev
   
   # Mobile app
   cd mobile && npm start
   ```

## Fallback

If logo files are not found, the app will show a fallback SVG logo with the "+" symbols.

