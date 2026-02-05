"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPetition, updatePetition, publishPetition } from "@/app/actions";
import PetitionForm, {
  formSchema,
  FormValues,
} from "@/components/PetitionForm/PetitionForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";

export default function New() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [petitionId, setPetitionId] = useState<number | null>(null);
  const router = useRouter();

  const isSavingRef = useRef(false);
  const petitionIdRef = useRef<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      targetSignatures: 150,
      expiresDate: "",
    },
    mode: "onChange",
  });

  const { watch, formState, getValues } = form;
  const { isValid, isDirty } = formState;
  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 2000);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  const handleAutoSave = useCallback(async () => {
    if (!isValid || isSubmitting || isSavingRef.current) return;

    const values = getValues();
    if (!values.title || !values.description || !values.category) return;

    try {
      isSavingRef.current = true;
      setIsAutoSaving(true);

      const petitionData = {
        title: values.title,
        description: values.description,
        tags: [values.category],
        expires: values.expiresDate,
        isDraft: true,
      };

      if (petitionId) {
        await updatePetition(petitionId, petitionData);
      } else {
        const newPetition = await createPetition(petitionData);
        if (newPetition) {
          setPetitionId(newPetition.id);
          petitionIdRef.current = newPetition.id;
        }
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsAutoSaving(false);
      isSavingRef.current = false;
    }
  }, [isValid, isSubmitting, getValues, petitionId]);

  useEffect(() => {
    if (isDirty && isValid) {
      handleAutoSave();
    }
  }, [debouncedValues, isDirty, isValid, handleAutoSave]);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    // Wait for any pending auto-save to finish
    while (isSavingRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const currentPetitionId = petitionIdRef.current || petitionId;

    try {
      if (currentPetitionId) {
        await updatePetition(currentPetitionId, {
          title: data.title,
          description: data.description,
          tags: [data.category],
          expires: data.expiresDate,
          isDraft: true, // Update as draft first
        });
        await publishPetition(currentPetitionId);
      } else {
        await createPetition({
          title: data.title,
          description: data.description,
          tags: [data.category],
          expires: data.expiresDate,
          isDraft: false,
        });
      }

      toast.success(
        "Petition submitted for review! You will be notified when it is approved.",
      );
      router.push(`/petitions/${currentPetitionId}`);
    } catch (error: any) {
      console.error("Error creating petition:", error);
      toast.error(
        error.message || "Failed to create petition. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-primary font-bold text-4xl mb-2">
              Create a Petition
            </h1>
            <p className="text-muted-foreground text-lg">
              Make your voice heard. Start a petition to bring about positive
              change at RIT.
            </p>
          </div>
          <div className="text-right h-6 flex items-center">
            {isAutoSaving && (
              <Badge
                variant="outline"
                className="text-sm text-muted-foreground animate-pulse"
              >
                Saving draft
              </Badge>
            )}
            {!isAutoSaving && petitionId && (
              <Badge
                variant="secondary"
                className="text-sm text-muted-foreground"
              >
                Draft saved
              </Badge>
            )}
          </div>
        </div>

        <div>
          <p className="mb-6 text-muted-foreground">
            Below, fill out each field. Drafts are automatically saved if you
            quit mid-creation (provided fields are valid).
          </p>

          <div className="grid gap-6 md:grid-cols-1 mb-8">
            <div>
              <p className="text-muted-foreground font-bold">
                Please remember, if this petition is about another person,
                staff, or faculty member, talk to Student Affairs or{" "}
                <a
                  href="https://www.rit.edu/dubai/incident-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
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

        <PetitionForm
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        >
          <div className="flex justify-end gap-4 pt-4 items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear the form? This cannot be undone.",
                  )
                ) {
                  form.reset();
                  setPetitionId(null);
                  petitionIdRef.current = null;
                }
              }}
              disabled={isSubmitting}
              className="h-12 px-6"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Processing
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </PetitionForm>
      </div>
    </div>
  );
}
