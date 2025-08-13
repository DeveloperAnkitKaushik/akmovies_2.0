import { collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { toast } from 'react-hot-toast';

// Ensure unique keys for continue watching items
const ensureUniqueKeys = (items) => {
    return items.map(item => ({
        ...item,
        uniqueKey: `continue_${item.mediaType}_${item.id}`
    }));
};

// Generate proper ID for Firebase documents
const generateFirebaseId = (mediaType, tmdbId) => {
    return `${mediaType}_${tmdbId}`;
};

export const getUserHistory = async (userId) => {
    if (!userId) return [];

    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        const history = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: data.id, // TMDB ID
                firebaseId: doc.id, // Firebase document ID
                ...data
            });
        });

        return ensureUniqueKeys(history);
    } catch (error) {
        console.error('Error fetching user history:', error);
        return [];
    }
};

export const addToHistory = async (userId, item) => {
    if (!userId || !item) return;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(item.mediaType, item.id);
        const docRef = doc(db, 'users', userId, 'history', documentId);

        // Always use setDoc to either create or update the document
        await setDoc(docRef, {
            episode: item.episode || 1,
            id: item.id, // TMDB ID
            mediaType: item.mediaType,
            posterPath: item.posterPath,
            season: item.season || 1,
            title: item.title,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding to history:', error);
    }
};

export const updateHistoryProgress = async (userId, itemId, progress) => {
    if (!userId || !itemId) return;

    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, where('id', '==', itemId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = doc(db, 'users', userId, 'history', querySnapshot.docs[0].id);
            await updateDoc(docRef, {
                progress,
                timestamp: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating history progress:', error);
    }
};

export const removeFromHistory = async (userId, itemId, mediaType) => {
    if (!userId || !itemId || !mediaType) return;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, itemId);
        const docRef = doc(db, 'users', userId, 'history', documentId);

        // Delete the document directly using the proper ID
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error removing from history:', error);
    }
};

export const clearHistory = async (userId) => {
    if (!userId) return;

    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const querySnapshot = await getDocs(historyRef);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error clearing history:', error);
    }
};

export const getHistoryCount = async (userId) => {
    if (!userId) return 0;

    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const querySnapshot = await getDocs(historyRef);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting history count:', error);
        return 0;
    }
};

// Server management functions
export const getServers = async () => {
    try {
        const serversRef = collection(db, 'servers');
        const q = query(serversRef, orderBy('order_number', 'asc'));
        const querySnapshot = await getDocs(q);

        const servers = [];
        querySnapshot.forEach((doc) => {
            servers.push({
                id: doc.id,
                name: doc.data().name,
                url: doc.data().url,
                order_number: doc.data().order_number
            });
        });

        return servers;
    } catch (error) {
        console.error('Error fetching servers:', error);
        // Return default servers as fallback
        return [
            { id: '1', name: 'Server 1', url: 'https://vidsrc.cc/embed', order_number: 1 },
            { id: '2', name: 'Server 2', url: 'https://vidsrc.to/embed', order_number: 2 },
            { id: '3', name: 'Server 3', url: 'https://vidsrc.me/embed', order_number: 3 }
        ];
    }
};

export const addServer = async (serverData) => {
    try {
        const serversRef = collection(db, 'servers');
        await addDoc(serversRef, {
            order_number: serverData.order_number,
            url: serverData.url,
            timestamp: serverTimestamp()
        });
        toast.success('Server added successfully');
    } catch (error) {
        console.error('Error adding server:', error);
        toast.error('Failed to add server');
    }
};

export const updateServer = async (serverId, serverData) => {
    try {
        const serverRef = doc(db, 'servers', serverId);
        await updateDoc(serverRef, {
            order_number: serverData.order_number,
            url: serverData.url,
            timestamp: serverTimestamp()
        });
        toast.success('Server updated successfully');
    } catch (error) {
        console.error('Error updating server:', error);
        toast.error('Failed to update server');
    }
};

export const deleteServer = async (serverId) => {
    try {
        const serverRef = doc(db, 'servers', serverId);
        await deleteDoc(serverRef);
        toast.success('Server deleted successfully');
    } catch (error) {
        console.error('Error deleting server:', error);
        toast.error('Failed to delete server');
    }
};

// Continue watching functions for watch page
export const getContinueWatchingItem = async (userId, contentId, mediaType) => {
    if (!userId || !contentId || !mediaType) return null;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, contentId);
        const docRef = doc(db, 'users', userId, 'history', documentId);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }

        return null;
    } catch (error) {
        console.error('Error getting continue watching item:', error);
        return null;
    }
};

export const updateContinueWatchingProgress = async (userId, contentId, mediaType, season, episode) => {
    if (!userId || !contentId || !mediaType) return;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, contentId);
        const docRef = doc(db, 'users', userId, 'history', documentId);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Update the existing document
            await updateDoc(docRef, {
                season: season || 1,
                episode: episode || 1,
                timestamp: serverTimestamp()
            });
        } else {
            // Create a new document if it doesn't exist
            // This should not happen in normal flow, but just in case
            console.warn('Continue watching item not found, creating new one');
            await setDoc(docRef, {
                id: contentId,
                mediaType: mediaType,
                season: season || 1,
                episode: episode || 1,
                timestamp: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating continue watching progress:', error);
    }
};

// Admin recommendations functions
export const getRecommendations = async () => {
    try {
        const recommendationsRef = collection(db, 'recommendations');
        const q = query(recommendationsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        const recommendations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            recommendations.push({
                id: doc.id,
                ...data
            });
        });

        return recommendations;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
};

export const addRecommendation = async (recommendationData) => {
    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(recommendationData.mediaType, recommendationData.id);
        const docRef = doc(db, 'recommendations', documentId);

        // Use setDoc to either create or update the recommendation
        await setDoc(docRef, {
            ...recommendationData,
            timestamp: serverTimestamp()
        });

        toast.success('Recommendation added successfully');
    } catch (error) {
        console.error('Error adding recommendation:', error);
        toast.error('Failed to add recommendation');
    }
};

export const deleteRecommendation = async (recommendationId, mediaType) => {
    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, recommendationId);
        const recommendationRef = doc(db, 'recommendations', documentId);

        await deleteDoc(recommendationRef);
        toast.success('Recommendation deleted successfully');
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        toast.error('Failed to delete recommendation');
    }
};

// Create user document when user signs in
export const createUserDocument = async (user) => {
    if (!user || !user.uid) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
            displayName: user.displayName || 'Unknown',
            photoURL: user.photoURL || null,
            email: user.email || 'Unknown',
            createdAt: serverTimestamp()
        };

        await setDoc(userDocRef, userData, { merge: true });
    } catch (error) {
        console.error('Error creating user document:', error);
    }
};

// Get all users (admin only)
export const getAllUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        const users = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                displayName: userData.displayName || 'Unknown',
                photoURL: userData.photoURL || null,
                email: userData.email || 'Unknown',
                createdAt: userData.createdAt
            });
        });

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

// Get user history for admin (admin only)
export const getUserHistoryForAdmin = async (userId) => {
    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        const history = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                id: doc.id,
                title: data.title || 'Unknown',
                mediaType: data.mediaType || 'unknown',
                timestamp: data.timestamp,
                season: data.season,
                episode: data.episode
            });
        });

        return history;
    } catch (error) {
        console.error('Error fetching user history:', error);
        return [];
    }
};

// Bookmark management functions
export const getUserBookmarks = async (userId) => {
    if (!userId) return [];

    try {
        const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
        const q = query(bookmarksRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        const bookmarks = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            bookmarks.push({
                id: data.id, // TMDB ID
                firebaseId: doc.id, // Firebase document ID
                ...data
            });
        });

        return bookmarks;
    } catch (error) {
        console.error('Error fetching user bookmarks:', error);
        return [];
    }
};

export const addBookmark = async (userId, item) => {
    if (!userId || !item) return false;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(item.mediaType, item.id);
        const docRef = doc(db, 'users', userId, 'bookmarks', documentId);

        // Check if already bookmarked
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            toast.info('Already bookmarked');
            return false;
        }

        // Add bookmark
        await setDoc(docRef, {
            id: item.id, // TMDB ID
            title: item.title || item.name,
            overview: item.overview,
            posterPath: item.posterPath || item.poster_path,
            backdropPath: item.backdropPath || item.backdrop_path,
            mediaType: item.mediaType,
            releaseDate: item.releaseDate || item.release_date || item.first_air_date,
            voteAverage: item.voteAverage || item.vote_average,
            timestamp: serverTimestamp()
        });

        toast.success('Added to bookmarks');
        return true;
    } catch (error) {
        console.error('Error adding bookmark:', error);
        toast.error('Failed to add bookmark');
        return false;
    }
};

export const removeBookmark = async (userId, itemId, mediaType) => {
    if (!userId || !itemId || !mediaType) return false;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, itemId);
        const docRef = doc(db, 'users', userId, 'bookmarks', documentId);

        await deleteDoc(docRef);
        toast.success('Removed from bookmarks');
        return true;
    } catch (error) {
        console.error('Error removing bookmark:', error);
        toast.error('Failed to remove bookmark');
        return false;
    }
};

export const isBookmarked = async (userId, itemId, mediaType) => {
    if (!userId || !itemId || !mediaType) return false;

    try {
        // Generate the proper Firebase document ID using the format {type}_{id}
        const documentId = generateFirebaseId(mediaType, itemId);
        const docRef = doc(db, 'users', userId, 'bookmarks', documentId);

        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error('Error checking bookmark status:', error);
        return false;
    }
}; 