import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { createNotification, createNotifications } from "@/lib/notifications";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { PetitionStatus } from "@/types/petition";
import { REVIEW_STAGES, evaluateReview } from "@/lib/review-stages";
import { loadReviewState, stageAudience } from "@/lib/review-state";

/**
 * The consequence of the pipeline's state: advancing the stage pointer,
 * handing off to the next stage, and publishing once every stage is clear.
 *
 * Lives outside the server-action file so a maintenance script can invoke it
 * — the actions export only public endpoints, and this must never be one.
 * It is idempotent: re-running it against a settled petition changes nothing.
 */

/** Whoever caused the re-evaluation. `null` for a system pass with no user. */
export interface SettleActor {
  id: string;
  name: string;
}

export const SYSTEM_ACTOR: SettleActor = { id: "", name: "System" };

/**
 * Re-evaluates the pipeline and applies whatever it implies: advance the
 * stored stage pointer, and publish once every stage is satisfied.
 *
 * Called after anything that could change the outcome — a review, a
 * withdrawal, an unassignment — so publication is never a separate button
 * someone has to remember to press.
 */
export async function settleReview(
  petitionId: number,
  actor: SettleActor,
) {
  const petition = await prisma.petition.findUnique({
    where: { id: petitionId },
    select: {
      id: true,
      title: true,
      status: true,
      reviewStage: true,
      authorId: true,
    },
  });
  if (!petition || petition.status !== PetitionStatus.NeedsReview) return;

  const state = await loadReviewState(petitionId);
  const progress = evaluateReview(
    petition.reviewStage,
    state.reviews,
    state.assignments,
  );

  const nextStage = progress.currentIndex ?? REVIEW_STAGES.length;

  if (!progress.complete) {
    if (nextStage !== petition.reviewStage) {
      await prisma.petition.update({
        where: { id: petitionId },
        data: { reviewStage: nextStage },
      });

      // Only on the way forward. Falling back to an earlier stage — a
      // withdrawn approval, a late changes request — is not news the next
      // stage needs.
      if (nextStage > petition.reviewStage) {
        const stage = REVIEW_STAGES[nextStage];
        const audience = await stageAudience(petitionId, nextStage);
        await createNotifications(
          audience.filter((id) => id !== actor.id),
          `Petition ready for ${stage.name}`,
          `"${petition.title}" cleared ${
            REVIEW_STAGES[nextStage - 1]?.name ?? "the previous stage"
          } and is now waiting on ${stage.name}.`,
          "REVIEW",
          petitionId,
        );

        if (stage.requiresAssignment && audience.length === 0) {
          // Nobody to tell, and the stage cannot move until that changes.
          await notifyAssignmentNeeded(petitionId, petition.title, stage.name);
        }
      }
    }
    return;
  }

  await prisma.petition.update({
    where: { id: petitionId },
    data: { status: PetitionStatus.Published, reviewStage: REVIEW_STAGES.length },
  });

  await logAction(
    "PUBLISH_AFTER_REVIEW",
    { petitionId, title: petition.title },
    actor.id,
  );

  await createNotification(
    petition.authorId,
    "Petition Approved",
    `Your petition "${petition.title}" cleared review and is now live.`,
    "REVIEW",
    petitionId,
  );

  revalidatePath("/", "layout");
}

/**
 * A stage that requires an assignee has arrived with nobody on it. The people
 * who can unblock it are the ones holding MANAGE_REVIEWERS, so they are who
 * gets told — otherwise the petition sits there silently.
 */
async function notifyAssignmentNeeded(
  petitionId: number,
  title: string,
  stageName: string,
) {
  const managers = await prisma.user.findMany({
    where: {
      disabled: false,
      OR: [
        { isSuperAdmin: true },
        { isStaff: true, permissions: { gt: 0 } },
      ],
    },
    select: { id: true, permissions: true, isSuperAdmin: true },
  });

  await createNotifications(
    managers
      .filter(
        (user) =>
          user.isSuperAdmin ||
          hasPermission(user.permissions, PERMISSIONS.MANAGE_REVIEWERS),
      )
      .map((user) => user.id),
    `${stageName} needs an assignee`,
    `"${title}" is waiting on ${stageName} but nobody has been assigned to it.`,
    "REVIEW",
    petitionId,
  );
}

