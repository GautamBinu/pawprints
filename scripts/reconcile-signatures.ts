import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/client";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dryRun = !process.argv.includes("--apply");

  const petitions = await prisma.petition.findMany({
    select: {
      id: true,
      title: true,
      signatures: true,
      _count: { select: { signers: true } },
    },
  });

  const drifted = petitions.filter((p) => p.signatures !== p._count.signers);

  console.log(`${drifted.length} of ${petitions.length} petitions have drift`);

  for (const p of drifted) {
    console.log(
      `  #${p.id} "${p.title}": stored=${p.signatures} actual=${p._count.signers}`,
    );
    if (!dryRun) {
      await prisma.petition.update({
        where: { id: p.id },
        data: { signatures: p._count.signers },
      });
    }
  }

  console.log(dryRun ? "\nDry run. Re-run with --apply to write." : "\nApplied.");
}

main().finally(() => prisma.$disconnect());