"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Petition } from "@/types/petition";
import PetitionCard from "@/components/PetitionCard/PetitionCard";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, ClipboardCheck } from "lucide-react";
import { PETITION_THRESHOLD } from "@/lib/constants";
import { checkAdminAccess } from "@/app/actions";

interface LoggedInHomeProps {
  trendingPetitions: Petition[];
}

export default function LoggedInHome({ trendingPetitions }: LoggedInHomeProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    checkAdminAccess().then(setIsAdmin).catch(console.error);
  }, []);

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {user?.displayName || "Tiger"}!
          </h1>
          <p className="text-xl text-muted-foreground">
            View the most popular petitions or start a new one today.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/create">
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Create Petition
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="h-5 w-5" />
              Explore All
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/review">
              <Button variant="outline" size="lg" className="gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Review Queue
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-bold font-mono uppercase">Latest Petitions</h2>
        </div>

        {trendingPetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPetitions.map((petition) => (
              <PetitionCard
                key={petition.id}
                title={petition.title}
                category={petition.tags[0]?.name || "Other"}
                currentSignatures={petition.signatures}
                targetSignatures={PETITION_THRESHOLD}
                status={petition.status}
                onClick={() => router.push(`/petitions/${petition.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground text-lg">
              No trending petitions at the moment. Why not start one?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
