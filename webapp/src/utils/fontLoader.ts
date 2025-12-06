/**
 * Font loader utility for PDF generation
 * Embeds Noto Sans fonts (Regular and Bold) as base64 for PDF generation
 */

/**
 * Convert font file to base64 data URL
 * This should be called at build time or with font files in public folder
 */
export async function loadFontAsBase64(fontPath: string): Promise<string> {
  try {
    const response = await fetch(fontPath)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn(`Failed to load font from ${fontPath}:`, error)
    // Fallback: return empty string, will use system fonts
    return ''
  }
}

/**
 * Generate @font-face CSS for Noto Sans fonts
 * Fonts should be placed in public/fonts/ or src/assets/fonts/
 * 
 * For production, fonts should be pre-converted to base64 and embedded
 * For development, can use relative paths
 */
export function generateNotoSansFontFace(): string {
  // Use Google Fonts CDN for Noto Sans (supports Vietnamese)
  // This ensures fonts are always available and properly loaded
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
    
    /* Fallback: If Google Fonts fails, use system fonts */
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Noto Sans'), local('NotoSans-Regular'),
           url('https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff2') format('woff2'),
           url('https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff') format('woff');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
    }
    
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: local('Noto Sans Bold'), local('NotoSans-Bold'),
           url('https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff2') format('woff2'),
           url('https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNb4j5Ba_2c7A.woff') format('woff');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
    }
  `
}

/**
 * Generate inline @font-face with base64 embedded fonts
 * Use this when fonts are already converted to base64
 */
export function generateNotoSansFontFaceBase64(
  regularBase64: string,
  boldBase64: string
): string {
  if (!regularBase64 || !boldBase64) {
    // Fallback to Google Fonts if base64 not available
    return generateNotoSansFontFace()
  }
  
  return `
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('${regularBase64}') format('truetype');
    }
    
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('${boldBase64}') format('truetype');
    }
  `
}
