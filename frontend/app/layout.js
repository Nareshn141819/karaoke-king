import './globals.css'
import { AudioProvider } from '../lib/AudioContext'
import GlobalMiniPlayer from '../components/GlobalMiniPlayer'

export const metadata = { 
  title: 'Karaoke King 🎤', 
  description: 'Sing. Score. Shine.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Karaoke King',
  },
}

export const viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <AudioProvider>
          {children}
          <GlobalMiniPlayer />
        </AudioProvider>
      </body>
    </html>
  )
}
