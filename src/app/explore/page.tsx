import React, { Suspense } from "react";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "../config/server-config";
import { getPetitions } from "@/app/actions";
import ExploreClient from "@/components/Explore/ExploreClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function ExplorePage() {
  const tokens = await getTokens(await cookies(), authConfig);

  if (!tokens) {
    redirect("/login");
  }

  const petitions = await getPetitions();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ExploreClient initialPetitions={petitions} />
    </Suspense>
  );
}
