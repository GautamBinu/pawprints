"use client";

import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import PetitionForm, {
  PetitionFormData,
} from "@/components/PetitionForm/PetitionForm";
import { createPetition } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function New() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (data: PetitionFormData) => {
    setIsSubmitting(true);

    try {
      await createPetition({
        title: data.title,
        description: data.description,
        tags: [data.category],
        expires: data.expiresDate,
      });

      toast.success(
        "Petition created as a draft! You can review and publish it from your profile.",
      );
      router.push("/profile");
    } catch (error) {
      console.error("Error creating petition:", error);
      toast.error("Failed to create petition. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-black">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-orange-500 font-bold text-4xl mb-2">
            Create a Petition
          </h1>
          <p className="text-gray-600 text-lg">
            Make your voice heard. Start a petition to bring about positive
            change at RIT.
          </p>
        </div>

        <div className="bg-white">
          <p className="mb-6 text-gray-600">
            Below, fill out each field and your changes will be automatically
            saved.
          </p>

          <div className="grid gap-6 md:grid-cols-1 mb-8">
            <div>
              <p className="text-gray-600 font-bold">
                Please remember, if this petition is about another person,
                staff, or faculty member, talk to Student Affairs or{" "}
                <a
                  href="https://www.rit.edu/dubai/incident-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  report an incident
                </a>{" "}
                instead. Student Government reserves the right to edit or remove
                any petition at any time for violating the Code of Conduct. This
                includes, but is not limited to, creating an intimidating,
                hostile, or abusive environment for any member of the RIT
                community, or posting of any obscene, defamatory, threatening,
                or otherwise harassing petitions.
              </p>
            </div>
          </div>
        </div>

        <PetitionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
