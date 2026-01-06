import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "UPDATE"
  | "RESPONSE"
  | "THRESHOLD"
  | "REPORT"
  | "SYSTEM";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  petitionId?: number,
) {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  let shouldNotify = true;

  if (settings) {
    switch (type) {
      case "UPDATE":
        shouldNotify = settings.update;
        break;
      case "RESPONSE":
        shouldNotify = settings.response;
        break;
      case "REPORT":
        shouldNotify = settings.reported;
        break;
      case "THRESHOLD":
        shouldNotify = settings.threshold;
        break;
      case "SYSTEM":
        shouldNotify = true;
        break;
    }
  } else {
    switch (type) {
      case "UPDATE":
        shouldNotify = true;
        break;
      case "RESPONSE":
        shouldNotify = true;
        break;
      case "REPORT":
        shouldNotify = false;
        break;
      case "THRESHOLD":
        shouldNotify = false;
        break;
      case "SYSTEM":
        shouldNotify = true;
        break;
    }
  }

  if (!shouldNotify) return null;

  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      petitionId,
    },
  });
}

export async function getNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      petition: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function markNotificationRead(notificationId: number) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function notifyPetitionSubscribers(
  petitionId: number,
  title: string,
  message: string,
  type: NotificationType,
) {
  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
    include: {
      subscribers: {
        select: {
          id: true,
          notificationSettings: true,
        },
      },
      signers: {
        select: {
          id: true,
          notificationSettings: true,
        },
      },
    },
  });

  if (!petition) return;

  const notificationsData = [];

  const allRecipients = [...petition.subscribers, ...petition.signers];
  const uniqueRecipients = Array.from(
    new Map(allRecipients.map((user) => [user.id, user])).values(),
  );

  for (const user of uniqueRecipients) {
    let shouldNotify = true;
    const settings = user.notificationSettings;

    if (settings) {
      switch (type) {
        case "UPDATE":
          shouldNotify = settings.update;
          break;
        case "RESPONSE":
          shouldNotify = settings.response;
          break;
      }
    } else {
      if (type === "REPORT" || type === "THRESHOLD") shouldNotify = false;
    }

    if (shouldNotify) {
      notificationsData.push({
        userId: user.id,
        title,
        message,
        type,
        petitionId,
        read: false,
      });
    }
  }

  if (notificationsData.length > 0) {
    await prisma.notification.createMany({
      data: notificationsData,
    });
  }
}
