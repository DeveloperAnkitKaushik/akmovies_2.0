import './globals.css'
import Navbar from '@/components/Navbar/index'
import Footer from '@/components/Footer/index'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
    title: 'AKMovies - Watch Movies & TV Series Online Free | HD Streaming',
    description: 'Watch the latest movies and TV series online for free on AKMovies. Stream HD quality content including Hollywood, Bollywood, and international films. No registration required.',
    keywords: [
        'AKMovies',
        'watch movies online',
        'free movie streaming',
        'TV series online',
        'HD movies',
        'streaming platform',
        'Hollywood movies',
        'Bollywood movies',
        'international films',
        'movie streaming site',
        'free TV shows',
        'online cinema',
        'movie download',
        'stream movies',
        'watch series online',
        'movie streaming service',
        'free entertainment',
        'latest movies',
        'popular TV shows',
        'movie streaming platform'
    ].join(', '),
    authors: [{ name: 'Ankit Kaushik' }],
    creator: 'Ankit Kaushik',
    publisher: 'AKMovies',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://realakmovies.vercel.app',
        siteName: 'AKMovies',
        title: 'AKMovies - Watch Movies & TV Series Online Free | HD Streaming',
        description: 'Watch the latest movies and TV series online for free on AKMovies. Stream HD quality content including Hollywood, Bollywood, and international films. No registration required.',
        images: [
            {
                url: 'https://realakmovies.vercel.app/logo.png',
                width: 1200,
                height: 630,
                alt: 'AKMovies - Watch Movies & TV Series Online',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AKMovies - Watch Movies & TV Series Online Free | HD Streaming',
        description: 'Watch the latest movies and TV series online for free on AKMovies. Stream HD quality content including Hollywood, Bollywood, and international films.',
        images: ['https://realakmovies.vercel.app/logo.png'],
        creator: '@ankitkaushik',
        site: '@akmovies',
    },
    alternates: {
        canonical: 'https://realakmovies.vercel.app',
    },
    category: 'Entertainment',
    classification: 'Movie Streaming Platform',
    other: {
        'theme-color': '#e94560',
        'color-scheme': 'dark',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
        'apple-mobile-web-app-title': 'AKMovies',
        'application-name': 'AKMovies',
        'msapplication-TileColor': '#e94560',
        'msapplication-config': '/browserconfig.xml',
    },
    verification: {
        google: "IhleRkwS3CAPHzFgSf0ySPwCj7IYM1DdenB4JQzDb28",
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
                <link rel="icon" href="/icon.png" type="image/png" sizes="16x16" />
                <link rel="apple-touch-icon" href="/icon.png" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="theme-color" content="#e94560" />
                <meta name="msapplication-TileColor" content="#e94560" />

                {/* Simple Anti-Inspection Script */}
                
            </head>
            <body className="text-white bg-black">
                <AuthProvider>
                    <Navbar />
                    {children}
                    <Footer />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#1a1a2e',
                                color: '#fff',
                                border: '1px solid #e94560',
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    )
} 