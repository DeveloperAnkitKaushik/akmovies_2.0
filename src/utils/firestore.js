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
        const historyRef = collection(db, 'users', userId, 'history');
        const firebaseId = generateFirebaseId(item.mediaType, item.id);
        const docRef = doc(db, 'users', userId, 'history', firebaseId);

        // Check if document exists
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Update existing item
            await updateDoc(docRef, {
                episode: item.episode || 1,
                id: item.id, // TMDB ID
                mediaType: item.mediaType,
                posterPath: item.posterPath,
                season: item.season || 1,
                title: item.title,
                timestamp: serverTimestamp()
            });
        } else {
            // Add new item
            await setDoc(docRef, {
                episode: item.episode || 1,
                id: item.id, // TMDB ID
                mediaType: item.mediaType,
                posterPath: item.posterPath,
                season: item.season || 1,
                title: item.title,
                timestamp: serverTimestamp()
            });
        }
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

export const removeFromHistory = async (userId, itemId) => {
    if (!userId || !itemId) return;

    try {
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, where('id', '==', itemId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = doc(db, 'users', userId, 'history', querySnapshot.docs[0].id);
            await deleteDoc(docRef);
        }
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
                name: `Server ${doc.data().order_number}`,
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
        const firebaseId = generateFirebaseId(mediaType, contentId);
        const docRef = doc(db, 'users', userId, 'history', firebaseId);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                firebaseId: docSnap.id,
                ...docSnap.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching continue watching item:', error);
        return null;
    }
};

export const updateContinueWatchingProgress = async (userId, contentId, mediaType, season, episode) => {
    if (!userId || !contentId || !mediaType) return;

    try {
        const firebaseId = generateFirebaseId(mediaType, contentId);
        const docRef = doc(db, 'users', userId, 'history', firebaseId);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Update existing document
            await updateDoc(docRef, {
                season,
                episode,
                timestamp: serverTimestamp()
            });
        } else {
            // Create new document
            await setDoc(docRef, {
                episode,
                id: contentId,
                mediaType,
                season,
                timestamp: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating continue watching progress:', error);
    }
}; 