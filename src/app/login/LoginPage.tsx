'use client';

import * as React from 'react';
import { getFirebaseAuth } from '@/app/auth/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginPageProps {
  loginAction: (idToken: string) => Promise<void>;
}

export default function LoginPage({ loginAction }: LoginPageProps) {
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
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
        console.error(error);
        alert(error);
      }
    }
  }

  return (
    <div className="bg-white h-screen text-black max-w-600 p-20">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit">
          Sign in with Google
        </button>
      </form>
    </div>
  );
}