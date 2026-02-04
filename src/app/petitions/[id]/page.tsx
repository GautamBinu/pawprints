import { getPetition } from "@/app/actions";
import PetitionPageClient from "@/components/PetitionPage/PetitionPageClient";
import { Metadata } from "next";
import { getTokens } from "next-firebase-auth-edge";
import { cookies, headers } from "next/headers";
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

  const description = petition.description
    .replace(/<[^>]*>/g, "")
    .slice(0, 160);

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol =
    headersList.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "development" ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  return {
    title: `${petition.title} | PawPrints`,
    description: description,
    openGraph: {
      title: petition.title,
      description: description,
      type: "website",
      url: `${baseUrl}/petitions/${id}`,
      siteName: "PawPrints",
      images: [
        {
          url: `${baseUrl}/petitions/${id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: petition.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: petition.title,
      description: description,
      images: [`${baseUrl}/petitions/${id}/opengraph-image`],
    },
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
