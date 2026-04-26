import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مافیا بورد - دستیار پیشرفته',
    short_name: 'مافیا بورد',
    description: 'دستیار دیجیتال برای مدیریت حرفه‌ای بازی مافیا',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#84cc16',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
