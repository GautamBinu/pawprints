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
  createNotification,
  notifyPetitionSubscribers,
  getNotifications as getNotificationsLib,
  markNotificationRead as markNotificationReadLib,
  markAllNotificationsRead as markAllNotificationsReadLib,
  getUnreadNotificationCount as getUnreadNotificationCountLib,
} from "@/lib/notifications";

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
    a: ["href", "target"],
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

export async function approvePetition(id: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }
  await checkPermission(tokens.decodedToken.uid, "approve");

  const petition = await prisma.petition.update({
    where: { id },
    data: {
      status: PetitionStatus.Published,
    },
  });

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

  await createNotification(
    petition.authorId,
    "Petition Rejected",
    `Your petition "${petition.title}" has been rejected.`,
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
}) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  // Validation with Zod
  const schema = z.object({
    title: z
      .string()
      .min(10)
      .max(150)
      .regex(/^[^<>]*$/, "HTML not allowed in title"),
    description: z.string().min(50),
    tags: z.array(z.string()).min(1, "At least one category is required"),
    expires: z.string().optional(),
  });

  const validatedData = schema.parse(data);

  const userId = tokens.decodedToken.uid;
  const email = tokens.decodedToken.email;
  const name = tokens.decodedToken.name || email;

  // Ensure user exists
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

  // Create petition
  await prisma.petition.create({
    data: {
      title: validatedData.title,
      description: sanitizeHtml(validatedData.description, sanitizeOptions),
      authorId: userId,
      status: PetitionStatus.New, // 0: Draft
      expires: validatedData.expires
        ? new Date(validatedData.expires)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      tags: {
        connectOrCreate: validatedData.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
    },
  });

  revalidatePath("/profile");
}

export async function updatePetition(
  id: number,
  data: {
    title: string;
    description: string;
    tags: string[];
    expires?: string;
  },
) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    throw new Error("Unauthorized");
  }

  const userId = tokens.decodedToken.uid;

  // Check if petition exists and user is author
  const petition = await prisma.petition.findUnique({ where: { id } });
  if (!petition) throw new Error("Petition not found");
  if (petition.authorId !== userId)
    throw new Error("Unauthorized: You can only edit your own petitions");
  if (petition.status !== PetitionStatus.New)
    throw new Error("Petition cannot be edited in its current status");

  // Validation
  const schema = z.object({
    title: z
      .string()
      .min(10)
      .max(150)
      .regex(/^[^<>]*$/, "HTML not allowed in title"),
    description: z.string().min(50),
    tags: z.array(z.string()).min(1, "At least one category is required"),
    expires: z.string().optional(),
  });

  const validatedData = schema.parse(data);

  // Update petition
  const updatedPetition = await prisma.petition.update({
    where: { id },
    data: {
      title: validatedData.title,
      description: sanitizeHtml(validatedData.description, sanitizeOptions),
      expires: validatedData.expires
        ? new Date(validatedData.expires)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: {
        set: [], // Clear existing tags
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

  if (petition.status !== PetitionStatus.New) {
    throw new Error("Petition is not in draft status");
  }

  // Check if user has access
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
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Reset expires to 30 days from now
    },
  });
  revalidatePath("/", "layout");
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

export async function signPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  // Ensure user exists and check access
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

  // Check expiry
  if (petition.expires < new Date()) {
    throw new Error("Petition has expired");
  }

  // Check response
  if (petition.hasResponse) {
    throw new Error("Petition has already been responded to");
  }

  if (petition.authorId === userId)
    throw new Error("Cannot sign your own petition");

  const alreadySigned = petition.signers.some((s) => s.id === userId);
  if (alreadySigned) throw new Error("Already signed");

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      signatures: { increment: 1 },
      lastSigned: new Date(),
      signers: {
        connect: { id: userId },
      },
    },
  });

  revalidatePath("/", "layout");
}

export async function unsignPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  const userId = tokens.decodedToken.uid;

  await prisma.petition.update({
    where: { id: petitionId },
    data: {
      signatures: { decrement: 1 },
      signers: {
        disconnect: { id: userId },
      },
    },
  });

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

// Admin/Staff secret stuff lol
export async function checkAdminAccess() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) return false;

  const user = await prisma.user.findUnique({
    where: { id: tokens.decodedToken.uid },
  });
  if (!user) return false;

  return user.isStaff || user.isSuperAdmin;
}

async function checkPermission(
  userId: string,
  action:
    | "add_update"
    | "response"
    | "mark-in-progress"
    | "unpublish"
    | "editUpdate"
    | "editResponse"
    | "approve"
    | "reject",
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.isSuperAdmin) return true;

  if (user.isStaff) {
    // Staff permissions
    const staffPermissions = [
      "add_update",
      "response",
      "mark-in-progress",
      "unpublish",
      "editUpdate",
      "editResponse",
      "approve",
      "reject",
    ];
    if (staffPermissions.includes(action)) return true;
  }

  throw new Error("Permission denied");
}

export async function addUpdate(petitionId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "add_update");

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

  // Create response
  const response = await prisma.response.create({
    data: {
      description: sanitizeHtml(description, sanitizeOptions),
      author: tokens.decodedToken.name || tokens.decodedToken.email || "Staff",
      petitions: { connect: { id: petitionId } },
    },
  });

  // Update petition
  const petition = await prisma.petition.update({
    where: { id: petitionId },
    data: {
      hasResponse: true,
      responseId: response.id,
    },
  });

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

  await prisma.petition.update({
    where: { id: petitionId },
    data: { inProgress },
  });
  revalidatePath("/", "layout");
}

export async function unpublishPetition(petitionId: number) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "unpublish");

  await prisma.petition.update({
    where: { id: petitionId },
    data: { status: PetitionStatus.Removed },
  });
  revalidatePath("/", "layout");
}

export async function editUpdate(updateId: number, description: string) {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) throw new Error("Unauthorized");
  await checkPermission(tokens.decodedToken.uid, "editUpdate");

  const update = await prisma.update.update({
    where: { id: updateId },
    data: { description: sanitizeHtml(description, sanitizeOptions) },
  });
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

  const response = await prisma.response.update({
    where: { id: responseId },
    data: { description: sanitizeHtml(description, sanitizeOptions) },
  });
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
    // Return defaults
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
  revalidatePath("/profile");
}
