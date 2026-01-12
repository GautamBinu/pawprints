"use server";

import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/lib/next/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// See starter example for implementation: https://github.com/awinogrodzki/next-firebase-auth-edge/tree/main/examples/next-typescript-starter
import { authConfig } from "@/app/config/server-config";

// Server action: expects idToken from client, sets cookies, then redirects
export async function loginAction(idToken: string) {
  await refreshCookiesWithIdToken(
    idToken,
    await headers(),
    await cookies(),
    authConfig,
  );
  redirect("/");
}
