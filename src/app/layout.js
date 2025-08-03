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

                {/* Simple Anti-Inspection Script 
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Disable right click
                            document.addEventListener('contextmenu', function(e) {
                                e.preventDefault();
                                return false;
                            });

                            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
                            document.addEventListener('keydown', function(e) {
                                if (e.key === 'F12' || 
                                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                                    (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                                    (e.ctrlKey && e.key === 'U')) {
                                    e.preventDefault();
                                    return false;
                                }
                            });

                            // Detect developer tools
                            let devtools = { open: false };
                            setInterval(() => {
                                const threshold = 160;
                                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                                
                                if (widthThreshold || heightThreshold) {
                                    if (!devtools.open) {
                                        devtools.open = true;
                                        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff; font-family: Arial, sans-serif; text-align: center;"><div><h1>Access Denied</h1><p>Developer tools are not allowed on this website.</p></div></div>';
                                    }
                                } else {
                                    devtools.open = false;
                                }
                            }, 500);
                        `
                    }}
                />
                */}

                {/* Structured Data for Rich Snippets */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "AKMovies",
                            "url": "https://realakmovies.vercel.app",
                            "description": "Watch the latest movies and TV series online for free on AKMovies. Stream HD quality content including Hollywood, Bollywood, and international films.",
                            "author": {
                                "@type": "Person",
                                "name": "Ankit Kaushik"
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": "AKMovies",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": "https://realakmovies.vercel.app/logo.png"
                                }
                            },
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": "https://realakmovies.vercel.app/search?q={search_term_string}",
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
                />
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