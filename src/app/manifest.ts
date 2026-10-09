import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'نقاب | بازی مافیا با دوستان',
    short_name: 'نقاب',
    description: 'نقش مخفی، شب و روز، رأی‌گیری و گزارش بازی مافیا روی گوشی همه',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#05101e',
    theme_color: '#05101e',
    categories: ['games', 'entertainment', 'social'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  }
}
