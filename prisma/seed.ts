/**
 * Seeds the bootstrap admin account from environment variables:
 *   ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !username || !password) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD in .env before seeding.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      username,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(), // the owner account is pre-verified
    },
  });

  console.log(`Admin ready: ${admin.username} <${admin.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
