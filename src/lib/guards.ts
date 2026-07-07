import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Loads the current user fresh from the database. Session tokens are JWTs, so
 * privileged checks must always re-read the database (bans / role changes take
 * effect immediately).
 */
export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Returns the user only if they are a non-banned ADMIN; otherwise null. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || user.banned) return null;
  return user;
}
