"use client";

import { useEffect, useState } from "react";
import { Petition } from "@/types/petition";
import {
  getPendingPetitions,
  approvePetition,
  rejectPetition,
} from "@/app/actions";
import AdminGuard from "@/components/AdminGuard/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PetitionGrid from "@/components/PetitionCard/PetitionGrid";
import PetitionModal from "@/components/PetitionModal/PetitionModal";

export default function ReviewPage() {
  const [pendingPetitions, setPendingPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(
    null,
  );
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setSelectedPetition(petition);
    setIsModalOpen(true);
  };

  const handleApprove = async (petition: Petition) => {
    setProcessing(petition.id);
    setIsModalOpen(false); // Close modal immediately or wait? Better to close.
    try {
      await approvePetition(petition.id);
      setPendingPetitions((prev) => prev.filter((p) => p.id !== petition.id));
      toast.success(`Petition "${petition.title}" approved and published!`);
    } catch (error) {
      console.error("Error approving petition:", error);
      toast.error("Failed to approve petition");
    } finally {
      setProcessing(null);
      setSelectedPetition(null);
    }
  };

  const openRejectDialog = (petition: Petition) => {
    setRejectReason("");
    setIsModalOpen(false);
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedPetition) return;

    setProcessing(selectedPetition.id);
    setIsRejectDialogOpen(false);

    try {
      // Note: The backend action doesn't currently accept a reason,
      // but we could log it or send an email in the future.
      console.log(
        `Rejecting petition ${selectedPetition.id} with reason: ${rejectReason}`,
      );

      await rejectPetition(selectedPetition.id);
      setPendingPetitions((prev) =>
        prev.filter((p) => p.id !== selectedPetition.id),
      );
      toast.success(
        `Petition "${selectedPetition.title}" rejected and removed.`,
      );
    } catch (error) {
      console.error("Error rejecting petition:", error);
      toast.error("Failed to reject petition");
    } finally {
      setProcessing(null);
      setSelectedPetition(null);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 py-12">
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

      <PetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        petition={selectedPetition}
        isReviewMode={true}
        onApprove={handleApprove}
        onReject={openRejectDialog}
      />

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Petition</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject "{selectedPetition?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Reason for rejection (optional)
            </label>
            <Textarea
              id="reason"
              placeholder="Please explain why this petition is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing === selectedPetition?.id}
            >
              {processing === selectedPetition?.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Reject Petition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
