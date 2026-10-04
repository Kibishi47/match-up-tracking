import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')

// SVG with dark container, subtle glow and the signature Metadex cards
function createIconSvg({ size, innerPaddingPercent = 0.15, hasBackground = true }) {
  const pad = size * innerPaddingPercent
  const innerSize = size - pad * 2
  
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b132b" />
        <stop offset="50%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="cardFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <linearGradient id="cardBack" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
      <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
      </radialGradient>
    </defs>

    ${hasBackground ? `
      <!-- Background squircle/rect for standalone and apple-touch-icon -->
      <rect width="${size}" height="${size}" fill="url(#bgGrad)" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="url(#emeraldGlow)" />
    ` : ''}

    <!-- Metadex Cards Container -->
    <g transform="translate(${pad}, ${pad}) scale(${innerSize / 48})" filter="url(#cardShadow)">
      <!-- Back card -->
      <rect x="18" y="6" width="22" height="32" rx="4" transform="rotate(12 29 22)" fill="url(#cardBack)" stroke="#334155" stroke-width="1.5" />
      
      <!-- Front card with checkmark -->
      <rect x="8" y="10" width="22" height="32" rx="4" transform="rotate(-8 19 26)" fill="url(#cardFront)" stroke="#6ee7b7" stroke-width="1.2" />
      <path d="M13 22L17 28L23 20" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-8 19 26)" />
    </g>
  </svg>
  `
}

async function generate() {
  console.log('Generating PWA icons...')

  // 1. Apple Touch Icon (180x180) - Solid dark background with safe padding
  const appleSvg = createIconSvg({ size: 180, innerPaddingPercent: 0.16, hasBackground: true })
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('✔ apple-touch-icon.png (180x180)')

  // 2. PWA 192x192
  const pwa192Svg = createIconSvg({ size: 192, innerPaddingPercent: 0.14, hasBackground: true })
  await sharp(Buffer.from(pwa192Svg))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'))
  console.log('✔ pwa-192x192.png (192x192)')

  // 3. PWA 512x512
  const pwa512Svg = createIconSvg({ size: 512, innerPaddingPercent: 0.14, hasBackground: true })
  await sharp(Buffer.from(pwa512Svg))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'))
  console.log('✔ pwa-512x512.png (512x512)')

  // 4. PWA Maskable 512x512 (Safe-zone: 20% outer margin so nothing gets clipped by round/squircle system masks)
  const maskableSvg = createIconSvg({ size: 512, innerPaddingPercent: 0.22, hasBackground: true })
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'))
  console.log('✔ maskable-icon-512x512.png (512x512)')

  console.log('All PWA icons generated successfully!')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
