import React, { Suspense } from "react";
import { getPetitions } from "@/app/actions";
import HomeClient from "@/components/Home/HomeClient";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function Home() {
  const petitions = await getPetitions();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <HomeClient initialPetitions={petitions} />
    </Suspense>
  );
}
