// frontend/lib/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from './auth';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: authService.checkIsAdmin(firebaseUser.email) ? 'admin' : 'student',
          isAdmin: authService.checkIsAdmin(firebaseUser.email),
          emailVerified: firebaseUser.emailVerified
        };
        setUser(userData);
        authService.setAuthData(firebaseUser.accessToken, userData);
      } else {
        setUser(null);
        authService.clearAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await authService.googleLogin();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.isAdmin || false,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};