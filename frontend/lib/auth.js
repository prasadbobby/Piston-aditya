// frontend/lib/auth.js
import { auth, signInWithGoogle, signOutUser, onAuthStateChange } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const AUTH_TOKEN_KEY = 'firebase_auth_token';
export const USER_DATA_KEY = 'firebase_user_data';

// Get admin emails from environment
const getAdminEmails = () => {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return adminEmails.split(',').map(email => email.trim()).filter(Boolean);
};

// Check if user is admin
const isAdminEmail = (email) => {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
};

// Determine user role based on email
const getUserRole = (email) => {
  if (isAdminEmail(email)) {
    return 'admin';
  }
  return 'student'; // Default role
};

export const authService = {
  // Initialize auth state listener
  initAuthListener: (callback) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: getUserRole(firebaseUser.email),
          isAdmin: isAdminEmail(firebaseUser.email),
          emailVerified: firebaseUser.emailVerified
        };
        
        // Store in localStorage
        authService.setAuthData(firebaseUser.accessToken, userData);
        callback(userData);
      } else {
        authService.clearAuth();
        callback(null);
      }
    });
  },

  // Store token and user data
  setAuthData: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
  },

  // Get stored token
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  // Get stored user data
  getUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  // Clear auth data
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const user = authService.getUser();
    return !!(user && auth.currentUser);
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getUser();
    return user && user.isAdmin === true;
  },

  // Check if user is student
  isStudent: () => {
    const user = authService.getUser();
    return user && user.role === 'student';
  },

  // Google OAuth login
  googleLogin: async () => {
    try {
      console.log('🔐 Starting Google sign-in...');
      const result = await signInWithGoogle();
      const firebaseUser = result.user;
      
      console.log('✅ Firebase user signed in:', firebaseUser.email);
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: getUserRole(firebaseUser.email),
        isAdmin: isAdminEmail(firebaseUser.email),
        emailVerified: firebaseUser.emailVerified
      };
      
      // Get ID token for backend if needed
      const idToken = await firebaseUser.getIdToken();
      
      // Store auth data
      authService.setAuthData(idToken, userData);
      
      console.log('🎉 Login successful:', userData);
      return { success: true, user: userData, token: idToken };
      
    } catch (error) {
      console.error('❌ Google login error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'Sign-in failed. Please try again.');
      }
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log('🔐 Signing out...');
      await signOutUser();
      authService.clearAuth();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear local data even if Firebase logout fails
      authService.clearAuth();
    }
  },

  // Get current Firebase user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Check if email is admin
  checkIsAdmin: (email) => {
    return isAdminEmail(email);
  },

  // Get admin emails list
  getAdminEmails: () => {
    return getAdminEmails();
  }
};