// Admin validation utilities
export const ADMIN_EMAILS = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    // Add more admin emails here if needed
];

// Check if user is admin
export const isUserAdmin = (user) => {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email);
};

// Validate admin access with additional security checks
export const validateAdminAccess = (user, isAuthenticated) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
        return { isAdmin: false, reason: 'Not authenticated' };
    }

    // Check if user exists
    if (!user) {
        return { isAdmin: false, reason: 'User not found' };
    }

    // Check if user has email
    if (!user.email) {
        return { isAdmin: false, reason: 'No email associated with account' };
    }

    // Check if email is verified (optional but recommended)
    if (user.emailVerified === false) {
        return { isAdmin: false, reason: 'Email not verified' };
    }

    // Check if user is in admin list
    if (!ADMIN_EMAILS.includes(user.email)) {
        return { isAdmin: false, reason: 'Not authorized' };
    }

    return { isAdmin: true, reason: 'Authorized' };
};

// Get admin info for display
export const getAdminInfo = (user) => {
    if (!isUserAdmin(user)) return null;

    return {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        isVerified: user.emailVerified
    };
};

// Log admin actions for security
export const logAdminAction = (user, action, details = {}) => {
    if (!isUserAdmin(user)) return;

    const logData = {
        timestamp: new Date().toISOString(),
        adminEmail: user.email,
        action,
        details,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        ip: 'client-side' // In production, this would be server-side
    };

    console.log('Admin Action:', logData);

    // In production, you would send this to a logging service
    // or store it in Firebase for audit trails
};

// Rate limiting for admin actions (client-side basic implementation)
const actionCounts = new Map();

export const checkRateLimit = (action, limit = 10, windowMs = 60000) => {
    const now = Date.now();
    const key = `${action}_${now - (now % windowMs)}`;

    const currentCount = actionCounts.get(key) || 0;

    if (currentCount >= limit) {
        return false;
    }

    actionCounts.set(key, currentCount + 1);

    // Clean up old entries
    setTimeout(() => {
        actionCounts.delete(key);
    }, windowMs);

    return true;
}; 