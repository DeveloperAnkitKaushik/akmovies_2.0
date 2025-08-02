import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/firebase';
import { toast } from 'react-hot-toast';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        toast.success(`Welcome back, ${user.displayName}!`);
        return user;
    } catch (error) {
        console.error('Google sign-in error:', error);

        // Handle specific error cases
        if (error.code === 'auth/popup-closed-by-user') {
            toast.error('Sign-in cancelled');
        } else if (error.code === 'auth/popup-blocked') {
            toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        } else {
            toast.error('Sign-in failed. Please try again.');
        }

        throw error;
    }
};

// Sign out
export const signOutUser = async () => {
    try {
        await signOut(auth);
        toast.success('Signed out successfully');
    } catch (error) {
        console.error('Sign-out error:', error);
        toast.error('Sign-out failed. Please try again.');
        throw error;
    }
};

// Get current user
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!auth.currentUser;
};

// Get user profile data
export const getUserProfile = () => {
    const user = auth.currentUser;
    if (!user) return null;

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
    };
}; 