import { initFirebaseAdmin } from './firebase-admin';

export async function verifyIdToken(token: string) {
  const admin = initFirebaseAdmin();
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token', error);
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) return null;
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name || decodedToken.email?.split('@')[0],
  };
}
