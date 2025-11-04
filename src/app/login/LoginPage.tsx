'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { getFirebaseAuth } from '@/app/auth/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  loginAction: (idToken: string) => Promise<void>;
}

export default function LoginPage({ loginAction }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      
      // Configure Google Auth provider
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      await loginAction(idToken);
    } catch (error: any) {
      console.log(error.message);
      console.log(typeof error);
      
      if (error?.message === "NEXT_REDIRECT") {
        // Ignore, this is expected for Next.js redirects
        return;
      } else {
        console.error('Login error:', error);
        setError(error.message || 'An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-xs border border-gray-200">
        {/* Header with RIT Tiger Logo */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <Image
              src="/RIT-00070A_RGB_TM.svg"
              alt="RIT Logo"
              width={80}
              height={50}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Welcome to PawPrints
          </h1>
          <p className="text-gray-600 text-xs">
            Your voice matters at RIT
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm active:bg-gray-100'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Log in</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-xs text-gray-500">
            By signing in, you agree to use PawPrints responsibly.
          </p>
          <p className="text-xs text-gray-400">
            Need help?{' '}
            <a
              href="mailto:support@rit.edu"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contact RIT Student Government
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}