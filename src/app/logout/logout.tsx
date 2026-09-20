"use server";

import { removeServerCookies } from "next-firebase-auth-edge/next/cookies";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/app/config/server-config";

export async function logoutAction() {
  // Since Next.js 15, `headers` and `cookies` functions return a Promise, hence we precede the calls with `await`.
  removeServerCookies(await cookies(), { cookieName: authConfig.cookieName });

  // Same reason as loginAction: the root layout holds the signed-in user and
  // is not re-rendered by a soft navigation. Without this the header keeps
  // the avatar and menus after the cookie is gone.
  revalidatePath("/", "layout");

  redirect("/");
}
