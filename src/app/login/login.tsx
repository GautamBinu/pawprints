"use server";

import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/lib/next/cookies";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  // Decode token to get user info (safe because refreshCookiesWithIdToken verified it)
  const parts = idToken.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

  const uid = payload.user_id || payload.sub;
  const email = payload.email;
  const name = payload.name;

  if (uid) {
    await prisma.user.upsert({
      where: { id: uid },
      update: {
        email: email,
        name: name || email?.split("@")[0] || "User",
      },
      create: {
        id: uid,
        email: email || "",
        name: name || email?.split("@")[0] || "User",
      },
    });
  }

  redirect("/");
}
