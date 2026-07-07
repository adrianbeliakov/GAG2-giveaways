import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { TokenType } from "@prisma/client";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Creates a one-time token for the given email. Only the SHA-256 hash is
 * stored, so a database leak never exposes usable tokens. Any previous tokens
 * of the same type for the same email are invalidated.
 */
export async function createAuthToken(email: string, type: TokenType, ttlMinutes: number) {
  const identifier = email.toLowerCase();
  const raw = randomBytes(32).toString("hex");

  await prisma.authToken.deleteMany({ where: { identifier, type } });
  await prisma.authToken.create({
    data: {
      identifier,
      type,
      tokenHash: sha256(raw),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    },
  });

  return raw;
}

/**
 * Verifies and consumes a one-time token. Returns the email it belongs to, or
 * null if the token is invalid or expired.
 */
export async function consumeAuthToken(raw: string, type: TokenType): Promise<string | null> {
  const record = await prisma.authToken.findUnique({ where: { tokenHash: sha256(raw) } });
  if (!record || record.type !== type) return null;

  await prisma.authToken.delete({ where: { id: record.id } });
  if (record.expiresAt < new Date()) return null;

  return record.identifier;
}
