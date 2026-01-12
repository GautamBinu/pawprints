"use client";

import { useEffect, useState } from "react";
import { Petition } from "@/types/petition";
import { getPendingPetitions } from "@/app/actions";
import AdminGuard from "@/components/AdminGuard/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PetitionGrid from "@/components/PetitionCard/PetitionGrid";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const [pendingPetitions, setPendingPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPetitions();
  }, []);

  const loadPetitions = async () => {
    try {
      const petitions = await getPendingPetitions();
      setPendingPetitions(petitions);
    } catch (error) {
      console.error("Error fetching pending petitions:", error);
      toast.error("Failed to load pending petitions");
    } finally {
      setLoading(false);
    }
  };

  const handlePetitionClick = (petition: Petition) => {
    router.push(`/petitions/${petition.id}`);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background text-foreground py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold text-[#F76902]">
              Review Pending Petitions
            </h1>
            <p className="text-muted-foreground text-lg">
              Review and moderate petition submissions before they are
              published.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingPetitions.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F76902]" />
            </div>
          ) : pendingPetitions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pending petitions</AlertTitle>
              <AlertDescription>
                There are no petitions currently waiting for review. Good job!
              </AlertDescription>
            </Alert>
          ) : (
            <PetitionGrid
              petitions={pendingPetitions}
              onPetitionClick={handlePetitionClick}
              showStatus={true}
            />
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
