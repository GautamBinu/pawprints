'use server';

import { removeServerCookies } from "next-firebase-auth-edge/next/cookies";
import { signOut } from 'firebase/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFirebaseAuth } from '@/app/auth/firebase';
import { authConfig } from '@/app/config/server-config';

export async function logoutAction() {
  await signOut(getFirebaseAuth());

  // Since Next.js 15, `headers` and `cookies` functions return a Promise, hence we precede the calls with `await`.
  removeServerCookies(await cookies(), { cookieName: authConfig.cookieName });
  redirect('/');
}