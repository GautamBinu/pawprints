"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "./config/server-config";
import { prisma } from "@/lib/prisma";
import { PetitionStatus, Petition } from "@/types/petition";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import {
  PETITION_DURATION_MS,
  PETITION_THRESHOLD,
  PETITION_TIERS,
} from "@/lib/constants";
import {
  createNotification,
  notifyPetitionSubscribers,
  getNotifications as getNotificationsLib,
  markNotificationRead as markNotificationReadLib,
  markAllNotificationsRead as markAllNotificationsReadLib,
  getUnreadNotificationCount as getUnreadNotificationCountLib,
} from "@/lib/notifications";
import {
  hasPermission,
  getRequiredPermissionForAction,
  PermissionAction,
} from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { containsMaliciousLinks, extractUrls } from "@/lib/safe-browsing";

const sanitizeOptions = {
  allowedTags: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "u",
    "s",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  transformTags: {
    a: (tagName: string, attribs: { [key: string]: string }) => {
      const href = attribs.href;
      if (!href) return { tagName, attribs };

      if (href.startsWith("/") || href.startsWith("#")) {
        return { tagName, attribs };
      }

      return {
        tagName,
        attribs: {
          ...attribs,
          href: `/external-link?url=${encodeURIComponent(href)}`,
          rel: "noopener noreferrer",
        },
      };
    },
  },
};

export async function getPendingPetitions(): Promise<Petition[]> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });
  if (!user || (!user.isStaff && !user.isSuperAdmin)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }

  const petitions = await prisma.petition.findMany({
    where: {
      status: PetitionStatus.NeedsReview,
    },
    include: {
      tags: true,
      author: true,
      response: true,
      updates: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return petitions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    author: p.author?.name || p.authorId,
    signatures: p.signatures,
    targetSignatures: p.targetSignatures,
    tier: p.tier,
    created_at: p.createdAt.toISOString(),
    status: p.status,
    expires: p.expires.toISOString(),
    last_signed: p.lastSigned?.toISOString() || null,
    has_response: p.hasResponse,
    response: p.response
      ? {
          id: p.response.id,
          description: p.response.description,
          created_at: p.response.createdAt.toISOString(),
          author: p.response.author,
        }
      : null,
    in_progress: p.inProgress,
    updates: p.updates.map((u) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: p.oldId,
  }));
}

export async function getAdminPetitions(): Promise<Petition[]> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });
  if (!user || (!user.isStaff && !user.isSuperAdmin)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }

  const petitions = await prisma.petition.findMany({
    include: {
      tags: true,
      author: true,
      response: true,
      updates: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return petitions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    author: p.author?.name || p.authorId,
    signatures: p.signatures,
    targetSignatures: p.targetSignatures,
    tier: p.tier,
    created_at: p.createdAt.toISOString(),
    status: p.status,
    expires: p.expires.toISOString(),
    last_signed: p.lastSigned?.toISOString() || null,
    has_response: p.hasResponse,
    response: p.response
      ? {
          id: p.response.id,
          description: p.response.description,
          created_at: p.response.createdAt.toISOString(),
          author: p.response.author,
        }
      : null,
    in_progress: p.inProgress,
    updates: p.updates.map((u) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: p.oldId,
  }));
}

export async function approvePetition(
  id: number,
  tierId?: number,
  categoryName?: string,
) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }
  await checkPermission(tokens.decodedToken.uid, "approve");

  const data: any = {
    status: PetitionStatus.Published,
  };

  if (tierId) {
    const tier = PETITION_TIERS.find((t) => t.id === tierId);
    if (tier) {
      data.tier = tierId;
      data.targetSignatures = tier.threshold;
    }
  }

  if (categoryName) {
    data.tags = {
      set: [],
      connectOrCreate: [
        {
          where: { name: categoryName },
          create: { name: categoryName },
        },
      ],
    };
  }

  const petition = await prisma.petition.update({
    where: { id },
    data,
  });

  await logAction(
    "APPROVE_PETITION",
    { petitionId: id, tierId, categoryName },
    tokens.decodedToken.uid,
  );

  await createNotification(
    petition.authorId,
    "Petition Approved",
    `Your petition "${petition.title}" has been approved.`,
    "SYSTEM",
    petition.id,
  );

  revalidatePath("/", "layout");
}

export async function rejectPetition(id: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }
  await checkPermission(tokens.decodedToken.uid, "reject");

  const petition = await prisma.petition.update({
    where: { id },
    data: {
      status: PetitionStatus.Removed,
    },
  });

  await logAction(
    "REJECT_PETITION",
    { petitionId: id },
    tokens.decodedToken.uid,
  );

  await createNotification(
    petition.authorId,
    "Petition Rejected",
    `Your petition "${petition.title}" has been rejected.`,
    "SYSTEM",
    petition.id,
  );

  revalidatePath("/", "layout");
}

export async function returnPetition(id: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  await checkPermission(userId, "return");

  const petition = await prisma.petition.update({
    where: { id },
    data: {
      status: PetitionStatus.Returned,
    },
  });

  await logAction("RETURN_PETITION", { petitionId: id }, userId);

  await createNotification(
    petition.authorId,
    "Petition Returned",
    `Your petition "${petition.title}" has been returned for changes.`,
    "SYSTEM",
    petition.id,
  );

  revalidatePath("/", "layout");
}

export async function createPetition(data: {
  title: string;
  description: string;
  tags: string[];
  expires?: string;
  isDraft?: boolean;
}) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  const schema = z.object({
    title: z
      .string()
      .min(10)
      .max(150)
      .regex(/^[^<>]*$/, "HTML not allowed in title"),
    description: z.string().min(50),
    tags: z.array(z.string()).min(1, "At least one category is required"),
    expires: z.string().optional(),
    isDraft: z.boolean().optional(),
  });

  const validatedData = schema.parse(data);

  const urls = extractUrls(validatedData.description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your petition contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const userId = tokens.decodedToken.uid;
  const email = tokens.decodedToken.email;
  const name = tokens.decodedToken.name || email;

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: email || "",
      name: name,
    },
  });

  if (user.hasAccess !== 1) {
    throw new Error("Unauthorized: You do not have access to create petitions");
  }

  const petition = await prisma.petition.create({
    data: {
      title: validatedData.title,
      description: sanitizeHtml(validatedData.description, sanitizeOptions),
      authorId: userId,
      status: validatedData.isDraft
        ? PetitionStatus.New
        : PetitionStatus.NeedsReview,
      expires: validatedData.expires
        ? new Date(validatedData.expires)
        : new Date(Date.now() + PETITION_DURATION_MS),
      tags: {
        connectOrCreate: validatedData.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
    },
  });

  await logAction(
    "CREATE_PETITION",
    { petitionId: petition.id, title: petition.title },
    userId,
  );

  return petition;
}

export async function updatePetition(
  id: number,
  data: {
    title: string;
    description: string;
    tags: string[];
    expires?: string;
    isDraft?: boolean;
  },
) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  const userId = tokens.decodedToken.uid;

  const petition = await prisma.petition.findUnique({ where: { id } });
  if (!petition) throw new Error("Petition not found");
  if (petition.authorId !== userId)
    throw new Error("Unauthorized: You can only edit your own petitions");
  if (
    petition.status !== PetitionStatus.New &&
    petition.status !== PetitionStatus.Returned
  )
    throw new Error("Petition cannot be edited in its current status");

  const schema = z.object({
    title: z
      .string()
      .min(10)
      .max(150)
      .regex(/^[^<>]*$/, "HTML not allowed in title"),
    description: z.string().min(50),
    tags: z.array(z.string()).min(1, "At least one category is required"),
    expires: z.string().optional(),
    isDraft: z.boolean().optional(),
  });

  const validatedData = schema.parse(data);

  const urls = extractUrls(validatedData.description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your petition contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const updatedPetition = await prisma.petition.update({
    where: { id },
    data: {
      title: validatedData.title,
      description: sanitizeHtml(validatedData.description, sanitizeOptions),
      expires: validatedData.expires
        ? new Date(validatedData.expires)
        : new Date(Date.now() + PETITION_DURATION_MS),
      tags: {
        set: [],
        connectOrCreate: validatedData.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
    },
    include: {
      tags: true,
      author: true,
      response: true,
      updates: true,
    },
  });

  revalidatePath("/", "layout");

  return {
    id: updatedPetition.id,
    title: updatedPetition.title,
    description: updatedPetition.description,
    tags: updatedPetition.tags,
    author: updatedPetition.author?.name || updatedPetition.authorId,
    signatures: updatedPetition.signatures,
    targetSignatures: updatedPetition.targetSignatures,
    tier: updatedPetition.tier,
    created_at: updatedPetition.createdAt.toISOString(),
    status: updatedPetition.status,
    expires: updatedPetition.expires.toISOString(),
    last_signed: updatedPetition.lastSigned?.toISOString() || null,
    has_response: updatedPetition.hasResponse,
    response: updatedPetition.response
      ? {
          id: updatedPetition.response.id,
          description: updatedPetition.response.description,
          created_at: updatedPetition.response.createdAt.toISOString(),
          author: updatedPetition.response.author,
        }
      : null,
    in_progress: updatedPetition.inProgress,
    updates: updatedPetition.updates.map((u) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: updatedPetition.oldId,
  };
}

export async function publishPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
  });
  if (!petition) throw new Error("Petition not found");

  if (petition.authorId !== userId)
    throw new Error("Unauthorized: You can only publish your own petitions");

  if (
    petition.status !== PetitionStatus.New &&
    petition.status !== PetitionStatus.Returned
  ) {
    throw new Error("Petition is not in draft or returned status");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.hasAccess !== 1) {
    throw new Error(
      "Unauthorized: You do not have access to publish petitions",
    );
  }

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      status: PetitionStatus.NeedsReview,
      createdAt: new Date(), // Reset created_at
      expires: new Date(Date.now() + PETITION_DURATION_MS),
    },
  });

  await logAction("PUBLISH_PETITION", { petitionId }, userId);

  revalidatePath("/");
}

export async function getPetitions(): Promise<Petition[]> {
  const petitions = await prisma.petition.findMany({
    where: {
      status: PetitionStatus.Published,
    },
    include: {
      tags: true,
      author: true,
      response: true,
      updates: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return petitions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    author: p.author?.name || p.authorId,
    signatures: p.signatures,
    targetSignatures: p.targetSignatures,
    tier: p.tier,
    created_at: p.createdAt.toISOString(),
    status: p.status,
    expires: p.expires.toISOString(),
    last_signed: p.lastSigned?.toISOString() || null,
    has_response: p.hasResponse,
    response: p.response
      ? {
          id: p.response.id,
          description: p.response.description,
          created_at: p.response.createdAt.toISOString(),
          author: p.response.author,
        }
      : null,
    in_progress: p.inProgress,
    updates: p.updates.map((u) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: p.oldId,
  }));
}

/**
 * Prisma throws P2025 ("An operation failed because it depends on one or more
 * records that were required but not found") when a conditional `where` clause
 * on update matches nothing. We use that as the authorization signal for
 * sign/unsign, so it needs to be distinguished from real errors.
 *
 * Checked structurally rather than with `instanceof` because this project
 * generates the client to a custom output path (src/generated/client), so the
 * error class identity is not stable across regeneration.
 */
function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2025"
  );
}

export async function signPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: tokens.decodedToken.email || "",
      name: tokens.decodedToken.name || tokens.decodedToken.email,
    },
  });

  if (user.hasAccess !== 1) {
    throw new Error("User does not have access to sign petitions");
  }

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
    include: { signers: true },
  });

  if (!petition) throw new Error("Petition not found");

  // Check status (0: New, 2: Removed)
  if (petition.status === 0 || petition.status === 2) {
    throw new Error("Petition is not available for signing");
  }

  if (petition.expires < new Date()) {
    throw new Error("Petition has expired");
  }

  if (petition.hasResponse) {
    throw new Error("Petition has already been responded to");
  }

  if (petition.authorId === userId)
    throw new Error("Cannot sign your own petition");

  const alreadySigned = petition.signers.some((s) => s.id === userId);
  if (alreadySigned) throw new Error("Already signed");

  // The `none` guard closes the race between the alreadySigned check above and
  // this write: Prisma emits a single conditional UPDATE, so two concurrent
  // requests cannot both increment. The second matches no row and throws P2025.
  let updatedPetition;
  try {
    updatedPetition = await prisma.petition.update({
      where: {
        id: petitionId,
        signers: { none: { id: userId } },
      },
      data: {
        signatures: { increment: 1 },
        lastSigned: new Date(),
        signers: {
          connect: { id: userId },
        },
      },
    });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      throw new Error("Already signed");
    }
    throw error;
  }

  await logAction("SIGN_PETITION", { petitionId }, userId);

  // `>=` rather than `===`, guarded by thresholdNotifiedAt: now that unsigning
  // works correctly, an exact-equality check could be re-triggered by an
  // unsign/re-sign cycle and spam the author and every subscriber.
  if (
    updatedPetition.signatures >= PETITION_THRESHOLD &&
    !updatedPetition.thresholdNotifiedAt
  ) {
    const claimed = await prisma.petition.updateMany({
      where: { id: petitionId, thresholdNotifiedAt: null },
      data: { thresholdNotifiedAt: new Date() },
    });

    if (claimed.count === 1) {
      await createNotification(
        updatedPetition.authorId,
        "Threshold Reached",
        `Your petition "${updatedPetition.title}" has reached ${PETITION_THRESHOLD} signatures!`,
        "THRESHOLD",
        updatedPetition.id,
      );
      await notifyPetitionSubscribers(
        updatedPetition.id,
        "Threshold Reached",
        `The petition "${updatedPetition.title}" has reached ${PETITION_THRESHOLD} signatures!`,
        "THRESHOLD",
      );
    }
  }

  revalidatePath("/", "layout");
}

export async function unsignPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  if (!Number.isInteger(petitionId) || petitionId <= 0) {
    throw new Error("Invalid petition");
  }

  // The decrement only executes if this user is currently a signer. The guard
  // lives in the `where` clause so it is part of the same statement as the
  // write: there is no check-then-write window, and the counter cannot be
  // driven below the true signer count.
  //
  // Deliberately not gated on hasAccess, status or expiry — withdrawing a
  // signature is de-escalating, and a user should not be locked into a
  // signature because their access was revoked or the petition expired.
  try {
    await prisma.petition.update({
      where: {
        id: petitionId,
        signers: { some: { id: userId } },
      },
      data: {
        signatures: { decrement: 1 },
        signers: {
          disconnect: { id: userId },
        },
      },
    });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      // One message for both "petition does not exist" and "you never signed
      // it", so this cannot be used to enumerate petition IDs.
      throw new Error("You have not signed this petition");
    }
    throw error;
  }

  await logAction("UNSIGN_PETITION", { petitionId }, userId);

  // Was page-scoped, which left stale counts on the homepage and Explore.
  revalidatePath("/", "layout");
}

export async function getPetitionSignatureStatus(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return { signed: false, isAuthor: false };
  const userId = tokens.decodedToken.uid;

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
    select: {
      authorId: true,
      signers: {
        where: { id: userId },
        select: { id: true },
      },
    },
  });

  if (!petition) return { signed: false, isAuthor: false };

  return {
    signed: petition.signers.length > 0,
    isAuthor: petition.authorId === userId,
  };
}

export async function getUserProfile() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return null;
  const userId = tokens.decodedToken.uid;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      createdPetitions: {
        include: { tags: true, author: true, response: true, updates: true },
        orderBy: { createdAt: "desc" },
      },
      signedPetitions: {
        include: { tags: true, author: true, response: true, updates: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  const mapPetition = (p: any): Petition => ({
    id: p.id,
    title: p.title,
    description: p.description,
    tags: p.tags,
    author: p.author?.name || p.authorId,
    signatures: p.signatures,
    targetSignatures: p.targetSignatures,
    tier: p.tier,
    created_at: p.createdAt.toISOString(),
    status: p.status,
    expires: p.expires.toISOString(),
    last_signed: p.lastSigned?.toISOString() || null,
    has_response: p.hasResponse,
    response: p.response
      ? {
          id: p.response.id,
          description: p.response.description,
          created_at: p.response.createdAt.toISOString(),
          author: p.response.author,
        }
      : null,
    in_progress: p.inProgress,
    updates: p.updates.map((u: any) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: p.oldId,
  });

  return {
    user: {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
    createdPetitions: user.createdPetitions.map(mapPetition),
    signedPetitions: user.signedPetitions.map(mapPetition),
  };
}

// This is basically a shorthand to check if the user is either staff or admin
// Without actually fetching their permissions
export async function checkAdminAccess() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return false;

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });
  if (!user) return false;

  return user.isStaff || user.isSuperAdmin;
}

export async function getStaffPermissions() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return { isStaff: false, isSuperAdmin: false, permissions: 0 };

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });

  if (!user) return { isStaff: false, isSuperAdmin: false, permissions: 0 };

  return {
    isStaff: user.isStaff,
    isSuperAdmin: user.isSuperAdmin,
    permissions: user.permissions,
  };
}

async function checkPermission(userId: string, action: PermissionAction) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.isSuperAdmin) return true;

  if (user.isStaff) {
    const requiredPermission = getRequiredPermissionForAction(action);
    if (hasPermission(user.permissions, requiredPermission)) {
      return true;
    }
  }

  throw new Error("Unauthorized: Insufficient permissions");
}

export async function addUpdate(petitionId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "add_update");

  const schema = z.object({
    petitionId: z.number(),
    description: z.string().min(1, "Description cannot be empty"),
  });
  schema.parse({ petitionId, description });

  const urls = extractUrls(description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your update contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const update = await prisma.update.create({
    data: {
      description: sanitizeHtml(description, sanitizeOptions),
      petitions: { connect: { id: petitionId } },
    },
  });

  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
  });

  if (petition) {
    await notifyPetitionSubscribers(
      petitionId,
      `Update on "${petition.title}"`,
      "A new update has been posted.",
      "UPDATE",
    );
  }

  revalidatePath("/", "layout");
  return {
    id: update.id,
    description: update.description,
    created_at: update.createdAt.toISOString(),
  };
}

export async function addResponse(petitionId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;
  await checkPermission(userId, "response");

  const schema = z.object({
    petitionId: z.number(),
    description: z.string().min(1, "Description cannot be empty"),
  });
  schema.parse({ petitionId, description });

  const urls = extractUrls(description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your response contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const response = await prisma.response.create({
    data: {
      description: sanitizeHtml(description, sanitizeOptions),
      author: tokens.decodedToken.name || tokens.decodedToken.email || "Staff",
      petitions: { connect: { id: petitionId } },
    },
  });

  const petition = await prisma.petition.update({
    where: { id: petitionId },
    data: {
      hasResponse: true,
      responseId: response.id,
    },
  });

  await logAction(
    "ADD_RESPONSE",
    { petitionId, responseId: response.id },
    userId,
  );

  await notifyPetitionSubscribers(
    petitionId,
    `Response to "${petition.title}"`,
    "An official response has been posted.",
    "RESPONSE",
  );

  revalidatePath("/", "layout");
  return {
    id: response.id,
    description: response.description,
    created_at: response.createdAt.toISOString(),
    author: response.author,
  };
}

export async function markInProgress(petitionId: number, inProgress: boolean) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "mark-in-progress");

  const schema = z.object({
    petitionId: z.number(),
    inProgress: z.boolean(),
  });
  schema.parse({ petitionId, inProgress });

  await prisma.petition.update({
    where: { id: petitionId },
    data: { inProgress },
  });

  await logAction(
    "MARK_IN_PROGRESS",
    { petitionId, inProgress },
    tokens.decodedToken.uid,
  );

  revalidatePath("/", "layout");
}

export async function unpublishPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "unpublish");

  const schema = z.object({
    petitionId: z.number(),
  });
  schema.parse({ petitionId });

  await prisma.petition.update({
    where: { id: petitionId },
    data: { status: PetitionStatus.Removed },
  });

  await logAction(
    "UNPUBLISH_PETITION",
    { petitionId },
    tokens.decodedToken.uid,
  );

  revalidatePath("/", "layout");
}

export async function editUpdate(updateId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "editUpdate");

  const schema = z.object({
    updateId: z.number(),
    description: z.string().min(1, "Description cannot be empty"),
  });
  schema.parse({ updateId, description });

  const urls = extractUrls(description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your update contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const update = await prisma.update.update({
    where: { id: updateId },
    data: { description: sanitizeHtml(description, sanitizeOptions) },
  });

  await logAction("EDIT_UPDATE", { updateId }, tokens.decodedToken.uid);

  revalidatePath("/", "layout");
  return {
    id: update.id,
    description: update.description,
    created_at: update.createdAt.toISOString(),
  };
}

export async function editResponse(responseId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "editResponse");

  const schema = z.object({
    responseId: z.number(),
    description: z.string().min(1, "Description cannot be empty"),
  });
  schema.parse({ responseId, description });

  const urls = extractUrls(description);
  const { isSafe, maliciousUrls } = await containsMaliciousLinks(urls);
  if (!isSafe) {
    throw new Error(
      `Your response contains links flagged as unsafe: ${maliciousUrls.join(", ")}`,
    );
  }

  const response = await prisma.response.update({
    where: { id: responseId },
    data: { description: sanitizeHtml(description, sanitizeOptions) },
  });

  await logAction("EDIT_RESPONSE", { responseId }, tokens.decodedToken.uid);

  revalidatePath("/", "layout");
  return {
    id: response.id,
    description: response.description,
    created_at: response.createdAt.toISOString(),
    author: response.author, // Note: author might not be on response object if not selected, but prisma update returns the object.
    // Actually prisma update returns the model. Response model has author.
    // Broke my head for an hour trying to fix this.
  };
}

export async function getUserNotifications() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return [];
  const userId = tokens.decodedToken.uid;
  return await getNotificationsLib(userId);
}

export async function markNotificationAsRead(id: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== tokens.decodedToken.uid) {
    throw new Error("Unauthorized");
  }

  await markNotificationReadLib(id);
  revalidatePath("/", "layout");
}

export async function markAllAsRead() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await markAllNotificationsReadLib(tokens.decodedToken.uid);
  revalidatePath("/", "layout");
}

export async function getUnreadCount() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return 0;
  return await getUnreadNotificationCountLib(tokens.decodedToken.uid);
}

export async function getNotificationSettings() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");

  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: tokens.decodedToken.uid },
  });

  if (!settings) {
    return {
      update: true,
      response: true,
      reported: false,
      threshold: false,
    };
  }

  return settings;
}

export async function updateNotificationSettings(settings: {
  update: boolean;
  response: boolean;
  reported: boolean;
  threshold: boolean;
}) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");

  await prisma.notificationSettings.upsert({
    where: { userId: tokens.decodedToken.uid },
    update: settings,
    create: {
      userId: tokens.decodedToken.uid,
      ...settings,
    },
  });

  await logAction(
    "UPDATE_NOTIFICATION_SETTINGS",
    settings,
    tokens.decodedToken.uid,
  );

  revalidatePath("/profile");
}

export async function verifyExternalLink(url: string) {
  const { isSafe } = await containsMaliciousLinks([url]);
  return isSafe;
}

async function processContent(html: string) {
  const urls = new Set<string>();

  const externalLinkRegex = /href="\/external-link\?url=([^"]+)"/g;
  let match;
  while ((match = externalLinkRegex.exec(html)) !== null) {
    try {
      urls.add(decodeURIComponent(match[1]));
    } catch {}
  }

  const rawLinkRegex = /href="(https?:\/\/[^"]+)"/g;
  while ((match = rawLinkRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  if (urls.size === 0) return html;

  const { maliciousUrls } = await containsMaliciousLinks(Array.from(urls));
  if (maliciousUrls.length === 0) return html;

  let processedHtml = html;
  for (const url of maliciousUrls) {
    const encodedUrl = encodeURIComponent(url);
    const safeEncodedUrl = encodedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rewrittenRegex = new RegExp(
      `<a\\s+(?:[^>]*?\\s+)?href="\\/external-link\\?url=${safeEncodedUrl}"(?:[^>]*?)>(.*?)<\\/a>`,
      "gi",
    );

    processedHtml = processedHtml.replace(rewrittenRegex, (match, content) => {
      return `<span class="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded" title="This link has been flagged as unsafe">[UNSAFE LINK: ${url}]</span>`;
    });

    const safeUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rawRegex = new RegExp(
      `<a\\s+(?:[^>]*?\\s+)?href="${safeUrl}"(?:[^>]*?)>(.*?)<\\/a>`,
      "gi",
    );

    processedHtml = processedHtml.replace(rawRegex, (match, content) => {
      return `<span class="text-destructive font-mono text-sm bg-destructive/10 px-1 rounded" title="This link has been flagged as unsafe">[UNSAFE LINK: ${url}]</span>`;
    });
  }
  return processedHtml;
}

export async function getPetition(id: number) {
  const petition = await prisma.petition.findUnique({
    where: { id },
    include: {
      tags: true,
      author: true,
      response: true,
      updates: true,
    },
  });

  if (!petition) return null;

  const [description, responseDescription, updates] = await Promise.all([
    processContent(petition.description),
    petition.response
      ? processContent(petition.response.description)
      : Promise.resolve(undefined),
    Promise.all(
      petition.updates.map(async (u) => ({
        ...u,
        description: await processContent(u.description),
      })),
    ),
  ]);

  return {
    id: petition.id,
    title: petition.title,
    description: description,
    tags: petition.tags,
    author: petition.author?.name || petition.authorId,
    authorId: petition.authorId,
    signatures: petition.signatures,
    targetSignatures: petition.targetSignatures,
    tier: petition.tier,
    created_at: petition.createdAt.toISOString(),
    status: petition.status,
    expires: petition.expires.toISOString(),
    last_signed: petition.lastSigned?.toISOString() || null,
    has_response: petition.hasResponse,
    response:
      petition.response && responseDescription
        ? {
            id: petition.response.id,
            description: responseDescription,
            created_at: petition.response.createdAt.toISOString(),
            author: petition.response.author,
          }
        : null,
    in_progress: petition.inProgress,
    updates: updates.map((u) => ({
      id: u.id,
      description: u.description,
      created_at: u.createdAt.toISOString(),
    })),
    old_id: petition.oldId,
  };
}

export async function getAuditLogs() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });

  if (!user || !user.isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 100,
  });
}

export async function getUsers() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });

  if (!user || !user.isSuperAdmin) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          createdPetitions: true,
          signedPetitions: true,
        },
      },
    },
  });
}