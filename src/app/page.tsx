import React, { Suspense } from "react";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "./config/server-config";
import { getPetitions } from "@/app/actions";
import PublicHome from "@/components/Home/PublicHome";
import LoggedInHome from "@/components/Home/LoggedInHome";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function Home() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    return <PublicHome />;
  }

  const petitions = await getPetitions();

  const trendingPetitions = [...petitions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoggedInHome trendingPetitions={trendingPetitions} />
    </Suspense>
  );
}
