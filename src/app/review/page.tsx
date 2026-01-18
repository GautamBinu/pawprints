"use client";

import { useEffect, useState } from "react";
import { Petition } from "@/types/petition";
import { getAdminPetitions } from "@/app/actions";
import AdminGuard from "@/components/AdminGuard/AdminGuard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ReviewDashboard } from "@/components/review/dashboard";

export default function ReviewPage() {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetitions();
  }, []);

  const loadPetitions = async () => {
    try {
      const data = await getAdminPetitions();
      setPetitions(data);
    } catch (error) {
      console.error("Error fetching petitions:", error);
      toast.error("Failed to load petitions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#F76902]" />
          </div>
        ) : (
          <ReviewDashboard petitions={petitions} onRefresh={loadPetitions} />
        )}
      </div>
    </AdminGuard>
  );
}
