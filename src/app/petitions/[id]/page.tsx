import { notFound } from "next/navigation";
import { getPetition } from "@/app/actions";
import PetitionPageClient from "@/components/PetitionPage/PetitionPageClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  if (isNaN(id)) return { title: "Petition Not Found" };

  const petition = await getPetition(id);
  if (!petition) return { title: "Petition Not Found" };

  return {
    title: `${petition.title} | PawPrints`,
    description: petition.description.replace(/<[^>]*>/g, "").slice(0, 160),
  };
}

export default async function PetitionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const petition = await getPetition(id);

  if (!petition) {
    notFound();
  }

  return <PetitionPageClient initialPetition={petition} />;
}
