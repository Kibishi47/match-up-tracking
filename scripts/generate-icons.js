import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')
const sourceImage = path.join(publicDir, 'pasted-code.jpg')

async function generate() {
  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Source image not found: ${sourceImage}`)
  }

  console.log(`Generating PWA icons from ${sourceImage}...`)

  // 1. PWA 512x512 PNG
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'))
  console.log('✔ pwa-512x512.png (512x512)')

  // 2. PWA 192x192 PNG
  await sharp(sourceImage)
    .resize(192, 192, {
      fit: 'cover',
      kernel: sharp.kernel.lanczos3
    })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'))
  console.log('✔ pwa-192x192.png (192x192)')

  // 3. Apple Touch Icon 180x180 PNG
  await sharp(sourceImage)
    .resize(180, 180, {
      fit: 'cover',
      kernel: sharp.kernel.lanczos3
    })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  console.log('✔ apple-touch-icon.png (180x180)')

  // 4. PWA Maskable Icon 512x512 PNG
  // Safe zone spec: ~80% inner content centered with background padding
  // Background color sampled from corners of pasted-code.jpg: rgb(6, 9, 14) -> #06090e
  const innerSize = Math.round(512 * 0.8) // 410px
  const innerBuffer = await sharp(sourceImage)
    .resize(innerSize, innerSize, {
      fit: 'cover',
      kernel: sharp.kernel.lanczos3
    })
    .toBuffer()

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 6, g: 9, b: 14, alpha: 1 }
    }
  })
    .composite([
      {
        input: innerBuffer,
        top: Math.round((512 - innerSize) / 2),
        left: Math.round((512 - innerSize) / 2)
      }
    ])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'))
  console.log('✔ maskable-icon-512x512.png (512x512 with safe-zone margin)')

  console.log('All PWA icons generated successfully from pasted-code.jpg!')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
