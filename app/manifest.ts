import type { MetadataRoute } from 'next'

// Installable from the browser menu so it sits on the home screen next to the
// camera, which is where you are when you need it.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitCheck',
    short_name: 'FitCheck',
    description: 'An honest second opinion on your outfit before you head out.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#FAFAFA',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
