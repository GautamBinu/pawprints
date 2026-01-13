import { getPetition } from "@/app/actions";
import PetitionPageClient from "@/components/PetitionPage/PetitionPageClient";
import { Metadata } from "next";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "../../config/server-config";
import { PetitionStatus } from "@/types/petition";
import PetitionNotFound from "@/components/PetitionPage/PetitionNotFound";
import { prisma } from "@/lib/prisma";

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
    return <PetitionNotFound />;
  }

  const petition = await getPetition(id);

  if (!petition) {
    return <PetitionNotFound />;
  }

  if (petition.status !== PetitionStatus.Published) {
    const tokens = await getTokens(await cookies(), authConfig);

    if (!tokens) {
      return <PetitionNotFound />;
    }

    const userId = tokens.decodedToken.uid;

    if (petition.authorId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isStaff: true, isSuperAdmin: true },
      });

      if (!user?.isStaff && !user?.isSuperAdmin) {
        return <PetitionNotFound />;
      }
    }
  }

  return <PetitionPageClient initialPetition={petition} />;
}
