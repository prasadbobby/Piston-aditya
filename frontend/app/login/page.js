// frontend/app/login/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { useAuth } from '../../lib/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log('User already logged in, redirecting...');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLoginSuccess = (result) => {
    setIsLoggingIn(false);
    const { user } = result;
    
    if (user.isAdmin) {
      toast.success(`Welcome back, Admin ${user.name}! 🎉`);
    } else {
      toast.success(`Welcome ${user.name}! 🎉`);
    }
    
    // Redirect based on role
    setTimeout(() => {
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }, 1000);
  };

  const handleLoginError = (error) => {
    setIsLoggingIn(false);
    console.error('Login error:', error);
    toast.error(error.message || 'Login failed. Please try again.');
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.606 50.606 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a .75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600">
            Sign in with Google to continue your learning journey
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">Sign In</h3>
            <p className="text-sm text-gray-600 mt-2">
              Secure authentication powered by Google
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Google Sign In Button */}
              <GoogleLoginButton
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                className={isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Sign in with Google
              </GoogleLoginButton>

              {/* Admin Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">👑</span>
                  </div>
                  <h4 className="font-semibold text-purple-900">Admin Access</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Admin users will automatically get elevated privileges based on their email address.
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium text-green-900">Secure & Private</span>
                </div>
                <p className="text-sm text-green-700">
                  Your data is protected with industry-standard security protocols.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              New to Agent Guru?{' '}
              <Link 
                href="/create-profile" 
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Start your learning journey
              </Link>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            🚀 What awaits you:
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <span className="text-gray-700">AI-powered learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎯</span>
              <span className="text-gray-700">Personalized paths</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span className="text-gray-700">Progress tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏆</span>
              <span className="text-gray-700">Achievement system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}