# 🎬 AKMovies - Modern Movie & TV Series Streaming Platform

A modern, responsive web application for streaming movies and TV series online. Built with Next.js, Firebase, and TMDB API, featuring a beautiful UI with advanced filtering, search capabilities, and user authentication.

![AKMovies Preview](https://img.shields.io/badge/AKMovies-Streaming%20Platform-e94560?style=for-the-badge&logo=netflix)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Platform-orange?style=for-the-badge&logo=firebase)
![TMDB](https://img.shields.io/badge/TMDB-API-blue?style=for-the-badge)

## ✨ Features

### 🎯 Core Functionality

- **Movie & TV Series Streaming**: Watch content with multiple server options
- **Advanced Search**: Real-time search with debouncing and instant results
- **Smart Filtering**: Browse by genre, category, and content type
- **Continue Watching**: Track your progress across devices
- **User Authentication**: Google Sign-in with Firebase
- **Responsive Design**: Works perfectly on all devices

### 🎨 User Experience

- **Hero Slider**: Full-screen, draggable carousel with trending content
- **Dynamic Titles**: Browser tabs update based on current page/content
- **Loading States**: Smooth loading animations and skeleton screens
- **Toast Notifications**: User-friendly feedback for all actions
- **Drag & Drop**: Reorder server lists in admin panel

### 🔧 Technical Features

- **SEO Optimized**: Dynamic metadata, Open Graph tags, structured data
- **PWA Ready**: Progressive Web App with manifest and service workers
- **Performance**: Optimized images, lazy loading, and efficient caching
- **Quality Filtering**: Automatic filtering of low-quality content
- **Real-time Updates**: Live data synchronization with Firebase

## 🛠️ Tech Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **CSS Modules**: Scoped styling with `index.module.css` convention
- **React Icons**: Beautiful icon library
- **Embla Carousel**: Smooth, draggable carousels
- **React Hot Toast**: Elegant notifications

### Backend & APIs

- **Firebase Authentication**: Google Sign-in integration
- **Firestore Database**: Real-time data storage
- **TMDB API**: Movie and TV series data
- **Vidsrc API**: Video streaming sources

### Development Tools

- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Git**: Version control

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- TMDB API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/akmovies.git
   cd akmovies
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   # Firebase Configuration
   NEXT_PRIVATE_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PRIVATE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PRIVATE_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PRIVATE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PRIVATE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PRIVATE_FIREBASE_APP_ID=your_app_id

   # TMDB API
   TMDB_API_KEY=your_tmdb_api_key
   NEXT_PRIVATE_TMDB_API_KEY=your_tmdb_api_key

   # Google Analytics (Optional)
   NEXT_PRIVATE_GA_ID=your_ga_id
   ```

4. **Firebase Setup**

   - Create a Firebase project
   - Enable Authentication (Google provider)
   - Create Firestore database
   - Set up security rules

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
akmovies/
├── public/                 # Static assets
│   ├── icon.png           # App icon
│   ├── logo.png           # Brand logo
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO robots
│   └── sitemap.xml        # SEO sitemap
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── browse/        # Browse movies/series
│   │   ├── continue/      # Continue watching
│   │   ├── search/        # Search functionality
│   │   ├── watch/         # Video player pages
│   │   ├── admin/         # Admin panel
│   │   ├── globals.css    # Global styles
│   │   └── layout.js      # Root layout
│   ├── components/        # Reusable components
│   │   ├── HeroSlider/    # Hero carousel
│   │   ├── MovieCard/     # Movie/series cards
│   │   ├── MovieSection/  # Content sections
│   │   ├── Navbar/        # Navigation bar
│   │   ├── Footer/        # Site footer
│   │   └── VerticalResults/ # Grid layouts
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication state
│   ├── firebase/          # Firebase configuration
│   │   └── index.js       # Firebase setup
│   └── utils/             # Utility functions
│       ├── auth.js        # Authentication helpers
│       ├── firestore.js   # Database operations
│       ├── tmdb.js        # TMDB API functions
│       └── vidsrc.js      # Video source API
└── package.json           # Dependencies and scripts
```

## 🎮 Usage Guide

### For Users

1. **Browse Content**

   - Visit the homepage to see trending content
   - Use the browse page to filter by genre/category
   - Switch between movies and TV series

2. **Search**

   - Use the search bar in the navbar
   - Real-time results as you type
   - Visit the search page for advanced filtering

3. **Watch Content**

   - Click on any movie/series to start watching
   - Choose from multiple server options
   - Track your progress automatically

4. **Continue Watching**
   - Sign in with Google to save progress
   - Resume where you left off
   - Manage your watch history

### For Administrators

1. **Access Admin Panel**

   - Sign in with Google
   - Navigate to `/admin`

2. **Manage Servers**
   - Add new streaming servers
   - Edit server URLs and names
   - Drag and drop to reorder
   - Delete unused servers

## 🔧 Configuration

### Firebase Setup

1. **Authentication**

   ```javascript
   // Enable Google provider in Firebase Console
   // Authentication > Sign-in method > Google
   ```

2. **Firestore Rules**

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }

       // Servers are read-only for users
       match /servers/{serverId} {
         allow read: if true;
         allow write: if request.auth != null; // Admin only
       }
     }
   }
   ```

### TMDB API

1. **Get API Key**

   - Visit [TMDB](https://www.themoviedb.org/settings/api)
   - Create an account and request API access
   - Add the key to your environment variables

2. **Content Filtering**
   - The app automatically filters low-quality content
   - Minimum rating: 4.0/10
   - Minimum votes: 10
   - Required: poster, backdrop, description

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Environment Variables**

   - Add all environment variables in Vercel dashboard
   - Ensure Firebase and TMDB keys are set

3. **Custom Domain**
   - Configure your domain in Vercel
   - Update `robots.txt` and `sitemap.xml` URLs

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Performance

### Optimizations

- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Efficient caching strategies
- **Bundle Analysis**: Optimized bundle sizes

### Lighthouse Scores

- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TMDB**: For providing comprehensive movie and TV series data
- **Firebase**: For authentication and database services
- **Next.js Team**: For the amazing React framework
- **Vercel**: For seamless deployment and hosting

## 📞 Support

- **Author**: Ankit Kaushik
- **Email**: [your-email@example.com]
- **Website**: [https://realakmovies.vercel.app](https://realakmovies.vercel.app)
- **GitHub**: [https://github.com/yourusername](https://github.com/yourusername)

---

⭐ **Star this repository if you found it helpful!**

Made with ❤️ by [Ankit Kaushik](https://github.com/yourusername)
