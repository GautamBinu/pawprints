"use client";

import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/app/auth/firebase";
import { logoutAction } from "./logout";

/**
 * Sign out from the browser's side first, then the server's.
 *
 * The Firebase client SDK keeps the signed-in user in memory for the life of
 * the page, and a header logout is a soft navigation — the page lives on. Only
 * the client can clear that; a server action cannot reach it. The previous
 * code called `signOut` inside the server action, which ran against a server
 * `Auth` instance that had never held a user and did nothing.
 */
export async function clientLogout() {
  await signOut(getFirebaseAuth()).catch(() => {
    // Nothing to clear, or the SDK is not initialised — either way the cookie
    // is what actually ends the session, and that is next.
  });
  await logoutAction();
}
