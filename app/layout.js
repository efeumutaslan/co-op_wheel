import './globals.css'

export const metadata = {
  title: 'Co-op Çark | Arkadaşlarınla Çark Çevir',
  description: 'Gerçek zamanlı çok oyunculu çark çevirme uygulaması. Oda kur, arkadaşlarını davet et ve birlikte eğlen!',
  keywords: 'çark çevirme, wheel spinner, co-op, multiplayer, gerçek zamanlı',
  openGraph: {
    title: 'Co-op Çark',
    description: 'Arkadaşlarınla gerçek zamanlı çark çevir!',
    type: 'website',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎡</text></svg>" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        {children}
      </body>
    </html>
  )
}
