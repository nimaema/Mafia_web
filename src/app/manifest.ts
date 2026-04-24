import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mafia God Companion',
    short_name: 'Mafia God',
    description: 'دستیار دیجیتال بازی مافیا',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf7ff',
    theme_color: '#6750a4',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
