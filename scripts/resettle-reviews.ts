/**
 * Re-settles every petition currently under review against the pipeline as
 * it is defined now.
 *
 * Needed whenever REVIEW_STAGES changes in a way that satisfies stages
 * retroactively — dropping the Student Government quorum from three to one,
 * for instance, means a petition that already had one SG approval has
 * cleared that stage, but nothing will advance its pointer, hand it to
 * staff, or publish it until something triggers a settle. This is that
 * something. Idempotent: running it twice changes nothing the second time.
 *
 * Usage:  npx tsx scripts/resettle-reviews.ts           (dry run)
 *         npx tsx scripts/resettle-reviews.ts --apply
 */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/client";
import * as dotenv from "dotenv";

dotenv.config();

// The app's own prisma singleton is bypassed so the script can own the
// connection lifecycle and disconnect cleanly at the end.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const apply = process.argv.includes("--apply");

  // Imported lazily so the app's module-level prisma client is constructed
  // only when we actually need the settle logic, and after dotenv has run.
  const { REVIEW_STAGES, evaluateReview } = await import(
    "../src/lib/review-stages"
  );
  const { loadReviewState } = await import("../src/lib/review-state");
  const { settleReview, SYSTEM_ACTOR } = await import(
    "../src/lib/review-settle"
  );

  const pending = await prisma.petition.findMany({
    where: { status: 3 /* NeedsReview */ },
    select: { id: true, title: true, reviewStage: true },
    orderBy: { id: "asc" },
  });

  console.log(
    `${pending.length} petition(s) under review · SG quorum is now ${REVIEW_STAGES[0]?.minApprovals}\n`,
  );

  let changed = 0;
  for (const petition of pending) {
    const state = await loadReviewState(petition.id);
    const progress = evaluateReview(
      petition.reviewStage,
      state.reviews,
      state.assignments,
    );
    const target = progress.currentIndex ?? REVIEW_STAGES.length;

    if (target === petition.reviewStage && !progress.complete) continue;

    changed += 1;
    const outcome = progress.complete
      ? "PUBLISH"
      : `stage ${petition.reviewStage} → ${target} (${REVIEW_STAGES[target]?.name})`;
    console.log(`  #${petition.id} "${petition.title}": ${outcome}`);

    if (apply) {
      await settleReview(petition.id, SYSTEM_ACTOR);
    }
  }

  console.log(
    `\n${changed} of ${pending.length} would change.` +
      (apply ? " Applied." : " Dry run — re-run with --apply to write."),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
